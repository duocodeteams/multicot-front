"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Layers, Search, RefreshCw, MapPin, Save, RotateCcw } from "lucide-react"
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
import {
  DESTINATION_OPTIONS,
  listPlansCatalog,
  updateDestinationVisibility,
  updatePlanActive,
  updatePlanMarkup,
  type DestinationCode,
  type DestinationVisibility,
  type InsuranceCompany,
  type InsurancePlan,
  type PlansCatalog,
} from "@/lib/services/plans.service"

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function companyById(companies: InsuranceCompany[], id: string) {
  return companies.find((c) => c.id === id)
}

type ConfirmState =
  | { type: "markup"; plan: InsurancePlan; nextMarkup: number }
  | { type: "active"; plan: InsurancePlan; nextActive: boolean }
  | { type: "visibility" }

export function AdminPlansManagement() {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState<PlansCatalog | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [markupInputKey, setMarkupInputKey] = useState(0)

  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [planSearch, setPlanSearch] = useState("")

  const [selectedDestination, setSelectedDestination] = useState<DestinationCode>("1002")
  const [draftVisibility, setDraftVisibility] = useState<DestinationVisibility | null>(null)
  const [visibilityDirty, setVisibilityDirty] = useState(false)

  const isAdmin =
    String(user?.role ?? "").toLowerCase() === "admin" ||
    String(user?.role ?? "") === "1"

  const destinationLabel =
    DESTINATION_OPTIONS.find((d) => d.value === selectedDestination)?.label ?? selectedDestination

  const loadCatalog = useCallback(async () => {
    if (!isAdmin) {
      toast.error("Acceso denegado", {
        description: "Solo los administradores pueden gestionar planes",
      })
      return
    }
    setIsLoading(true)
    try {
      const data = await listPlansCatalog()
      setCatalog(data)
      const current =
        data.visibility.find((v) => v.destinationId === selectedDestination) ?? {
          destinationId: selectedDestination,
          companyIds: [],
          planIds: [],
        }
      setDraftVisibility(structuredClone(current))
      setVisibilityDirty(false)
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar planes", {
        description: "No se pudo cargar el catálogo de prueba",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, selectedDestination])

  useEffect(() => {
    void loadCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  useEffect(() => {
    if (!catalog) return
    const current =
      catalog.visibility.find((v) => v.destinationId === selectedDestination) ?? {
        destinationId: selectedDestination,
        companyIds: [],
        planIds: [],
      }
    setDraftVisibility(structuredClone(current))
    setVisibilityDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestination])

  const filteredPlans = useMemo(() => {
    if (!catalog) return []
    const q = planSearch.trim().toLowerCase()
    return catalog.plans.filter((plan) => {
      if (companyFilter !== "all" && plan.companyId !== companyFilter) return false
      if (!q) return true
      const company = companyById(catalog.companies, plan.companyId)
      return (
        plan.name.toLowerCase().includes(q) ||
        company?.name.toLowerCase().includes(q) ||
        plan.id.toLowerCase().includes(q)
      )
    })
  }, [catalog, companyFilter, planSearch])

  const requestMarkupChange = (plan: InsurancePlan, value: string) => {
    const trimmed = value.trim()
    const next = trimmed === "" ? 0 : Number(trimmed)
    if (Number.isNaN(next) || next < 0) {
      toast.error("Markup inválido", { description: "Ingresá un % mayor o igual a 0" })
      setMarkupInputKey((k) => k + 1)
      return
    }
    if (next === plan.markupPercent) return
    setConfirm({ type: "markup", plan, nextMarkup: next })
  }

  const requestActiveToggle = (plan: InsurancePlan, nextActive: boolean) => {
    if (nextActive === plan.active) return
    setConfirm({ type: "active", plan, nextActive })
  }

  const requestSaveVisibility = () => {
    if (!draftVisibility || !visibilityDirty) return
    setConfirm({ type: "visibility" })
  }

  const closeConfirm = (resetMarkupInput = false) => {
    setConfirm(null)
    if (resetMarkupInput) setMarkupInputKey((k) => k + 1)
  }

  const applyPlanMarkup = async (planId: string, nextMarkup: number) => {
    setSavingKey(`plan-markup-${planId}`)
    try {
      const updated = await updatePlanMarkup(planId, nextMarkup)
      setCatalog((prev) =>
        prev
          ? { ...prev, plans: prev.plans.map((p) => (p.id === planId ? updated : p)) }
          : prev
      )
      toast.success(nextMarkup === 0 ? "Markup quitado" : "Markup actualizado")
    } catch {
      toast.error("No se pudo actualizar el markup")
      setMarkupInputKey((k) => k + 1)
    } finally {
      setSavingKey(null)
    }
  }

  const applyPlanActive = async (planId: string, active: boolean) => {
    setSavingKey(`plan-active-${planId}`)
    try {
      const updated = await updatePlanActive(planId, active)
      setCatalog((prev) =>
        prev
          ? { ...prev, plans: prev.plans.map((p) => (p.id === planId ? updated : p)) }
          : prev
      )
      toast.success(active ? "Plan activado" : "Plan desactivado")
    } catch {
      toast.error("No se pudo cambiar el estado del plan")
    } finally {
      setSavingKey(null)
    }
  }

  const applyVisibilitySave = async () => {
    if (!draftVisibility) return
    setSavingKey(`visibility-${draftVisibility.destinationId}`)
    try {
      const updated = await updateDestinationVisibility(draftVisibility)
      setCatalog((prev) => {
        if (!prev) return prev
        const rest = prev.visibility.filter((v) => v.destinationId !== updated.destinationId)
        return { ...prev, visibility: [...rest, updated] }
      })
      setVisibilityDirty(false)
      toast.success("Visibilidad por destino guardada")
    } catch {
      toast.error("No se pudo guardar la visibilidad")
    } finally {
      setSavingKey(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    const pending = confirm
    setConfirm(null)
    if (pending.type === "markup") {
      await applyPlanMarkup(pending.plan.id, pending.nextMarkup)
      return
    }
    if (pending.type === "active") {
      await applyPlanActive(pending.plan.id, pending.nextActive)
      return
    }
    await applyVisibilitySave()
  }

  const toggleCompanyVisibility = (companyId: string, checked: boolean) => {
    setDraftVisibility((prev) => {
      if (!prev || !catalog) return prev
      const companyIds = checked
        ? [...new Set([...prev.companyIds, companyId])]
        : prev.companyIds.filter((id) => id !== companyId)

      const companyPlanIds = new Set(
        catalog.plans.filter((p) => p.companyId === companyId).map((p) => p.id)
      )
      const planIds = checked
        ? prev.planIds
        : prev.planIds.filter((id) => !companyPlanIds.has(id))

      setVisibilityDirty(true)
      return { ...prev, companyIds, planIds }
    })
  }

  const togglePlanVisibility = (plan: InsurancePlan, checked: boolean) => {
    setDraftVisibility((prev) => {
      if (!prev || !catalog) return prev

      let companyIds = prev.companyIds
      if (checked && !companyIds.includes(plan.companyId)) {
        companyIds = [...companyIds, plan.companyId]
      }

      const companyPlans = catalog.plans.filter((p) => p.companyId === plan.companyId)
      const companyPlanIdSet = new Set(companyPlans.map((p) => p.id))
      const hasExplicitPlans = prev.planIds.some((id) => companyPlanIdSet.has(id))

      let planIds = [...prev.planIds]

      if (!hasExplicitPlans && companyIds.includes(plan.companyId)) {
        if (!checked) {
          planIds = [
            ...planIds.filter((id) => !companyPlanIdSet.has(id)),
            ...companyPlans.filter((p) => p.id !== plan.id && p.active).map((p) => p.id),
          ]
        }
      } else if (checked) {
        if (!planIds.includes(plan.id)) planIds.push(plan.id)
      } else if (!hasExplicitPlans) {
        planIds = [
          ...planIds.filter((id) => !companyPlanIdSet.has(id)),
          ...companyPlans.filter((p) => p.id !== plan.id && p.active).map((p) => p.id),
        ]
      } else {
        planIds = planIds.filter((id) => id !== plan.id)
      }

      const enabledForCompany = planIds.filter((id) => companyPlanIdSet.has(id))
      const allActiveIds = companyPlans.filter((p) => p.active).map((p) => p.id)
      const coversAll =
        allActiveIds.length > 0 &&
        allActiveIds.every((id) => enabledForCompany.includes(id)) &&
        enabledForCompany.length === allActiveIds.length

      if (coversAll) {
        planIds = planIds.filter((id) => !companyPlanIdSet.has(id))
      }

      setVisibilityDirty(true)
      return { ...prev, companyIds, planIds }
    })
  }

  const isPlanVisibleInDraft = (plan: InsurancePlan) => {
    if (!draftVisibility) return false
    if (!draftVisibility.companyIds.includes(plan.companyId)) return false
    const companyPlanIds = new Set(
      (catalog?.plans ?? []).filter((p) => p.companyId === plan.companyId).map((p) => p.id)
    )
    const hasExplicit = draftVisibility.planIds.some((id) => companyPlanIds.has(id))
    if (!hasExplicit) return true
    return draftVisibility.planIds.includes(plan.id)
  }

  const resetVisibilityDraft = () => {
    if (!catalog) return
    const current =
      catalog.visibility.find((v) => v.destinationId === selectedDestination) ?? {
        destinationId: selectedDestination,
        companyIds: [],
        planIds: [],
      }
    setDraftVisibility(structuredClone(current))
    setVisibilityDirty(false)
  }

  const confirmTitle =
    confirm?.type === "markup"
      ? "Confirmar markup"
      : confirm?.type === "active"
        ? confirm.nextActive
          ? "Activar plan"
          : "Desactivar plan"
        : "Guardar visibilidad"

  const confirmDescription = (() => {
    if (!confirm) return ""
    if (confirm.type === "markup") {
      return confirm.nextMarkup === 0
        ? `Vas a quitar el markup de “${confirm.plan.name}” (queda en 0%).`
        : `Vas a poner un markup de ${confirm.nextMarkup}% en “${confirm.plan.name}” (antes ${confirm.plan.markupPercent}%).`
    }
    if (confirm.type === "active") {
      return confirm.nextActive
        ? `Vas a activar “${confirm.plan.name}”.`
        : `Vas a desactivar “${confirm.plan.name}”. No se ofrecerá en nuevas cotizaciones mientras esté inactivo.`
    }
    return `Vas a guardar qué compañías y planes se muestran para “${destinationLabel}”. Esto afecta al cotizador.`
  })()

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>Solo administradores pueden gestionar planes.</CardDescription>
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
            Markup opcional por plan (% sobre la tarifa neta de cada cotización) y visibilidad por destino.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCatalog} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="planes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="destinos">Por destino</TabsTrigger>
        </TabsList>

        <TabsContent value="planes" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Catálogo</CardTitle>
              <CardDescription>
                Si querés sumar markup a un plan, poné el %. Si no, dejalo en 0. Los cambios piden confirmación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="w-full sm:w-56">
                  <Label className="text-xs text-muted-foreground">Compañía</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(catalog?.companies ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Buscar plan</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Nombre o ID de plan…"
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {isLoading || !catalog ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compañía</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Cobertura</TableHead>
                        <TableHead className="text-right">Markup %</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No hay planes con esos filtros
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlans.map((plan) => {
                          const company = companyById(catalog.companies, plan.companyId)
                          return (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {company?.name ?? plan.companyId}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{plan.name}</span>
                                  <span className="text-[11px] text-muted-foreground">{plan.id}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatUsd(plan.coverageAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  key={`${plan.id}-${plan.markupPercent}-${markupInputKey}`}
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  className="h-8 w-20 text-right ml-auto"
                                  defaultValue={plan.markupPercent}
                                  disabled={savingKey === `plan-markup-${plan.id}`}
                                  onBlur={(e) => requestMarkupChange(plan, e.target.value)}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={plan.active}
                                  disabled={savingKey === `plan-active-${plan.id}`}
                                  onCheckedChange={(checked) => requestActiveToggle(plan, checked)}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinos" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Visibilidad por destino
              </CardTitle>
              <CardDescription>
                Elegí qué compañías y planes se muestran. Al guardar se pide confirmación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {DESTINATION_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    size="sm"
                    variant={selectedDestination === d.value ? "default" : "outline"}
                    onClick={() => setSelectedDestination(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Destino:{" "}
                  <span className="font-medium text-foreground">{destinationLabel}</span>
                  {visibilityDirty && (
                    <Badge variant="secondary" className="ml-2">
                      Sin guardar
                    </Badge>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!visibilityDirty}
                    onClick={resetVisibilityDraft}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Descartar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!visibilityDirty || savingKey?.startsWith("visibility-")}
                    onClick={requestSaveVisibility}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>

              {isLoading || !catalog || !draftVisibility ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {catalog.companies.map((company) => {
                    const companyEnabled = draftVisibility.companyIds.includes(company.id)
                    const companyPlans = catalog.plans.filter((p) => p.companyId === company.id)
                    return (
                      <div key={company.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`vis-co-${company.id}`}
                            checked={companyEnabled}
                            onCheckedChange={(v) =>
                              toggleCompanyVisibility(company.id, v === true)
                            }
                          />
                          <Label
                            htmlFor={`vis-co-${company.id}`}
                            className="font-medium cursor-pointer flex-1"
                          >
                            {company.name}
                          </Label>
                          <Badge variant="outline" className="text-[10px]">
                            {companyPlans.filter((p) => isPlanVisibleInDraft(p)).length}/
                            {companyPlans.length} planes
                          </Badge>
                        </div>

                        {companyEnabled && (
                          <div className="ml-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {companyPlans.map((plan) => {
                              const checked = isPlanVisibleInDraft(plan)
                              return (
                                <label
                                  key={plan.id}
                                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                                    checked ? "bg-muted/40" : "opacity-70"
                                  } ${!plan.active ? "border-dashed" : ""}`}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) =>
                                      togglePlanVisibility(plan, v === true)
                                    }
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {plan.name}
                                    {!plan.active && (
                                      <span className="text-muted-foreground"> (inactivo)</span>
                                    )}
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {formatUsd(plan.coverageAmount)}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm(confirm?.type === "markup")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirm()}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
