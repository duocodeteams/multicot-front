"use client"

/**
 * Flujo de emisión Inter Assist (convive con Omint).
 * Orden: sale + quote snapshot → pasajeros → payment simulado → simulate → confirm.
 */

import { useCallback, useEffect, useState } from "react"
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
import type { SimulatePaymentResult } from "@/lib/issuance/inter-assist-types"
import {
  buildInterAssistQuoteSnapshot,
  clearSaleReturnParamsFromUrl,
  resolveInterAssistQuoteId,
  saveInterAssistSaleContext,
} from "@/lib/issuance/inter-assist-session"
import type {
  Sale,
  SaleDocumentType,
  SaleEmergencyContact,
  SalePassenger,
  SalePaymentMethod,
  SalePaymentReturnStatus,
} from "@/lib/issuance/sales-types"
import {
  buildSalePaymentReturnUrls,
  confirmSalePayment,
  createSalePayment,
  getSale,
  openOrResumeSale,
  openSaleVoucherPdf,
  postSalePassengers,
  simulateSalePayment,
} from "@/lib/services"
import { interAssistStorageKey, persistOpenSale } from "@/lib/issuance/sale-persistence"
import { useSaleLocationCatalog } from "@/hooks/use-sale-location-catalog"
import { SaleLocationSelects } from "@/components/issuance/sale-location-selects"

type Step =
  | "loading"
  | "passengers"
  | "payment"
  | "simulating"
  | "confirming"
  | "done"
  | "error"

type PassengerForm = {
  is_holder: boolean
  first_name: string
  last_name: string
  birth_date: string
  document_type: SaleDocumentType
  document_number: string
  email: string
  phone: string
  country_id: string
  province_id: string
  country: string
  province: string
  street: string
  street_number: string
  city: string
  quotedAge?: number
}

type InterAssistEmissionFlowProps = {
  plan?: SelectedPlan | null
  quotationData?: QuotationData | null
  initialSaleId?: string | null
  paymentReturn?: SalePaymentReturnStatus | null
  onSaleAmountChange?: (amount: number | null, currency?: string) => void
  onBack?: () => void
}

const EMISSION_STATUS_LABELS: Record<string, string> = {
  product_selected: "Producto seleccionado",
  passengers_complete: "Pasajeros cargados",
  emitting: "Emitiendo voucher",
  issued: "Emitido",
  emission_failed: "Emisión fallida",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_started: "Sin cobro",
  pending: "Pago pendiente",
  approved: "Pago aprobado",
  rejected: "Pago rechazado",
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
    country_id: "AR",
    province_id: "",
    country: "Argentina",
    province: "",
    street: "",
    street_number: "",
    city: "",
    quotedAge,
  }
}

function suggestedBirthDate(age: number, departureDate: string): string {
  const dep = departureDate ? new Date(departureDate) : new Date()
  if (Number.isNaN(dep.getTime())) {
    return `${new Date().getFullYear() - age}-01-01`
  }
  const y = dep.getFullYear() - age
  const m = String(dep.getMonth() + 1).padStart(2, "0")
  const d = String(dep.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function mapSalePassengersToForm(
  sale: Sale,
  fallbackAges: number[],
  departureDate: string
): PassengerForm[] {
  if (sale.passengers && sale.passengers.length > 0) {
    return sale.passengers.map((p) => ({
      is_holder: Boolean(p.is_holder),
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      birth_date: p.birth_date ?? "",
      document_type: (p.document_type as SaleDocumentType) || "dni",
      document_number: p.document_number ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      country_id: p.country_id || p.country || "AR",
      province_id: p.province_id || p.province || "",
      country: p.country || "Argentina",
      province: p.province || "",
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

function formatAmount(amount: number | string | null | undefined, currency?: string) {
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n)) return "—"
  const cur = (currency || "USD").toUpperCase()
  return `${cur} ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`
}

function getApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Ocurrió un error"
}

export function InterAssistEmissionFlow({
  plan,
  quotationData,
  initialSaleId,
  paymentReturn,
  onSaleAmountChange,
  onBack,
}: InterAssistEmissionFlowProps) {
  const [step, setStep] = useState<Step>("loading")
  const [sale, setSale] = useState<Sale | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [passengers, setPassengers] = useState<PassengerForm[]>([])
  const [emergency, setEmergency] = useState<SaleEmergencyContact>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })
  const [receivePromotions, setReceivePromotions] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submittingPassengers, setSubmittingPassengers] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState<SalePaymentMethod[]>([])
  const [busyPayment, setBusyPayment] = useState(false)

  const [confirmResult, setConfirmResult] = useState<{
    payment_received: boolean
    voucher_number?: string | null
    voucher_url?: string | null
  } | null>(null)
  const [openingVoucher, setOpeningVoucher] = useState(false)

  const fallbackAges = (quotationData?.edades ?? [])
    .map((a) => Number(a))
    .filter((n) => Number.isFinite(n) && n >= 0)
  const departureDate = quotationData?.desde ?? ""

  const applySale = useCallback(
    (next: Sale) => {
      setSale(next)
      const parsedAmount = Number(next.amount)
      onSaleAmountChange?.(
        Number.isFinite(parsedAmount) ? parsedAmount : null,
        next.currency
      )
      if (next.payment_methods?.length) {
        setPaymentMethods(next.payment_methods)
      }
      if (plan && quotationData) {
        const quoteId = resolveInterAssistQuoteId(plan)
        const quote = buildInterAssistQuoteSnapshot(plan, quotationData)
        const storageKey = interAssistStorageKey(quoteId, quote)
        persistOpenSale({
          company: "inter_assist",
          quoteId,
          storageKey,
          saleId: next.id,
          plan,
          quotationData,
        })
        saveInterAssistSaleContext({
          company: "inter_assist",
          saleId: String(next.id),
          quoteId,
          plan,
          quotationData,
        })
      }
    },
    [onSaleAmountChange, plan, quotationData]
  )

  const resolveStepFromSale = useCallback(
    (next: Sale, returnStatus?: SalePaymentReturnStatus | null) => {
      // Venta ya finalizada: retomar voucher, no reiniciar el flujo.
      if (next.emission_status === "issued") {
        setConfirmResult({
          payment_received: true,
          voucher_number: next.voucher_number,
          voucher_url: next.voucher_url,
        })
        setStep("done")
        return
      }

      if (next.payment_status === "rejected") {
        setErrorMessage("El pago fue rechazado. Podés iniciar un nuevo cobro simulado.")
        setStep("payment")
        return
      }

      if (
        returnStatus === "ok" ||
        returnStatus === "pending" ||
        next.payment_status === "pending"
      ) {
        setStep("payment")
        return
      }

      if (returnStatus === "error") {
        setErrorMessage("Hubo un problema con el cobro. Reintentá desde esta pantalla.")
        setStep("payment")
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

      if (next.emission_status === "emitting") {
        setStep("confirming")
        return
      }

      setStep("passengers")
    },
    [plan, quotationData]
  )

  useEffect(() => {
    let cancelled = false

    async function boot() {
      setStep("loading")
      setErrorMessage(null)
      try {
        if (!plan || !quotationData) {
          if (!initialSaleId) {
            throw new Error("Faltan plan/cotización o sale_id para Inter Assist")
          }
          const next = await getSale(initialSaleId)
          if (cancelled) return
          applySale(next)
          setPassengers(mapSalePassengersToForm(next, fallbackAges, departureDate))
          if (next.emergency_contact) {
            setEmergency({
              first_name: next.emergency_contact.first_name || "",
              last_name: next.emergency_contact.last_name || "",
              phone: next.emergency_contact.phone || "",
              email: next.emergency_contact.email || "",
            })
          }
          resolveStepFromSale(next, paymentReturn)
          if (paymentReturn) clearSaleReturnParamsFromUrl()
          return
        }

        const quoteId = resolveInterAssistQuoteId(plan)
        const quote = buildInterAssistQuoteSnapshot(plan, quotationData)
        const storageKey = interAssistStorageKey(quoteId, quote)
        const next = await openOrResumeSale({
          company: "inter_assist",
          quoteId,
          storageKey,
          preferredSaleId: initialSaleId,
          createPayload: {
            company: "inter_assist",
            quote_id: quoteId,
            quote,
          },
          plan,
          quotationData,
        })

        if (cancelled) return
        applySale(next)
        setPassengers(mapSalePassengersToForm(next, fallbackAges, departureDate))
        if (next.emergency_contact) {
          setEmergency({
            first_name: next.emergency_contact.first_name || "",
            last_name: next.emergency_contact.last_name || "",
            phone: next.emergency_contact.phone || "",
            email: next.emergency_contact.email || "",
          })
        }
        resolveStepFromSale(next, paymentReturn)
        if (paymentReturn) clearSaleReturnParamsFromUrl()
      } catch (err) {
        if (cancelled) return
        const message = getApiErrorMessage(err)
        setErrorMessage(message)
        setStep("error")
        toast.error("No se pudo iniciar la emisión Inter Assist", { description: message })
      }
    }

    boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSaleId, plan?.id])

  const holderCountryId = passengers.find((p) => p.is_holder)?.country_id || ""
  const {
    countries,
    provinces,
    loadingCountries,
    loadingProvinces,
    provinceRequired,
  } = useSaleLocationCatalog("inter_assist", holderCountryId)

  const updatePassenger = (index: number, patch: Partial<PassengerForm>) => {
    setPassengers((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const next = { ...p, ...patch }
        if (patch.country_id && patch.country_id !== p.country_id) {
          next.province_id = ""
          next.province = ""
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

      const docKey = `${p.document_type}:${p.document_number.trim().toLowerCase()}`
      if (p.document_number.trim()) {
        if (docs.has(docKey)) errors[`${prefix}.document_number`] = "Documento duplicado"
        docs.add(docKey)
      }

      if (p.is_holder) {
        if (!p.email.trim()) errors[`${prefix}.email`] = "Requerido"
        if (!p.phone.trim()) errors[`${prefix}.phone`] = "Requerido"
        if (!p.country_id.trim()) errors[`${prefix}.country_id`] = "Requerido"
        // Inter Assist: provincias solo para AR; otros países → items []
        const needsProvince =
          p.country_id === "AR" || provinces.length > 0
        if (needsProvince && !p.province_id.trim()) {
          errors[`${prefix}.province_id`] = "Requerido"
        }
        if (!p.street.trim()) errors[`${prefix}.street`] = "Requerido"
        if (!p.street_number.trim()) errors[`${prefix}.street_number`] = "Requerido"
        if (!p.city.trim()) errors[`${prefix}.city`] = "Requerido"
      }
    })

    if (passengers.filter((p) => p.is_holder).length !== 1) {
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

    const payloadPassengers: SalePassenger[] = passengers.map((p) => {
      const base: SalePassenger = {
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
        base.country_id = p.country_id.trim()
        base.province_id = p.province_id.trim()
        base.country = p.country.trim() || countryName(p.country_id) || "Argentina"
        base.province = p.province.trim() || provinceName(p.province_id)
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
      const refreshed = await getSale(sale.id)
      applySale({
        ...refreshed,
        emission_status: passengersResult.emission_status || refreshed.emission_status,
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
    setBusyPayment(true)
    setErrorMessage(null)
    try {
      const urls = buildSalePaymentReturnUrls(sale.id)
      await createSalePayment(sale.id, {
        payment_method_id: "simulated",
        ...urls,
      })
      const refreshed = await getSale(sale.id)
      applySale(refreshed)
      toast.success("Cobro simulado abierto", {
        description: "Elegí el resultado del pago para continuar",
      })
    } catch (err) {
      toast.error("No se pudo abrir el cobro", { description: getApiErrorMessage(err) })
    } finally {
      setBusyPayment(false)
    }
  }

  const handleSimulate = async (result: SimulatePaymentResult) => {
    if (!sale?.id) return
    setBusyPayment(true)
    setStep("simulating")
    setErrorMessage(null)
    try {
      // Si todavía no hay checkout pendiente, lo abrimos primero
      if (sale.payment_status === "not_started" || !sale.payment_status) {
        const urls = buildSalePaymentReturnUrls(sale.id)
        await createSalePayment(sale.id, {
          payment_method_id: "simulated",
          ...urls,
        })
      }

      await simulateSalePayment(sale.id, { result })
      const afterSim = await getSale(sale.id)
      applySale(afterSim)

      if (result === "rejected") {
        setErrorMessage("Pago rechazado (simulación).")
        setStep("payment")
        toast.error("Pago rechazado")
        return
      }

      if (result === "pending") {
        setStep("payment")
        toast.message("Pago pendiente", {
          description: "Podés confirmar más tarde o simular approved",
        })
        return
      }

      // approved → confirm para emitir voucher en Inter Assist
      setStep("confirming")
      const confirm = await confirmSalePayment(sale.id)
      const refreshed = await getSale(sale.id)
      applySale(refreshed)
      setConfirmResult(confirm)

      if (confirm.payment_received) {
        // Mantener sale_id para retomar por GET + emission_status=issued
        setStep("done")
        toast.success("Emisión Inter Assist completada", {
          description: confirm.voucher_number
            ? `Voucher ${confirm.voucher_number}`
            : "Voucher generado",
        })
      } else {
        setStep("payment")
        toast.message("El pago sigue pendiente")
      }
    } catch (err) {
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      setStep("payment")
      toast.error("No se pudo completar el pago/emisión", { description: message })
    } finally {
      setBusyPayment(false)
    }
  }

  const handleConfirmPending = async () => {
    if (!sale?.id) return
    setBusyPayment(true)
    setStep("confirming")
    try {
      const confirm = await confirmSalePayment(sale.id)
      const refreshed = await getSale(sale.id)
      applySale(refreshed)
      setConfirmResult(confirm)
      if (confirm.payment_received) {
        setStep("done")
        toast.success("Emisión completada")
      } else {
        setStep("payment")
        toast.message("Pago aún pendiente")
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err))
      setStep("payment")
      toast.error("No se pudo confirmar", { description: getApiErrorMessage(err) })
    } finally {
      setBusyPayment(false)
    }
  }

  if (step === "loading" || step === "simulating" || step === "confirming") {
    const label =
      step === "confirming"
        ? "Confirmando pago y emitiendo voucher…"
        : step === "simulating"
          ? "Simulando resultado de pago…"
          : "Preparando emisión Inter Assist…"
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    )
  }

  if (step === "error") {
    const canRetryConfirm =
      sale?.emission_status === "emission_failed" &&
      (sale?.payment_status === "approved" || sale?.payment_status === "pending")
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
          <div className="flex flex-wrap gap-2">
            {canRetryConfirm && (
              <Button
                onClick={() => void handleConfirmPending()}
                disabled={busyPayment}
                className="w-fit gap-2"
              >
                {busyPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reintentar confirmación
              </Button>
            )}
            {onBack && (
              <Button variant="outline" onClick={onBack} className="w-fit">
                Volver
              </Button>
            )}
          </div>
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
            Emisión Inter Assist completada
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sale && (
            <p className="text-sm text-muted-foreground">
              Importe:{" "}
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
          {sale?.id && (
            <Button
              className="w-full sm:w-auto gap-2"
              disabled={openingVoucher}
              onClick={async () => {
                setOpeningVoucher(true)
                try {
                  // Proxy JWT: no abrir URL de Inter Assist (401 sin API Key)
                  await openSaleVoucherPdf(sale.id, "es")
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "No se pudo abrir el voucher"
                  toast.error("Error al abrir voucher", { description: message })
                } finally {
                  setOpeningVoucher(false)
                }
              }}
            >
              {openingVoucher ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Ver voucher PDF
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === "payment") {
    const pending = sale?.payment_status === "pending"
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
              Pago (pasarela propia)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              El cobro es simulado. Inter Assist emite el voucher recién cuando el pago está
              aprobado.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sale && (
              <div className="rounded-lg bg-primary/8 border border-primary/15 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Importe
                </p>
                <p className="text-2xl font-bold">{formatAmount(sale.amount, sale.currency)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {EMISSION_STATUS_LABELS[String(sale.emission_status)] ||
                      sale.emission_status}
                  </Badge>
                  <Badge variant="secondary">
                    {PAYMENT_STATUS_LABELS[String(sale.payment_status)] || sale.payment_status}
                  </Badge>
                </div>
              </div>
            )}

            {paymentMethods.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Medio: {paymentMethods.map((m) => m.code).join(", ")}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("passengers")}
                disabled={busyPayment}
              >
                Volver a pasajeros
              </Button>
              {!pending && (
                <Button onClick={handleStartPayment} disabled={busyPayment} className="gap-2">
                  {busyPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Abrir cobro simulado
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
              <p className="text-sm font-medium">Simular resultado del pago</p>
              <p className="text-xs text-muted-foreground">
                Equivale a `POST /payment/simulate` + confirm cuando corresponde.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busyPayment}
                  onClick={() => handleSimulate("approved")}
                  className="gap-2"
                >
                  Aprobado → emitir
                </Button>
                <Button
                  variant="secondary"
                  disabled={busyPayment}
                  onClick={() => handleSimulate("pending")}
                >
                  Pendiente
                </Button>
                <Button
                  variant="destructive"
                  disabled={busyPayment}
                  onClick={() => handleSimulate("rejected")}
                >
                  Rechazado
                </Button>
                {pending && (
                  <Button variant="outline" disabled={busyPayment} onClick={handleConfirmPending}>
                    Confirmar estado
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // passengers
  return (
    <div className="flex flex-col gap-4">
      {sale && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <Badge variant="outline">
            {EMISSION_STATUS_LABELS[String(sale.emission_status)] || sale.emission_status}
          </Badge>
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
                  updatePassenger(index, { document_type: v as SaleDocumentType })
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
                <SaleLocationSelects
                  countries={countries}
                  provinces={provinces}
                  loadingCountries={loadingCountries}
                  loadingProvinces={loadingProvinces}
                  provinceRequired={provinceRequired}
                  value={{
                    country_id: p.country_id,
                    country: p.country,
                    province_id: p.province_id,
                    province: p.province,
                  }}
                  onChange={(next) => updatePassenger(index, next)}
                  countryError={fieldErrors[`p.${index}.country_id`]}
                  provinceError={fieldErrors[`p.${index}.province_id`]}
                />
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
          id="inter-assist-promos"
          checked={receivePromotions}
          onCheckedChange={(v) => setReceivePromotions(v === true)}
        />
        <Label htmlFor="inter-assist-promos" className="text-sm font-normal cursor-pointer">
          Quiero recibir promociones
        </Label>
      </div>

      {fieldErrors.holder && <p className="text-sm text-destructive">{fieldErrors.holder}</p>}

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
