"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Layers,
  Search,
  RefreshCw,
  Building2,
  Plus,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { listCompanies, updateCompany } from "@/lib/services/companies.service"
import {
  PLAN_DESTINATION_OPTIONS,
  createPlan,
  deletePlan,
  getPlanMarkupTotal,
  listPlans,
  parseMarkupField,
  parseMarkupPercent,
  updatePlan,
} from "@/lib/services/plans.service"
import { mapCompanyToFormalCompany } from "@/lib/services/quotes.mapper"
import type {
  CompanyResponse,
  CreatePlanRequest,
  PlanDestination,
  PlanDestinationId,
  PlanResponse,
} from "@/lib/services/types"

type MarkupValues = {
  producer_markup: number
  organizer_markup: number
  operating_expenses: number
}

type ConfirmState =
  | { type: "company-active"; company: CompanyResponse; nextActive: boolean }
  | {
      type: "plan-markup"
      plan: PlanResponse
      next: MarkupValues
    }
  | { type: "plan-active"; plan: PlanResponse; nextActive: boolean }
  | {
      type: "plan-destination"
      plan: PlanResponse
      destinationId: PlanDestinationId
      nextEnabled: boolean
    }
  | { type: "plan-delete"; plan: PlanResponse }
  | {
      type: "plan-create"
      data: CreatePlanRequest
      isFirstPlanForCompany: boolean
      companyName: string
    }
  | {
      type: "bulk-destination"
      planIds: number[]
      destinationId: PlanDestinationId
      nextEnabled: boolean
    }

function normalizeDestinations(destinations: PlanDestination[] | undefined): PlanDestination[] {
  const map = new Map((destinations ?? []).map((d) => [d.destination_id, d.enabled]))
  return PLAN_DESTINATION_OPTIONS.map((d) => ({
    destination_id: d.id,
    enabled: map.get(d.id) ?? false,
  }))
}

function destinationLabel(id: PlanDestinationId) {
  return PLAN_DESTINATION_OPTIONS.find((d) => d.id === id)?.label ?? String(id)
}

export function AdminPlansManagement() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [plans, setPlans] = useState<PlanResponse[]>([])
  const [plansTotal, setPlansTotal] = useState(0)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [companiesReady, setCompaniesReady] = useState(false)
  const [plansReady, setPlansReady] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Filtros planes
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [destinationFilter, setDestinationFilter] = useState<string>("all")
  const [showInactivePlans, setShowInactivePlans] = useState(false)
  const [planSearch, setPlanSearch] = useState("")
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([])
  const [bulkDestinationId, setBulkDestinationId] = useState<string>("")
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)

  // Alta
  const [createOpen, setCreateOpen] = useState(false)
  const [createCompanyId, setCreateCompanyId] = useState<string>("")
  const [createExternalId, setCreateExternalId] = useState("")
  const [createName, setCreateName] = useState("")
  const [createProductor, setCreateProductor] = useState("0")
  const [createOrganizador, setCreateOrganizador] = useState("0")
  const [createGastos, setCreateGastos] = useState("0")

  // Edición de markup
  const [markupEditPlan, setMarkupEditPlan] = useState<PlanResponse | null>(null)
  const [editProductor, setEditProductor] = useState("0")
  const [editOrganizador, setEditOrganizador] = useState("0")
  const [editGastos, setEditGastos] = useState("0")

  const isAdmin =
    String(user?.role ?? "").toLowerCase() === "admin" ||
    String(user?.role ?? "") === "1"

  const loadCompanies = useCallback(async () => {
    setIsLoadingCompanies(true)
    try {
      const res = await listCompanies({ limit: 100, offset: 0 })
      setCompanies(res.items ?? [])
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar compañías", {
        description: error instanceof Error ? error.message : "No se pudo listar compañías",
      })
    } finally {
      setIsLoadingCompanies(false)
      setCompaniesReady(true)
    }
  }, [])

  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true)
    try {
      const params: Parameters<typeof listPlans>[0] = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      }
      if (companyFilter !== "all") params.company_id = Number(companyFilter)
      if (destinationFilter !== "all") {
        params.destination_id = Number(destinationFilter) as PlanDestinationId
      }
      // Sin active = solo activos. active=false = todos (incluye baja lógica).
      if (showInactivePlans) params.active = false

      const res = await listPlans(params)
      setPlans(res.items ?? [])
      setPlansTotal(res.total ?? res.items?.length ?? 0)
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar planes", {
        description: error instanceof Error ? error.message : "No se pudo listar planes",
      })
    } finally {
      setIsLoadingPlans(false)
      setPlansReady(true)
    }
  }, [companyFilter, destinationFilter, showInactivePlans, currentPage, pageSize])

  const reloadAll = useCallback(async () => {
    await Promise.all([loadCompanies(), loadPlans()])
  }, [loadCompanies, loadPlans])

  useEffect(() => {
    if (!isAdmin) return
    void loadCompanies()
  }, [isAdmin, loadCompanies])

  useEffect(() => {
    if (!isAdmin) return
    void loadPlans()
  }, [isAdmin, loadPlans])

  // Al cambiar filtros, limpio la selección y vuelvo a página 1
  useEffect(() => {
    setSelectedPlanIds([])
    setCurrentPage(1)
  }, [companyFilter, destinationFilter, showInactivePlans])

  const filteredPlans = useMemo(() => {
    const q = planSearch.trim().toLowerCase()
    if (!q) return plans
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.external_plan_id.toLowerCase().includes(q) ||
        p.company_name.toLowerCase().includes(q) ||
        p.company_slug.toLowerCase().includes(q)
    )
  }, [plans, planSearch])

  const selectablePlans = useMemo(
    () => filteredPlans.filter((p) => p.active),
    [filteredPlans]
  )

  const allSelectableSelected =
    selectablePlans.length > 0 &&
    selectablePlans.every((p) => selectedPlanIds.includes(p.id))

  const someSelectableSelected =
    selectablePlans.some((p) => selectedPlanIds.includes(p.id)) && !allSelectableSelected

  const toggleSelectPlan = (planId: number, checked: boolean) => {
    setSelectedPlanIds((prev) =>
      checked ? [...new Set([...prev, planId])] : prev.filter((id) => id !== planId)
    )
  }

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      const visibleIds = new Set(selectablePlans.map((p) => p.id))
      setSelectedPlanIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }
    setSelectedPlanIds((prev) => [
      ...new Set([...prev, ...selectablePlans.map((p) => p.id)]),
    ])
  }

  const requestBulkDestination = (nextEnabled: boolean) => {
    if (selectedPlanIds.length === 0) {
      toast.error("Seleccioná al menos un plan")
      return
    }
    if (!bulkDestinationId) {
      toast.error("Elegí un destino")
      return
    }
    setConfirm({
      type: "bulk-destination",
      planIds: [...selectedPlanIds],
      destinationId: Number(bulkDestinationId) as PlanDestinationId,
      nextEnabled,
    })
  }

  const plansCountByCompany = useMemo(() => {
    const map = new Map<number, number>()
    for (const p of plans) {
      map.set(p.company_id, (map.get(p.company_id) ?? 0) + 1)
    }
    return map
  }, [plans])

  const closeConfirm = () => {
    if (isConfirming) return
    setConfirm(null)
  }

  const applyCompanyActive = async (companyId: number, active: boolean) => {
    setSavingKey(`company-${companyId}`)
    try {
      const updated = await updateCompany(companyId, { active })
      setCompanies((prev) => prev.map((c) => (c.id === companyId ? updated : c)))
      if (active) {
        toast.success("Compañía activada")
      } else {
        toast.warning("Compañía desactivada", {
          description: "No va a aparecer en las cotizaciones nuevas.",
        })
      }
    } catch (error: unknown) {
      toast.error("No se pudo actualizar la compañía", {
        description: error instanceof Error ? error.message : undefined,
      })
      throw error
    } finally {
      setSavingKey(null)
    }
  }

  const applyPlanUpdate = async (
    planId: number,
    data: Parameters<typeof updatePlan>[1],
    busyKey = `plan-${planId}`
  ) => {
    setSavingKey(busyKey)
    try {
      const updated = await updatePlan(planId, data)
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
      return updated
    } catch (error: unknown) {
      toast.error("No se pudo actualizar el plan", {
        description: error instanceof Error ? error.message : undefined,
      })
      throw error
    } finally {
      setSavingKey(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirm || isConfirming) return
    const pending = confirm
    setIsConfirming(true)

    try {
      if (pending.type === "company-active") {
        await applyCompanyActive(pending.company.id, pending.nextActive)
      } else if (pending.type === "plan-markup") {
        const total = getPlanMarkupTotal(pending.next)
        await applyPlanUpdate(
          pending.plan.id,
          {
            producer_markup: pending.next.producer_markup,
            organizer_markup: pending.next.organizer_markup,
            operating_expenses: pending.next.operating_expenses,
          },
          `plan-${pending.plan.id}-markup`
        )
        if (total === 0) {
          toast.warning("Markup quitado", {
            description: `“${pending.plan.name}” queda en 0%.`,
          })
        } else {
          toast.success(`Markup total actualizado a ${total}%`, {
            description: `Prod. ${pending.next.producer_markup}% · Org. ${pending.next.organizer_markup}% · G.O. ${pending.next.operating_expenses}%`,
          })
        }
      } else if (pending.type === "plan-active") {
        await applyPlanUpdate(
          pending.plan.id,
          { active: pending.nextActive },
          `plan-${pending.plan.id}-active`
        )
        if (pending.nextActive) {
          toast.success("Plan activado")
        } else {
          toast.warning("Plan desactivado", {
            description: `“${pending.plan.name}” no se va a ofrecer en ningún destino.`,
          })
        }
      } else if (pending.type === "plan-destination") {
        await applyPlanUpdate(
          pending.plan.id,
          {
            destinations: [
              { destination_id: pending.destinationId, enabled: pending.nextEnabled },
            ],
          },
          `plan-${pending.plan.id}-dest-${pending.destinationId}`
        )
        if (pending.nextEnabled) {
          toast.success(`Destino “${destinationLabel(pending.destinationId)}” activado`)
        } else {
          toast.warning(`Destino “${destinationLabel(pending.destinationId)}” desactivado`, {
            description: `En “${pending.plan.name}”.`,
          })
        }
      } else if (pending.type === "plan-delete") {
        setSavingKey(`plan-${pending.plan.id}-delete`)
        try {
          await deletePlan(pending.plan.id)
          toast.warning("Plan dado de baja", {
            description: `“${pending.plan.name}” quedó inactivo. Para reactivarlo, marcá “Ver planes inactivos”.`,
          })
          await loadPlans()
        } finally {
          setSavingKey(null)
        }
      } else if (pending.type === "plan-create") {
        setSavingKey("plan-create")
        try {
          await createPlan(pending.data)
          toast.success("Plan creado", {
            description: pending.isFirstPlanForCompany
              ? "A partir de ahora solo van a cotizar los planes que cargues y actives para cada destino."
              : "Recordá activar los destinos donde querés que se ofrezca.",
          })
          setCreateOpen(false)
          setCreateCompanyId("")
          setCreateExternalId("")
          setCreateName("")
          setCreateProductor("0")
          setCreateOrganizador("0")
          setCreateGastos("0")
          await loadPlans()
        } finally {
          setSavingKey(null)
        }
      } else if (pending.type === "bulk-destination") {
        setSavingKey("bulk-destination")
        setBulkProgress({ done: 0, total: pending.planIds.length })
        let ok = 0
        let failed = 0
        try {
          for (let i = 0; i < pending.planIds.length; i++) {
            const planId = pending.planIds[i]
            try {
              const updated = await updatePlan(planId, {
                destinations: [
                  {
                    destination_id: pending.destinationId,
                    enabled: pending.nextEnabled,
                  },
                ],
              })
              setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
              ok += 1
            } catch {
              failed += 1
            }
            setBulkProgress({ done: i + 1, total: pending.planIds.length })
          }

          if (failed === 0) {
            if (pending.nextEnabled) {
              toast.success(
                `Destino “${destinationLabel(pending.destinationId)}” activado en ${ok} plan${ok === 1 ? "" : "es"}`
              )
            } else {
              toast.warning(
                `Destino “${destinationLabel(pending.destinationId)}” desactivado en ${ok} plan${ok === 1 ? "" : "es"}`
              )
            }
            setSelectedPlanIds([])
          } else if (ok === 0) {
            throw new Error("No se pudo actualizar ningún plan")
          } else {
            toast.warning("Algunos planes no se pudieron actualizar", {
              description: `Bien: ${ok}. Con error: ${failed}.`,
            })
            setSelectedPlanIds([])
          }
        } finally {
          setSavingKey(null)
          setBulkProgress(null)
        }
      }

      setConfirm(null)
    } catch (error: unknown) {
      if (
        pending.type === "plan-delete" ||
        pending.type === "plan-create" ||
        pending.type === "bulk-destination"
      ) {
        toast.error(
          pending.type === "plan-delete"
            ? "No se pudo dar de baja el plan"
            : pending.type === "plan-create"
              ? "No se pudo crear el plan"
              : "No se pudieron actualizar los planes",
          {
            description: error instanceof Error ? error.message : undefined,
          }
        )
      }
      // El modal queda abierto para reintentar o cancelar
    } finally {
      setIsConfirming(false)
    }
  }

  const requestMarkupChange = (plan: PlanResponse, next: MarkupValues) => {
    const current: MarkupValues = {
      producer_markup: parseMarkupPercent(plan.producer_markup),
      organizer_markup: parseMarkupPercent(plan.organizer_markup),
      operating_expenses: parseMarkupPercent(plan.operating_expenses),
    }
    if (
      current.producer_markup === next.producer_markup &&
      current.organizer_markup === next.organizer_markup &&
      current.operating_expenses === next.operating_expenses
    ) {
      toast.message("Sin cambios", {
        description: "El markup quedó igual que antes.",
      })
      setMarkupEditPlan(null)
      return
    }
    setMarkupEditPlan(null)
    setConfirm({ type: "plan-markup", plan, next })
  }

  const openMarkupEdit = (plan: PlanResponse) => {
    setEditProductor(String(parseMarkupPercent(plan.producer_markup)))
    setEditOrganizador(String(parseMarkupPercent(plan.organizer_markup)))
    setEditGastos(String(parseMarkupPercent(plan.operating_expenses)))
    setMarkupEditPlan(plan)
  }

  const submitMarkupEdit = () => {
    if (!markupEditPlan) return
    const producer_markup = parseMarkupField(editProductor)
    const organizer_markup = parseMarkupField(editOrganizador)
    const operating_expenses = parseMarkupField(editGastos)
    if (
      producer_markup === null ||
      organizer_markup === null ||
      operating_expenses === null
    ) {
      toast.error("Markup inválido", {
        description: "Los tres valores tienen que ser números mayores o iguales a 0",
      })
      return
    }
    requestMarkupChange(markupEditPlan, {
      producer_markup,
      organizer_markup,
      operating_expenses,
    })
  }

  const openCreateConfirm = () => {
    const companyId = Number(createCompanyId)
    if (!companyId || Number.isNaN(companyId)) {
      toast.error("Elegí una compañía")
      return
    }
    if (!createExternalId.trim()) {
      toast.error("Ingresá el código del plan en la compañía")
      return
    }
    if (!createName.trim()) {
      toast.error("Ingresá el nombre del plan")
      return
    }
    const producer_markup = parseMarkupField(createProductor)
    const organizer_markup = parseMarkupField(createOrganizador)
    const operating_expenses = parseMarkupField(createGastos)
    if (
      producer_markup === null ||
      organizer_markup === null ||
      operating_expenses === null
    ) {
      toast.error("Markup inválido", {
        description: "Los tres valores tienen que ser números mayores o iguales a 0",
      })
      return
    }

    const company = companies.find((c) => c.id === companyId)
    const knownCount = plansCountByCompany.get(companyId) ?? 0
    const isFirstPlanForCompany = knownCount === 0

    setConfirm({
      type: "plan-create",
      data: {
        company_id: companyId,
        external_plan_id: createExternalId.trim(),
        name: createName.trim(),
        producer_markup,
        organizer_markup,
        operating_expenses,
      },
      isFirstPlanForCompany,
      companyName: company
        ? mapCompanyToFormalCompany(company.name)
        : "la compañía",
    })
  }

  const confirmTitle = (() => {
    if (!confirm) return ""
    switch (confirm.type) {
      case "company-active":
        return confirm.nextActive ? "Activar compañía" : "Desactivar compañía"
      case "plan-markup":
        return "Cambiar markup"
      case "plan-active":
        return confirm.nextActive ? "Activar plan" : "Desactivar plan"
      case "plan-destination":
        return confirm.nextEnabled ? "Activar destino" : "Desactivar destino"
      case "plan-delete":
        return "Dar de baja el plan"
      case "plan-create":
        return "Crear plan"
      case "bulk-destination":
        return confirm.nextEnabled
          ? "Activar destino en varios planes"
          : "Desactivar destino en varios planes"
      default:
        return "Confirmar"
    }
  })()

  const confirmDescription = (() => {
    if (!confirm) return ""
    switch (confirm.type) {
      case "company-active":
        return confirm.nextActive
          ? `Vas a activar “${mapCompanyToFormalCompany(confirm.company.name)}”. Volverá a aparecer en las cotizaciones.`
          : `Vas a desactivar “${mapCompanyToFormalCompany(confirm.company.name)}”. No va a aparecer en las cotizaciones nuevas.`
      case "plan-markup": {
        const total = getPlanMarkupTotal(confirm.next)
        return total === 0
          ? `Vas a dejar el markup de “${confirm.plan.name}” en 0% (productor, organizador y gastos operativos en 0).`
          : `Vas a guardar el markup de “${confirm.plan.name}”: productor ${confirm.next.producer_markup}%, organizador ${confirm.next.organizer_markup}%, gastos operativos ${confirm.next.operating_expenses}%. Total: ${total}% (ese total se aplica al precio final).`
      }
      case "plan-active":
        return confirm.nextActive
          ? `Vas a volver a activar “${confirm.plan.name}”.`
          : `Vas a desactivar “${confirm.plan.name}”. No se va a ofrecer en ningún destino.`
      case "plan-destination":
        return confirm.nextEnabled
          ? `Vas a activar el destino “${destinationLabel(confirm.destinationId)}” para “${confirm.plan.name}”.`
          : `Vas a desactivar el destino “${destinationLabel(confirm.destinationId)}” para “${confirm.plan.name}”.`
      case "plan-delete":
        return `Vas a dar de baja “${confirm.plan.name}”. Después lo podés volver a activar marcando “Ver planes inactivos”.`
      case "plan-create": {
        const total = getPlanMarkupTotal(confirm.data)
        return confirm.isFirstPlanForCompany
          ? `Vas a crear el primer plan de “${confirm.companyName}” con markup total ${total}% (productor ${confirm.data.producer_markup}%, organizador ${confirm.data.organizer_markup}%, gastos ${confirm.data.operating_expenses}%). Ojo: a partir de ahora esa compañía solo va a cotizar los planes que cargues acá y actives por destino. Al crearlos, los destinos quedan apagados hasta que los actives.`
          : `Vas a crear “${confirm.data.name}” para “${confirm.companyName}” con markup total ${total}%. Los destinos empiezan apagados: después los activás desde la tabla.`
      }
      case "bulk-destination":
        return confirm.nextEnabled
          ? `Vas a activar “${destinationLabel(confirm.destinationId)}” en ${confirm.planIds.length} plan${confirm.planIds.length === 1 ? "" : "es"} seleccionados.`
          : `Vas a desactivar “${destinationLabel(confirm.destinationId)}” en ${confirm.planIds.length} plan${confirm.planIds.length === 1 ? "" : "es"} seleccionados.`
      default:
        return ""
    }
  })()

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>Solo un administrador puede entrar a esta sección.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span className="truncate">Gestión de planes</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acá activás compañías, armás el catálogo de planes, definís el markup y en qué destinos se ofrecen.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => void reloadAll()}
          disabled={isLoadingCompanies || isLoadingPlans}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoadingCompanies || isLoadingPlans ? "animate-spin" : ""}`}
          />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="planes" className="w-full min-w-0">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="companias">Compañías</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
        </TabsList>

        {/* ── Compañías ── */}
        <TabsContent value="companias" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Compañías
              </CardTitle>
              <CardDescription>
                Prendé o apagá cada compañía. Si está apagada, no se cotiza.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!companiesReady ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="relative">
                  {isLoadingCompanies && (
                    <div className="absolute inset-x-0 -top-1 z-10 h-0.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-1/3 animate-pulse bg-primary/70" />
                    </div>
                  )}
                  <div
                    className={`rounded-md border overflow-x-auto transition-opacity ${
                      isLoadingCompanies ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-center">Activa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay compañías
                          </TableCell>
                        </TableRow>
                      ) : (
                        companies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">
                              {mapCompanyToFormalCompany(company.name)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{company.slug}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                {savingKey === `company-${company.id}` && (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                                <Switch
                                  checked={company.active}
                                  disabled={!!savingKey}
                                  onCheckedChange={(checked) =>
                                    setConfirm({
                                      type: "company-active",
                                      company,
                                      nextActive: checked,
                                    })
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Planes ── */}
        <TabsContent value="planes" className="mt-4 space-y-4 min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base">Planes</CardTitle>
                  <CardDescription>
                    Cargá los planes, el markup (productor + organizador + gastos operativos) y en qué destinos se muestran.
                  </CardDescription>
                </div>
                <Button size="sm" className="shrink-0 self-start" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 min-w-0">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="w-full lg:w-48">
                  <Label className="text-xs text-muted-foreground">Compañía</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {mapCompanyToFormalCompany(c.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full lg:w-48">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {PLAN_DESTINATION_OPTIONS.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Buscar</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar por nombre, código o compañía…"
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap pb-2">
                  <Checkbox
                    checked={showInactivePlans}
                    onCheckedChange={(v) => setShowInactivePlans(v === true)}
                  />
                  Ver planes inactivos
                </label>
              </div>

              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <span>
                  {plansTotal === 0
                    ? "No hay planes para mostrar"
                    : plansTotal === 1
                      ? "1 plan"
                      : `${plansTotal} planes`}
                  {destinationFilter !== "all"
                    ? ` · solo los activos en ${destinationLabel(Number(destinationFilter) as PlanDestinationId)}`
                    : ""}
                </span>
                {isLoadingPlans && plansReady && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Actualizando…
                  </span>
                )}
              </p>

              {selectablePlans.length > 0 && (
                <label className="md:hidden flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={
                      allSelectableSelected
                        ? true
                        : someSelectableSelected
                          ? "indeterminate"
                          : false
                    }
                    disabled={!!savingKey || isConfirming}
                    onCheckedChange={(v) => toggleSelectAllVisible(v === true)}
                  />
                  Seleccionar todos los visibles
                </label>
              )}

              {selectedPlanIds.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {selectedPlanIds.length} plan
                      {selectedPlanIds.length === 1 ? "" : "es"} seleccionado
                      {selectedPlanIds.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Elegí un destino y aplicalo a todos de una vez.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="w-full sm:w-48">
                      <Label className="text-xs text-muted-foreground">Destino</Label>
                      <Select value={bulkDestinationId} onValueChange={setBulkDestinationId}>
                        <SelectTrigger className="mt-1 bg-background">
                          <SelectValue placeholder="Elegí destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_DESTINATION_OPTIONS.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!!savingKey || isConfirming || !bulkDestinationId}
                        onClick={() => requestBulkDestination(true)}
                      >
                        Activar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!!savingKey || isConfirming || !bulkDestinationId}
                        onClick={() => requestBulkDestination(false)}
                      >
                        Desactivar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!!savingKey || isConfirming}
                        onClick={() => setSelectedPlanIds([])}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!plansReady ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {/* ── Mobile: cards ── */}
                  <div className={`md:hidden space-y-3 ${isLoadingPlans ? "opacity-60 pointer-events-none" : ""}`}>
                    {filteredPlans.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No hay planes con estos filtros
                      </p>
                    ) : (
                      filteredPlans.map((plan) => {
                        const destinations = normalizeDestinations(plan.destinations)
                        const producer = parseMarkupPercent(plan.producer_markup)
                        const organizer = parseMarkupPercent(plan.organizer_markup)
                        const operating = parseMarkupPercent(plan.operating_expenses)
                        const markupTotal = getPlanMarkupTotal(plan)
                        const busy =
                          savingKey === `plan-${plan.id}` ||
                          savingKey?.startsWith(`plan-${plan.id}-`) === true ||
                          (savingKey === "bulk-destination" &&
                            selectedPlanIds.includes(plan.id))
                        const selected = selectedPlanIds.includes(plan.id)
                        return (
                          <div
                            key={`m-${plan.id}`}
                            className={`rounded-lg border p-3 space-y-3 ${
                              busy
                                ? "bg-primary/5 border-primary/30"
                                : selected
                                  ? "bg-muted/40 border-primary/20"
                                  : !plan.active
                                    ? "opacity-60"
                                    : "bg-card"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                className="mt-1"
                                checked={selected}
                                disabled={!plan.active || !!savingKey || isConfirming}
                                onCheckedChange={(v) =>
                                  toggleSelectPlan(plan.id, v === true)
                                }
                                aria-label={`Seleccionar ${plan.name}`}
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-sm leading-snug break-words">
                                    {plan.name}
                                  </p>
                                  {!plan.active && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Inactivo
                                    </Badge>
                                  )}
                                  {busy && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 border-primary/40 text-primary text-[10px]"
                                    >
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Guardando…
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground break-words">
                                  {mapCompanyToFormalCompany(plan.company_name)}
                                  <span className="mx-1.5 text-border">·</span>
                                  <span className="font-mono">{plan.external_plan_id}</span>
                                </p>
                              </div>
                              {plan.active && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                  disabled={!!savingKey || isConfirming}
                                  onClick={() => setConfirm({ type: "plan-delete", plan })}
                                  title="Dar de baja"
                                >
                                  {savingKey === `plan-${plan.id}-delete` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Markup
                                </p>
                                <p className="text-sm font-semibold tabular-nums">
                                  Total {Number(markupTotal.toFixed(2))}%
                                </p>
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                  Prod. {producer}% · Org. {organizer}% · G.O. {operating}%
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                disabled={!!savingKey || isConfirming}
                                onClick={() => openMarkupEdit(plan)}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Editar
                              </Button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">Activo</span>
                              <div className="inline-flex items-center gap-1.5">
                                {savingKey === `plan-${plan.id}-active` && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                )}
                                <Switch
                                  checked={plan.active}
                                  disabled={!!savingKey || isConfirming}
                                  onCheckedChange={(checked) =>
                                    setConfirm({
                                      type: "plan-active",
                                      plan,
                                      nextActive: checked,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Destinos
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {destinations.map((dest) => {
                                  const destBusy =
                                    savingKey ===
                                    `plan-${plan.id}-dest-${dest.destination_id}`
                                  return (
                                    <div
                                      key={dest.destination_id}
                                      className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 ${
                                        destBusy ? "bg-primary/10 border-primary/30" : ""
                                      }`}
                                    >
                                      <span className="text-xs font-medium truncate">
                                        {destinationLabel(dest.destination_id)}
                                      </span>
                                      <div className="inline-flex items-center gap-1 shrink-0">
                                        {destBusy && (
                                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                        )}
                                        <Switch
                                          checked={dest.enabled}
                                          disabled={
                                            !!savingKey || isConfirming || !plan.active
                                          }
                                          onCheckedChange={(checked) =>
                                            setConfirm({
                                              type: "plan-destination",
                                              plan,
                                              destinationId: dest.destination_id,
                                              nextEnabled: checked,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* ── Desktop: tabla ── */}
                  <div className="relative hidden md:block">
                    {isLoadingPlans && (
                      <div className="absolute inset-x-0 -top-1 z-10 h-0.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/3 animate-pulse bg-primary/70" />
                      </div>
                    )}
                    <div
                      className={`rounded-md border overflow-x-auto transition-opacity ${
                        isLoadingPlans ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-primary border-b-0">
                        <TableHead className="w-10 bg-primary text-primary-foreground">
                          <Checkbox
                            checked={
                              allSelectableSelected
                                ? true
                                : someSelectableSelected
                                  ? "indeterminate"
                                  : false
                            }
                            disabled={
                              selectablePlans.length === 0 ||
                              !!savingKey ||
                              isConfirming
                            }
                            onCheckedChange={(v) => toggleSelectAllVisible(v === true)}
                            aria-label="Seleccionar todos los planes visibles"
                            className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                          />
                        </TableHead>
                        <TableHead className="bg-primary text-primary-foreground">Compañía</TableHead>
                        <TableHead className="bg-primary text-primary-foreground">Plan</TableHead>
                        <TableHead className="bg-primary text-primary-foreground">Código</TableHead>
                        <TableHead
                          className="text-right bg-primary text-primary-foreground whitespace-nowrap"
                          title="Productor %"
                        >
                          Prod.
                        </TableHead>
                        <TableHead
                          className="text-right bg-primary text-primary-foreground whitespace-nowrap"
                          title="Organizador %"
                        >
                          Org.
                        </TableHead>
                        <TableHead
                          className="text-right bg-primary text-primary-foreground whitespace-nowrap"
                          title="Gastos operativos %"
                        >
                          G.O.
                        </TableHead>
                        <TableHead className="text-right bg-primary text-primary-foreground whitespace-nowrap">
                          Total %
                        </TableHead>
                        <TableHead className="text-center bg-primary text-primary-foreground">Activo</TableHead>
                        {PLAN_DESTINATION_OPTIONS.map((d) => (
                          <TableHead key={d.id} className="text-center text-xs px-2 bg-primary text-primary-foreground">
                            {d.short}
                          </TableHead>
                        ))}
                        <TableHead className="w-12 bg-primary text-primary-foreground" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={10 + PLAN_DESTINATION_OPTIONS.length}
                            className="text-center text-muted-foreground py-8"
                          >
                            No hay planes con estos filtros
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlans.map((plan) => {
                          const destinations = normalizeDestinations(plan.destinations)
                          const producer = parseMarkupPercent(plan.producer_markup)
                          const organizer = parseMarkupPercent(plan.organizer_markup)
                          const operating = parseMarkupPercent(plan.operating_expenses)
                          const markupTotal = getPlanMarkupTotal(plan)
                          const busy =
                            savingKey === `plan-${plan.id}` ||
                            savingKey?.startsWith(`plan-${plan.id}-`) === true ||
                            (savingKey === "bulk-destination" &&
                              selectedPlanIds.includes(plan.id))
                          const selected = selectedPlanIds.includes(plan.id)
                          return (
                            <TableRow
                              key={plan.id}
                              className={
                                busy
                                  ? "bg-primary/5"
                                  : selected
                                    ? "bg-muted/40"
                                    : !plan.active
                                      ? "opacity-60"
                                      : undefined
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selected}
                                  disabled={
                                    !plan.active || !!savingKey || isConfirming
                                  }
                                  onCheckedChange={(v) =>
                                    toggleSelectPlan(plan.id, v === true)
                                  }
                                  aria-label={`Seleccionar ${plan.name}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">
                                {mapCompanyToFormalCompany(plan.company_name)}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span>{plan.name}</span>
                                  {!plan.active && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Inactivo
                                    </Badge>
                                  )}
                                  {busy && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 border-primary/40 text-primary text-[10px]"
                                    >
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Guardando…
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {plan.external_plan_id}
                              </TableCell>
                              <TableCell className="text-right tabular-nums whitespace-nowrap">
                                {producer}%
                              </TableCell>
                              <TableCell className="text-right tabular-nums whitespace-nowrap">
                                {organizer}%
                              </TableCell>
                              <TableCell className="text-right tabular-nums whitespace-nowrap">
                                {operating}%
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex items-center justify-end gap-2">
                                  <span className="font-semibold tabular-nums whitespace-nowrap">
                                    {Number(markupTotal.toFixed(2))}%
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    disabled={!!savingKey || isConfirming}
                                    onClick={() => openMarkupEdit(plan)}
                                    title="Editar markup"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  {savingKey === `plan-${plan.id}-active` && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                  )}
                                  <Switch
                                    checked={plan.active}
                                    disabled={!!savingKey || isConfirming}
                                    onCheckedChange={(checked) =>
                                      setConfirm({
                                        type: "plan-active",
                                        plan,
                                        nextActive: checked,
                                      })
                                    }
                                  />
                                </div>
                              </TableCell>
                              {destinations.map((dest) => {
                                const destBusy =
                                  savingKey ===
                                  `plan-${plan.id}-dest-${dest.destination_id}`
                                return (
                                  <TableCell
                                    key={dest.destination_id}
                                    className={`text-center px-2 ${
                                      destBusy ? "bg-primary/10" : ""
                                    }`}
                                  >
                                    <div className="inline-flex flex-col items-center gap-1">
                                      {destBusy && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                      )}
                                      <Switch
                                        checked={dest.enabled}
                                        disabled={
                                          !!savingKey ||
                                          isConfirming ||
                                          !plan.active
                                        }
                                        onCheckedChange={(checked) =>
                                          setConfirm({
                                            type: "plan-destination",
                                            plan,
                                            destinationId: dest.destination_id,
                                            nextEnabled: checked,
                                          })
                                        }
                                      />
                                    </div>
                                  </TableCell>
                                )
                              })}
                              <TableCell>
                                {plan.active && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    disabled={!!savingKey || isConfirming}
                                    onClick={() => setConfirm({ type: "plan-delete", plan })}
                                    title="Dar de baja"
                                  >
                                    {savingKey === `plan-${plan.id}-delete` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>


                {/* Controles de paginación */}
                {plansTotal > pageSize && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Mostrando {Math.min((currentPage - 1) * pageSize + 1, plansTotal)} a{" "}
                      {Math.min(currentPage * pageSize, plansTotal)} de {plansTotal} planes
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1 || isLoadingPlans}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.ceil(plansTotal / pageSize) }, (_, i) => i + 1)
                          .filter((page) => {
                            // Mostrar primera, última, actual y 2 páginas alrededor
                            const totalPages = Math.ceil(plansTotal / pageSize)
                            return (
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                            )
                          })
                          .map((page, idx, arr) => {
                            // Agregar "..." si hay saltos
                            const prev = arr[idx - 1]
                            const showEllipsis = prev && page - prev > 1
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsis && (
                                  <span className="px-2 text-sm text-muted-foreground">
                                    ...
                                  </span>
                                )}
                                <Button
                                  variant={page === currentPage ? "default" : "outline"}
                                  size="sm"
                                  className="w-9 h-9 p-0"
                                  disabled={isLoadingPlans}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                      <span className="sm:hidden text-xs text-muted-foreground tabular-nums px-1">
                        {currentPage} / {Math.ceil(plansTotal / pageSize)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          currentPage >= Math.ceil(plansTotal / pageSize) || isLoadingPlans
                        }
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(Math.ceil(plansTotal / pageSize), p + 1)
                          )
                        }
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog editar markup */}
      <Dialog
        open={markupEditPlan !== null}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setMarkupEditPlan(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar markup</DialogTitle>
            <DialogDescription>
              {markupEditPlan
                ? `Plan “${markupEditPlan.name}”. El total se suma de los tres valores y se aplica al precio final.`
                : "Definí los tres valores del markup."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label htmlFor="edit-productor" className="text-xs text-muted-foreground">
                  Productor %
                </Label>
                <Input
                  id="edit-productor"
                  type="number"
                  min={0}
                  step={0.5}
                  value={editProductor}
                  onChange={(e) => setEditProductor(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="edit-organizador" className="text-xs text-muted-foreground">
                  Organizador %
                </Label>
                <Input
                  id="edit-organizador"
                  type="number"
                  min={0}
                  step={0.5}
                  value={editOrganizador}
                  onChange={(e) => setEditOrganizador(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="edit-gastos" className="text-xs text-muted-foreground">
                  Gastos operativos %
                </Label>
                <Input
                  id="edit-gastos"
                  type="number"
                  min={0}
                  step={0.5}
                  value={editGastos}
                  onChange={(e) => setEditGastos(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total a aplicar: </span>
              <span className="font-semibold tabular-nums">
                {getPlanMarkupTotal({
                  producer_markup: parseMarkupField(editProductor) ?? 0,
                  organizer_markup: parseMarkupField(editOrganizador) ?? 0,
                  operating_expenses: parseMarkupField(editGastos) ?? 0,
                })}
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Al guardar se confirma el cambio. El total (suma de los tres) se aplica al precio final en cotización.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkupEditPlan(null)}
              disabled={isConfirming}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={submitMarkupEdit} disabled={isConfirming}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog alta */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo plan</DialogTitle>
            <DialogDescription>
              Completá los datos del plan. Después vas a poder elegir en qué destinos se ofrece.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-company">Compañía</Label>
              <Select value={createCompanyId} onValueChange={setCreateCompanyId}>
                <SelectTrigger id="create-company">
                  <SelectValue placeholder="Elegí una compañía" />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter((c) => c.active)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {mapCompanyToFormalCompany(c.name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-external">Código del plan en la compañía</Label>
              <Input
                id="create-external"
                placeholder="Ej: 5066"
                value={createExternalId}
                onChange={(e) => setCreateExternalId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nombre para mostrar</Label>
              <Input
                id="create-name"
                placeholder="Ej: CARDINAL 50"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Markup (opcional)</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-1">
                  <Label htmlFor="create-productor" className="text-xs text-muted-foreground">
                    Productor %
                  </Label>
                  <Input
                    id="create-productor"
                    type="number"
                    min={0}
                    step={0.5}
                    value={createProductor}
                    onChange={(e) => setCreateProductor(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="create-organizador" className="text-xs text-muted-foreground">
                    Organizador %
                  </Label>
                  <Input
                    id="create-organizador"
                    type="number"
                    min={0}
                    step={0.5}
                    value={createOrganizador}
                    onChange={(e) => setCreateOrganizador(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="create-gastos" className="text-xs text-muted-foreground">
                    Gastos operativos %
                  </Label>
                  <Input
                    id="create-gastos"
                    type="number"
                    min={0}
                    step={0.5}
                    value={createGastos}
                    onChange={(e) => setCreateGastos(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total:{" "}
                {getPlanMarkupTotal({
                  producer_markup: parseMarkupField(createProductor) ?? 0,
                  organizer_markup: parseMarkupField(createOrganizador) ?? 0,
                  operating_expenses: parseMarkupField(createGastos) ?? 0,
                })}
                % (suma de los tres; se aplica al precio final en cotización).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={openCreateConfirm} disabled={savingKey === "plan-create"}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          {isConfirming && (
            <div className="flex flex-col gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                {bulkProgress
                  ? `Guardando… ${bulkProgress.done} de ${bulkProgress.total}`
                  : "Guardando… esperá un momento."}
              </div>
              {bulkProgress && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round(
                        (bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isConfirming}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirm()
              }}
            >
              {isConfirming ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
