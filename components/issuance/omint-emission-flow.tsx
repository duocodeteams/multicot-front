"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/lib/issuance/types"
import type {
  OmintCatalogItem,
  OmintDocumentType,
  OmintEmergencyContact,
  OmintPassenger,
  OmintPaymentMethod,
  OmintPaymentReturnStatus,
  OmintSale,
} from "@/lib/issuance/omint-types"
import {
  saveOmintSaleContext,
  clearOmintReturnParamsFromUrl,
} from "@/lib/issuance/omint-session"
import {
  buildOmintPaymentReturnUrls,
  confirmSalePayment,
  createSale,
  createSalePayment,
  getOmintCountries,
  getOmintProvinces,
  getSale,
  postSalePassengers,
} from "@/lib/services"

type Step = "loading" | "passengers" | "payment" | "confirming" | "done" | "error"

type PassengerForm = {
  is_holder: boolean
  first_name: string
  last_name: string
  birth_date: string
  document_type: OmintDocumentType
  document_number: string
  email: string
  phone: string
  country_id: string
  province_id: string
  street: string
  street_number: string
  city: string
  /** Edad cotizada (referencia UI) */
  quotedAge?: number
}

type OmintEmissionFlowProps = {
  quoteId?: string
  plan?: SelectedPlan | null
  quotationData?: QuotationData | null
  /** Retomar venta existente (return URL o session) */
  initialSaleId?: string | null
  paymentReturn?: OmintPaymentReturnStatus | null
  onSaleAmountChange?: (amount: number | null, currency?: string) => void
  onBack?: () => void
}

function blankPassenger(isHolder: boolean, quotedAge?: number): PassengerForm {
  return {
    is_holder: isHolder,
    first_name: "",
    last_name: "",
    birth_date: "",
    document_type: "dni",
    document_number: "",
    email: "",
    phone: "",
    country_id: "",
    province_id: "",
    street: "",
    street_number: "",
    city: "",
    quotedAge,
  }
}

function suggestedBirthDate(age: number, departureDate: string): string {
  const dep = departureDate ? new Date(departureDate) : new Date()
  if (Number.isNaN(dep.getTime())) {
    const y = new Date().getFullYear() - age
    return `${y}-01-01`
  }
  const y = dep.getFullYear() - age
  const m = String(dep.getMonth() + 1).padStart(2, "0")
  const d = String(dep.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function mapSalePassengersToForm(
  sale: OmintSale,
  fallbackAges: number[],
  departureDate: string
): PassengerForm[] {
  if (sale.passengers && sale.passengers.length > 0) {
    return sale.passengers.map((p) => ({
      is_holder: Boolean(p.is_holder),
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      birth_date: p.birth_date ?? "",
      document_type: (p.document_type as OmintDocumentType) || "dni",
      document_number: p.document_number ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      country_id: p.country_id ?? "",
      province_id: p.province_id ?? "",
      street: p.street ?? "",
      street_number: p.street_number ?? "",
      city: p.city ?? "",
    }))
  }

  const ages = sale.quoted_ages?.length ? sale.quoted_ages : fallbackAges
  if (ages.length === 0) return [blankPassenger(true)]

  return ages.map((age, index) => ({
    ...blankPassenger(index === 0, age),
    birth_date: suggestedBirthDate(age, departureDate || sale.departure_date || ""),
  }))
}

const EMISSION_STATUS_LABELS: Record<string, string> = {
  product_selected: "Producto seleccionado",
  passengers_complete: "Pasajeros cargados",
  issued: "Emitido",
  emission_failed: "Emisión fallida",
}

function formatAmount(amount: number | string | null | undefined, currency?: string) {
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n)) return "—"
  const cur = (currency || "ARS").toUpperCase()
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `${cur} ${formatted}`
}

function emissionStatusLabel(status?: string | null) {
  if (!status) return ""
  return EMISSION_STATUS_LABELS[status] || status
}

function getApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Ocurrió un error"
}

export function OmintEmissionFlow({
  quoteId,
  plan,
  quotationData,
  initialSaleId,
  paymentReturn,
  onSaleAmountChange,
  onBack,
}: OmintEmissionFlowProps) {
  const [step, setStep] = useState<Step>("loading")
  const [sale, setSale] = useState<OmintSale | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [passengers, setPassengers] = useState<PassengerForm[]>([])
  const [emergency, setEmergency] = useState<OmintEmergencyContact>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })
  const [receivePromotions, setReceivePromotions] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [countries, setCountries] = useState<OmintCatalogItem[]>([])
  const [provinces, setProvinces] = useState<OmintCatalogItem[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [submittingPassengers, setSubmittingPassengers] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState<OmintPaymentMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string>("")
  const [selectedFinancingId, setSelectedFinancingId] = useState<string>("")
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const [confirmResult, setConfirmResult] = useState<{
    payment_received: boolean
    voucher_number?: string | null
    voucher_url?: string | null
  } | null>(null)

  const fallbackAges = (quotationData?.edades ?? [])
    .map((a) => Number(a))
    .filter((n) => Number.isFinite(n) && n >= 0)
  const departureDate = quotationData?.desde ?? ""

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedMethodId) ?? null,
    [paymentMethods, selectedMethodId]
  )

  const applySale = useCallback(
    (next: OmintSale) => {
      setSale(next)
      const parsedAmount = Number(next.amount)
      onSaleAmountChange?.(
        Number.isFinite(parsedAmount) ? parsedAmount : null,
        next.currency
      )
      if (next.payment_methods?.length) {
        setPaymentMethods(next.payment_methods)
      }
      if (plan && quotationData && quoteId) {
        saveOmintSaleContext({
          saleId: String(next.id),
          quoteId,
          plan,
          quotationData,
        })
      } else {
        saveOmintSaleContext({
          saleId: String(next.id),
          quoteId: next.quote_id || quoteId || "",
          plan: plan || {
            id: next.quote_id || String(next.id),
            name: next.plan_name || "Plan Omint",
            price: next.amount,
            pricePerDay: next.amount,
            priceArs: next.amount,
            badge: null,
            coverage: [],
            maxCoverage: "—",
            empresaCotizacion: next.company_name || "Omint",
            tarifaTotalUnPago: next.amount,
            tarifaNeta: next.amount,
            totalUsd: next.amount,
          },
          quotationData: quotationData || {
            destino: "",
            tipoViaje: "",
            desde: next.departure_date || "",
            hasta: "",
            edades: (next.quoted_ages || []).map(String),
            origen: "",
          },
        })
      }
    },
    [onSaleAmountChange, plan, quotationData, quoteId]
  )

  const resolveStepFromSale = useCallback(
    (next: OmintSale, returnStatus?: OmintPaymentReturnStatus | null) => {
      if (next.emission_status === "issued" || next.payment_status === "approved") {
        setConfirmResult({
          payment_received: true,
          voucher_number: next.voucher_number,
          voucher_url: next.voucher_url,
        })
        setStep("done")
        return
      }

      if (returnStatus === "ok" || returnStatus === "pending" || next.payment_status === "pending") {
        setStep("confirming")
        return
      }

      if (returnStatus === "error") {
        setErrorMessage("El pago no se completó. Podés reintentar con el mismo checkout o elegir otro medio.")
        if (next.emission_status === "passengers_complete") {
          setPaymentMethods(next.payment_methods || [])
          setStep("payment")
        } else {
          setStep("passengers")
        }
        return
      }

      if (next.emission_status === "passengers_complete") {
        setPaymentMethods(next.payment_methods || [])
        setStep("payment")
        return
      }

      if (next.emission_status === "emission_failed") {
        setErrorMessage("La emisión falló. Revisá los datos o contactá soporte.")
        setStep("error")
        return
      }

      setStep("passengers")
    },
    []
  )

  // Init: create or resume sale
  useEffect(() => {
    let cancelled = false

    async function boot() {
      setStep("loading")
      setErrorMessage(null)
      try {
        let next: OmintSale

        if (initialSaleId) {
          next = await getSale(initialSaleId)
        } else if (quoteId) {
          next = await createSale({ company: "omint", quote_id: quoteId })
        } else {
          throw new Error("Falta quote_id o sale_id para iniciar la emisión Omint")
        }

        if (cancelled) return
        applySale(next)

        const ages = next.quoted_ages?.length ? next.quoted_ages : fallbackAges
        setPassengers(mapSalePassengersToForm(next, ages, departureDate))
        if (next.emergency_contact) {
          setEmergency({
            first_name: next.emergency_contact.first_name || "",
            last_name: next.emergency_contact.last_name || "",
            phone: next.emergency_contact.phone || "",
            email: next.emergency_contact.email || "",
          })
        }
        if (typeof next.receive_promotions === "boolean") {
          setReceivePromotions(next.receive_promotions)
        }

        resolveStepFromSale(next, paymentReturn)
        if (paymentReturn) clearOmintReturnParamsFromUrl()
      } catch (err) {
        if (cancelled) return
        const message = getApiErrorMessage(err)
        setErrorMessage(message)
        setStep("error")
        toast.error("No se pudo iniciar la emisión Omint", { description: message })
      }
    }

    boot()
    return () => {
      cancelled = true
    }
    // Solo al montar / cambiar ids de entrada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSaleId, quoteId])

  // Confirm payment when returning from checkout
  useEffect(() => {
    if (step !== "confirming" || !sale?.id) return
    let cancelled = false

    async function runConfirm() {
      try {
        const result = await confirmSalePayment(sale!.id)
        if (cancelled) return
        setConfirmResult(result)
        if (result.payment_received) {
          const refreshed = await getSale(sale!.id)
          if (cancelled) return
          applySale(refreshed)
          setStep("done")
          toast.success("Emisión confirmada", {
            description: result.voucher_number
              ? `Voucher ${result.voucher_number}`
              : "Pago recibido",
          })
        } else {
          const refreshed = await getSale(sale!.id)
          if (cancelled) return
          applySale(refreshed)
          setPaymentMethods(refreshed.payment_methods || paymentMethods)
          setStep("payment")
          toast.message("Pago pendiente", {
            description: "Omint todavía no confirmó el cobro. No hace falta abrir otro checkout.",
          })
        }
      } catch (err) {
        if (cancelled) return
        const message = getApiErrorMessage(err)
        setErrorMessage(message)
        setStep("payment")
        toast.error("No se pudo confirmar el pago", { description: message })
      }
    }

    runConfirm()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sale?.id])

  // Countries catalog
  useEffect(() => {
    let cancelled = false
    async function loadCountries() {
      try {
        const items = await getOmintCountries()
        if (!cancelled) setCountries(items)
      } catch (err) {
        if (!cancelled) {
          toast.error("No se pudieron cargar los países", {
            description: getApiErrorMessage(err),
          })
        }
      }
    }
    loadCountries()
    return () => {
      cancelled = true
    }
  }, [])

  const holderCountryId = passengers.find((p) => p.is_holder)?.country_id || ""

  useEffect(() => {
    if (!holderCountryId) {
      setProvinces([])
      return
    }
    let cancelled = false
    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const items = await getOmintProvinces(holderCountryId)
        if (!cancelled) setProvinces(items)
      } catch (err) {
        if (!cancelled) {
          setProvinces([])
          toast.error("No se pudieron cargar las provincias", {
            description: getApiErrorMessage(err),
          })
        }
      } finally {
        if (!cancelled) setLoadingProvinces(false)
      }
    }
    loadProvinces()
    return () => {
      cancelled = true
    }
  }, [holderCountryId])

  const updatePassenger = (index: number, patch: Partial<PassengerForm>) => {
    setPassengers((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const next = { ...p, ...patch }
        if (patch.country_id && patch.country_id !== p.country_id) {
          next.province_id = ""
        }
        return next
      })
    )
  }

  const validatePassengers = (): boolean => {
    const errors: Record<string, string> = {}
    const docs = new Set<string>()

    if (!emergency.first_name.trim()) errors["emergency.first_name"] = "Requerido"
    if (!emergency.last_name.trim()) errors["emergency.last_name"] = "Requerido"
    if (!emergency.phone.trim()) errors["emergency.phone"] = "Requerido"
    if (!emergency.email.trim()) errors["emergency.email"] = "Requerido"

    passengers.forEach((p, index) => {
      const prefix = `p.${index}`
      if (!p.first_name.trim()) errors[`${prefix}.first_name`] = "Requerido"
      if (!p.last_name.trim()) errors[`${prefix}.last_name`] = "Requerido"
      if (!p.birth_date) errors[`${prefix}.birth_date`] = "Requerido"
      if (!p.document_number.trim()) errors[`${prefix}.document_number`] = "Requerido"

      const docKey = `${p.document_type}:${p.document_number.trim()}`
      if (p.document_number.trim()) {
        if (docs.has(docKey)) {
          errors[`${prefix}.document_number`] = "Documento duplicado"
        }
        docs.add(docKey)
      }

      if (p.is_holder) {
        if (!p.email.trim()) errors[`${prefix}.email`] = "Requerido"
        if (!p.phone.trim()) errors[`${prefix}.phone`] = "Requerido"
        if (!p.country_id) errors[`${prefix}.country_id`] = "Requerido"
        if (!p.province_id) errors[`${prefix}.province_id`] = "Requerido"
        if (!p.street.trim()) errors[`${prefix}.street`] = "Requerido"
        if (!p.street_number.trim()) errors[`${prefix}.street_number`] = "Requerido"
        if (!p.city.trim()) errors[`${prefix}.city`] = "Requerido"
      }
    })

    const holders = passengers.filter((p) => p.is_holder)
    if (holders.length !== 1) {
      errors.holder = "Debe haber exactamente un titular"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitPassengers = async () => {
    if (!sale?.id) return
    if (!validatePassengers()) {
      toast.error("Revisá los datos de pasajeros")
      return
    }

    const countryName = (id: string) => countries.find((c) => c.id === id)?.name || ""
    const provinceName = (id: string) => provinces.find((p) => p.id === id)?.name || ""

    const payloadPassengers: OmintPassenger[] = passengers.map((p) => {
      const base: OmintPassenger = {
        is_holder: p.is_holder,
        first_name: p.first_name.trim(),
        last_name: p.last_name.trim(),
        birth_date: p.birth_date,
        document_type: p.document_type,
        document_number: p.document_number.trim(),
      }
      if (p.is_holder) {
        base.email = p.email.trim()
        base.phone = p.phone.trim()
        base.country_id = p.country_id
        base.province_id = p.province_id
        base.country = countryName(p.country_id)
        base.province = provinceName(p.province_id)
        base.street = p.street.trim()
        base.street_number = p.street_number.trim()
        base.city = p.city.trim()
      }
      return base
    })

    setSubmittingPassengers(true)
    try {
      const passengersResult = await postSalePassengers(sale.id, {
        receive_promotions: receivePromotions,
        emergency_contact: {
          first_name: emergency.first_name.trim(),
          last_name: emergency.last_name.trim(),
          phone: emergency.phone.trim(),
          email: emergency.email.trim(),
        },
        passengers: payloadPassengers,
      })
      // POST /passengers no trae amount; refrescamos la venta completa.
      const refreshed = await getSale(sale.id)
      applySale({
        ...refreshed,
        emission_status:
          (passengersResult.emission_status as OmintSale["emission_status"]) ||
          refreshed.emission_status,
        payment_methods: passengersResult.payment_methods || refreshed.payment_methods,
        passengers: passengersResult.passengers || refreshed.passengers,
        emergency_contact:
          passengersResult.emergency_contact || refreshed.emergency_contact,
      })
      setPaymentMethods(passengersResult.payment_methods || refreshed.payment_methods || [])
      setStep("payment")
      toast.success("Pasajeros guardados")
    } catch (err) {
      toast.error("No se pudieron guardar los pasajeros", {
        description: getApiErrorMessage(err),
      })
    } finally {
      setSubmittingPassengers(false)
    }
  }

  const handleStartPayment = async () => {
    if (!sale?.id) return
    if (!selectedMethodId) {
      toast.error("Elegí un medio de pago")
      return
    }
    if (selectedMethod?.requires_financing && !selectedFinancingId) {
      toast.error("Elegí la financiación")
      return
    }

    setSubmittingPayment(true)
    try {
      // Si ya hay checkout pendiente, reutilizar
      if (sale.checkout_url && sale.payment_status === "pending") {
        window.location.href = sale.checkout_url
        return
      }

      const urls = buildOmintPaymentReturnUrls(sale.id)
      const body: Parameters<typeof createSalePayment>[1] = {
        payment_method_id: selectedMethodId,
        ...urls,
      }
      if (selectedMethod?.requires_financing && selectedFinancingId) {
        body.financing_id = selectedFinancingId
      }

      const result = await createSalePayment(sale.id, body)
      const refreshed = await getSale(sale.id)
      applySale(refreshed)
      window.location.href = result.checkout_url
    } catch (err) {
      toast.error("No se pudo abrir el pago", {
        description: getApiErrorMessage(err),
      })
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleRetryConfirm = async () => {
    if (!sale?.id) return
    setStep("confirming")
  }

  if (step === "loading" || step === "confirming") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {step === "confirming" ? "Confirmando pago con Omint…" : "Preparando emisión Omint…"}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (step === "error") {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-destructive" />
            No se pudo continuar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="w-fit">
              Volver
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === "done") {
    return (
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Emisión completada
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sale && (
            <p className="text-sm text-muted-foreground">
              Total cobrado por Omint:{" "}
              <span className="font-semibold text-foreground">
                {formatAmount(sale.amount, sale.currency)}
              </span>
            </p>
          )}
          {(confirmResult?.voucher_number || sale?.voucher_number) && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Nº de voucher</p>
              <p className="font-mono font-medium">
                {confirmResult?.voucher_number || sale?.voucher_number}
              </p>
            </div>
          )}
          {(confirmResult?.voucher_url || sale?.voucher_url) && (
            <a
              href={(confirmResult?.voucher_url || sale?.voucher_url) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver voucher
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === "payment") {
    return (
      <div className="flex flex-col gap-4">
        {errorMessage && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {errorMessage}
          </div>
        )}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Medio de pago
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              El cobro lo procesa Omint en su checkout.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sale && (
              <div className="rounded-lg bg-primary/8 border border-primary/15 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Importe Omint
                </p>
                <p className="text-2xl font-bold">{formatAmount(sale.amount, sale.currency)}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Método</Label>
              <Select
                value={selectedMethodId}
                onValueChange={(v) => {
                  setSelectedMethodId(v)
                  setSelectedFinancingId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code}
                      {m.requires_financing ? " (con financiación)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMethod?.requires_financing && (
              <div className="flex flex-col gap-2">
                <Label>Financiación</Label>
                <Select value={selectedFinancingId} onValueChange={setSelectedFinancingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná cuotas" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedMethod.financing || []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.dues} cuota{f.dues === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sale?.checkout_url && sale.payment_status === "pending" && (
              <p className="text-xs text-muted-foreground">
                Ya hay un checkout pendiente. Se reutilizará la misma URL (no se abre otro cobro).
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setStep("passengers")}
                disabled={submittingPayment}
              >
                Volver a pasajeros
              </Button>
              <Button onClick={handleStartPayment} disabled={submittingPayment} className="gap-2">
                {submittingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Ir a pagar
              </Button>
              {sale?.payment_status === "pending" && (
                <Button variant="secondary" onClick={handleRetryConfirm} disabled={submittingPayment}>
                  Ya pagué — confirmar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // passengers step
  return (
    <div className="flex flex-col gap-4">
      {sale && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <Badge variant="outline">{emissionStatusLabel(sale.emission_status)}</Badge>
          <span className="font-semibold tabular-nums">
            {formatAmount(sale.amount, sale.currency)}
          </span>
        </div>
      )}

      {passengers.map((p, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {p.is_holder ? "Titular" : `Pasajero ${index + 1}`}
              {typeof p.quotedAge === "number" && (
                <span className="text-xs font-normal text-muted-foreground">
                  Edad cotizada: {p.quotedAge}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Nombre"
              error={fieldErrors[`p.${index}.first_name`]}
              value={p.first_name}
              onChange={(v) => updatePassenger(index, { first_name: v })}
            />
            <Field
              label="Apellido"
              error={fieldErrors[`p.${index}.last_name`]}
              value={p.last_name}
              onChange={(v) => updatePassenger(index, { last_name: v })}
            />
            <Field
              label="Fecha de nacimiento"
              type="date"
              error={fieldErrors[`p.${index}.birth_date`]}
              value={p.birth_date}
              onChange={(v) => updatePassenger(index, { birth_date: v })}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de documento</Label>
              <Select
                value={p.document_type}
                onValueChange={(v) =>
                  updatePassenger(index, { document_type: v as OmintDocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                  <SelectItem value="cuit">CUIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Nº de documento"
              error={fieldErrors[`p.${index}.document_number`]}
              value={p.document_number}
              onChange={(v) => updatePassenger(index, { document_number: v })}
            />

            {p.is_holder && (
              <>
                <Field
                  label="Email"
                  type="email"
                  error={fieldErrors[`p.${index}.email`]}
                  value={p.email}
                  onChange={(v) => updatePassenger(index, { email: v })}
                />
                <Field
                  label="Teléfono"
                  error={fieldErrors[`p.${index}.phone`]}
                  value={p.phone}
                  onChange={(v) => updatePassenger(index, { phone: v })}
                />
                <div className="flex flex-col gap-1.5">
                  <Label>País</Label>
                  <Select
                    value={p.country_id}
                    onValueChange={(v) => updatePassenger(index, { country_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors[`p.${index}.country_id`] && (
                    <p className="text-xs text-destructive">{fieldErrors[`p.${index}.country_id`]}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Provincia</Label>
                  <Select
                    value={p.province_id}
                    onValueChange={(v) => updatePassenger(index, { province_id: v })}
                    disabled={!p.country_id || loadingProvinces}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingProvinces ? "Cargando…" : "Seleccioná provincia"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors[`p.${index}.province_id`] && (
                    <p className="text-xs text-destructive">
                      {fieldErrors[`p.${index}.province_id`]}
                    </p>
                  )}
                </div>
                <Field
                  label="Calle"
                  error={fieldErrors[`p.${index}.street`]}
                  value={p.street}
                  onChange={(v) => updatePassenger(index, { street: v })}
                />
                <Field
                  label="Número"
                  error={fieldErrors[`p.${index}.street_number`]}
                  value={p.street_number}
                  onChange={(v) => updatePassenger(index, { street_number: v })}
                />
                <Field
                  label="Ciudad"
                  error={fieldErrors[`p.${index}.city`]}
                  value={p.city}
                  onChange={(v) => updatePassenger(index, { city: v })}
                />
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contacto de emergencia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Nombre"
            error={fieldErrors["emergency.first_name"]}
            value={emergency.first_name}
            onChange={(v) => setEmergency((e) => ({ ...e, first_name: v }))}
          />
          <Field
            label="Apellido"
            error={fieldErrors["emergency.last_name"]}
            value={emergency.last_name}
            onChange={(v) => setEmergency((e) => ({ ...e, last_name: v }))}
          />
          <Field
            label="Teléfono"
            error={fieldErrors["emergency.phone"]}
            value={emergency.phone}
            onChange={(v) => setEmergency((e) => ({ ...e, phone: v }))}
          />
          <Field
            label="Email"
            type="email"
            error={fieldErrors["emergency.email"]}
            value={emergency.email}
            onChange={(v) => setEmergency((e) => ({ ...e, email: v }))}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Checkbox
          id="omint-promos"
          checked={receivePromotions}
          onCheckedChange={(v) => setReceivePromotions(v === true)}
        />
        <Label htmlFor="omint-promos" className="text-sm font-normal cursor-pointer">
          Quiero recibir promociones
        </Label>
      </div>

      {fieldErrors.holder && (
        <p className="text-sm text-destructive">{fieldErrors.holder}</p>
      )}

      <Button
        onClick={handleSubmitPassengers}
        disabled={submittingPassengers}
        className="w-full sm:w-auto gap-2 self-start"
      >
        {submittingPassengers ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        Continuar al pago
      </Button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
