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
  listPlans,
  parsePlanMarkup,
  updatePlan,
} from "@/lib/services/plans.service"
import type {
  CompanyResponse,
  PlanDestination,
  PlanDestinationId,
  PlanResponse,
} from "@/lib/services/types"

type ConfirmState =
  | { type: "company-active"; company: CompanyResponse; nextActive: boolean }
  | { type: "plan-markup"; plan: PlanResponse; nextMarkup: number }
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
      data: {
        company_id: number
        external_plan_id: string
        name: string
        markup: number
      }
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
  const [markupInputKey, setMarkupInputKey] = useState(0)

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
  const [createMarkup, setCreateMarkup] = useState("0")

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
        limit: 100,
        offset: 0,
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
  }, [companyFilter, destinationFilter, showInactivePlans])

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

  // Al cambiar filtros, limpio la selección para no operar sobre planes ocultos
  useEffect(() => {
    setSelectedPlanIds([])
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

  const closeConfirm = (resetMarkup = false) => {
    if (isConfirming) return
    setConfirm(null)
    if (resetMarkup) setMarkupInputKey((k) => k + 1)
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
        await applyPlanUpdate(
          pending.plan.id,
          { markup: pending.nextMarkup },
          `plan-${pending.plan.id}-markup`
        )
        if (pending.nextMarkup === 0) {
          toast.warning("Porcentaje quitado", {
            description: `“${pending.plan.name}” queda sin porcentaje adicional.`,
          })
        } else {
          toast.success(`Porcentaje actualizado a ${pending.nextMarkup}%`)
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
          setCreateMarkup("0")
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
      if (pending.type === "plan-markup") setMarkupInputKey((k) => k + 1)
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

  const requestMarkupChange = (plan: PlanResponse, value: string) => {
    const trimmed = value.trim()
    const next = trimmed === "" ? 0 : Number(trimmed)
    if (Number.isNaN(next) || next < 0) {
      toast.error("Porcentaje inválido", { description: "Ingresá un número mayor o igual a 0" })
      setMarkupInputKey((k) => k + 1)
      return
    }
    if (next === parsePlanMarkup(plan.markup)) return
    setConfirm({ type: "plan-markup", plan, nextMarkup: next })
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
    const markup = createMarkup.trim() === "" ? 0 : Number(createMarkup)
    if (Number.isNaN(markup) || markup < 0) {
      toast.error("Porcentaje inválido")
      return
    }

    const company = companies.find((c) => c.id === companyId)
    // Contamos con el listado actual (puede estar filtrado). Pedimos también si la compañía
    // ya aparece en planes cargados; si showInactive=false puede subestimar, así que avisamos
    // también cuando no hay ningún plan de esa compañía en memoria.
    const knownCount = plansCountByCompany.get(companyId) ?? 0
    const isFirstPlanForCompany = knownCount === 0

    setConfirm({
      type: "plan-create",
      data: {
        company_id: companyId,
        external_plan_id: createExternalId.trim(),
        name: createName.trim(),
        markup,
      },
      isFirstPlanForCompany,
      companyName: company?.name ?? "la compañía",
    })
  }

  const confirmTitle = (() => {
    if (!confirm) return ""
    switch (confirm.type) {
      case "company-active":
        return confirm.nextActive ? "Activar compañía" : "Desactivar compañía"
      case "plan-markup":
        return "Cambiar porcentaje"
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
          ? `Vas a activar “${confirm.company.name}”. Volverá a aparecer en las cotizaciones.`
          : `Vas a desactivar “${confirm.company.name}”. No va a aparecer en las cotizaciones nuevas.`
      case "plan-markup":
        return confirm.nextMarkup === 0
          ? `Vas a sacar el porcentaje adicional de “${confirm.plan.name}”.`
          : `Vas a poner un ${confirm.nextMarkup}% de porcentaje en “${confirm.plan.name}” (ahora tiene ${parsePlanMarkup(confirm.plan.markup)}%). Ese porcentaje se suma al precio final en todos los destinos.`
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
      case "plan-create":
        return confirm.isFirstPlanForCompany
          ? `Vas a crear el primer plan de “${confirm.companyName}”. Ojo: a partir de ahora esa compañía solo va a cotizar los planes que cargues acá y actives por destino. Al crearlos, los destinos quedan apagados hasta que los actives.`
          : `Vas a crear “${confirm.data.name}” para “${confirm.companyName}”. Los destinos empiezan apagados: después los activás desde la tabla.`
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Gestión de planes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acá activás compañías, armás el catálogo de planes, definís el porcentaje y en qué destinos se ofrecen.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reloadAll()} disabled={isLoadingCompanies || isLoadingPlans}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoadingCompanies || isLoadingPlans ? "animate-spin" : ""}`}
          />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="planes" className="w-full">
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
                            <TableCell className="font-medium">{company.name}</TableCell>
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
        <TabsContent value="planes" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">Planes</CardTitle>
                  <CardDescription>
                    Cargá los planes, el porcentaje que se suma al precio y en qué destinos se muestran.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          {c.name}
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

              <p className="text-xs text-muted-foreground flex items-center gap-2">
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
                <div className="relative">
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
                      <TableRow>
                        <TableHead className="w-10">
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
                          />
                        </TableHead>
                        <TableHead>Compañía</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">% extra</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                        {PLAN_DESTINATION_OPTIONS.map((d) => (
                          <TableHead key={d.id} className="text-center text-xs px-2">
                            {d.short}
                          </TableHead>
                        ))}
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7 + PLAN_DESTINATION_OPTIONS.length}
                            className="text-center text-muted-foreground py-8"
                          >
                            No hay planes con estos filtros
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlans.map((plan) => {
                          const destinations = normalizeDestinations(plan.destinations)
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
                                <div className="flex flex-col">
                                  <span>{plan.company_name}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {plan.company_slug}
                                  </span>
                                </div>
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
                              <TableCell className="text-right">
                                <Input
                                  key={`${plan.id}-${plan.markup}-${markupInputKey}`}
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  className="h-8 w-20 text-right ml-auto"
                                  defaultValue={parsePlanMarkup(plan.markup)}
                                  disabled={!!savingKey || isConfirming}
                                  onBlur={(e) => requestMarkupChange(plan, e.target.value)}
                                />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                        {c.name}
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
              <Label htmlFor="create-markup">Porcentaje extra (opcional)</Label>
              <Input
                id="create-markup"
                type="number"
                min={0}
                step={0.5}
                value={createMarkup}
                onChange={(e) => setCreateMarkup(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se suma al precio final. Si no corresponde, dejalo en 0.
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
          if (!open) closeConfirm(confirm?.type === "plan-markup")
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
