"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CalendarRange,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { listCompanies } from "@/lib/services/companies.service"
import { listPlans } from "@/lib/services/plans.service"
import {
  createPromotion,
  deletePromotion,
  formatPromotionDate,
  getPromotionById,
  groupPromotionsByCompany,
  listPromotions,
  updatePromotion,
} from "@/lib/services/promotions.service"
import type {
  CompanyResponse,
  CreatePromotionRequest,
  PlanResponse,
  PromotionResponse,
  PromotionStatus,
  UpdatePromotionRequest,
} from "@/lib/services/types"
import { toast } from "sonner"

const DESCRIPTION_MAX = 500

const STATUS_OPTIONS: { value: PromotionStatus; label: string }[] = [
  { value: "current", label: "Vigentes" },
  { value: "upcoming", label: "Próximas" },
  { value: "expired", label: "Vencidas" },
  { value: "all", label: "Todas" },
]

type FormMode = "create" | "edit"

type FormState = {
  company_id: string
  description: string
  starts_on: string
  ends_on: string
  plan_ids: number[]
}

const EMPTY_FORM: FormState = {
  company_id: "",
  description: "",
  starts_on: "",
  ends_on: "",
  plan_ids: [],
}

function todayIsoLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function AdminPromotionsManagement() {
  const { user } = useAuth()
  const isAdmin =
    String(user?.role ?? "").toLowerCase() === "admin" ||
    String(user?.role ?? "") === "1"

  const [items, setItems] = useState<PromotionResponse[]>([])
  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PromotionStatus>("all")
  const [companyFilter, setCompanyFilter] = useState<string>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formPlans, setFormPlans] = useState<PlanResponse[]>([])
  const [inactiveLinkedPlans, setInactiveLinkedPlans] = useState<
    Array<{ id: number; name: string }>
  >([])
  const [isLoadingFormPlans, setIsLoadingFormPlans] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<PromotionResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPromotions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Parameters<typeof listPromotions>[0] = {
        status: statusFilter,
        include_inactive: true,
      }
      if (companyFilter !== "all") params.company_id = Number(companyFilter)
      const res = await listPromotions(params)
      setItems(res.items ?? [])
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar promociones", {
        description: error instanceof Error ? error.message : "No se pudo listar",
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, companyFilter])

  const loadCompanies = useCallback(async () => {
    try {
      const res = await listCompanies({ limit: 100, offset: 0 })
      setCompanies(res.items ?? [])
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar compañías", {
        description: error instanceof Error ? error.message : "No se pudo listar compañías",
      })
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    void loadCompanies()
  }, [isAdmin, loadCompanies])

  useEffect(() => {
    if (!isAdmin) return
    void loadPromotions()
  }, [isAdmin, loadPromotions])

  const loadActivePlansForCompany = useCallback(async (companyId: number) => {
    setIsLoadingFormPlans(true)
    try {
      const res = await listPlans({ company_id: companyId, limit: 100, offset: 0 })
      setFormPlans((res.items ?? []).filter((p) => p.active))
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar planes", {
        description: error instanceof Error ? error.message : "No se pudo listar planes",
      })
      setFormPlans([])
    } finally {
      setIsLoadingFormPlans(false)
    }
  }, [])

  useEffect(() => {
    if (!formOpen || !form.company_id) {
      setFormPlans([])
      return
    }
    void loadActivePlansForCompany(Number(form.company_id))
  }, [formOpen, form.company_id, loadActivePlansForCompany])

  const groups = useMemo(() => groupPromotionsByCompany(items), [items])

  const openCreate = () => {
    setFormMode("create")
    setEditingId(null)
    setInactiveLinkedPlans([])
    setForm({
      ...EMPTY_FORM,
      starts_on: todayIsoLocal(),
      ends_on: todayIsoLocal(),
    })
    setFormOpen(true)
  }

  const openEdit = async (promo: PromotionResponse) => {
    setFormMode("edit")
    setEditingId(promo.id)
    setFormOpen(true)
    setIsLoadingDetail(true)
    setInactiveLinkedPlans([])
    try {
      const detail = await getPromotionById(promo.id)
      const inactive = (detail.plans ?? [])
        .filter((p) => !p.active)
        .map((p) => ({ id: p.id, name: p.name }))
      const activeIds = (detail.plans ?? []).filter((p) => p.active).map((p) => p.id)
      setInactiveLinkedPlans(inactive)
      setForm({
        company_id: String(detail.company_id),
        description: detail.description,
        starts_on: detail.starts_on,
        ends_on: detail.ends_on,
        plan_ids: activeIds,
      })
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar la promoción", {
        description: error instanceof Error ? error.message : "No se pudo obtener el detalle",
      })
      setFormOpen(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const togglePlan = (planId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      plan_ids: checked
        ? [...new Set([...prev.plan_ids, planId])]
        : prev.plan_ids.filter((id) => id !== planId),
    }))
  }

  const validateForm = (): string | null => {
    const description = form.description.trim()
    if (!description) return "La descripción es obligatoria"
    if (description.length > DESCRIPTION_MAX) {
      return `La descripción no puede superar ${DESCRIPTION_MAX} caracteres`
    }
    if (formMode === "create" && !form.company_id) return "Elegí una compañía"
    if (!form.starts_on || !form.ends_on) return "Completá las fechas de vigencia"
    if (form.ends_on < form.starts_on) {
      return "La fecha de fin debe ser posterior o igual a la de inicio"
    }
    if (form.plan_ids.length === 0) return "Seleccioná al menos un plan activo"
    return null
  }

  const handleSave = async () => {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setIsSaving(true)
    try {
      if (formMode === "create") {
        const payload: CreatePromotionRequest = {
          company_id: Number(form.company_id),
          description: form.description.trim(),
          starts_on: form.starts_on,
          ends_on: form.ends_on,
          plan_ids: form.plan_ids,
        }
        await createPromotion(payload)
        toast.success("Promoción creada")
      } else if (editingId != null) {
        const payload: UpdatePromotionRequest = {
          description: form.description.trim(),
          starts_on: form.starts_on,
          ends_on: form.ends_on,
          plan_ids: form.plan_ids,
        }
        await updatePromotion(editingId, payload)
        toast.success("Promoción actualizada")
      }
      setFormOpen(false)
      await loadPromotions()
    } catch (err: unknown) {
      console.error(err)
      toast.error(formMode === "create" ? "No se pudo crear" : "No se pudo actualizar", {
        description: err instanceof Error ? err.message : "Error al guardar",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deletePromotion(deleteTarget.id)
      toast.success("Promoción eliminada")
      setDeleteTarget(null)
      await loadPromotions()
    } catch (err: unknown) {
      console.error(err)
      toast.error("No se pudo eliminar", {
        description: err instanceof Error ? err.message : "Error al borrar",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>Solo un administrador puede entrar a esta sección.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Megaphone className="h-5 w-5 text-accent" />
            Gestión de promociones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Altas, ediciones y bajas de promociones por compañía y planes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadPromotions()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva promoción
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>
            El listado incluye compañías y planes inactivos para poder corregir promos
            huérfanas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:max-w-[220px]">
            <Label>Vigencia</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as PromotionStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1.5 sm:max-w-[260px]">
            <Label>Compañía</Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {!c.active ? " (inactiva)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm font-medium">No hay promociones con estos filtros</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá una nueva o cambiá la vigencia / compañía.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <Card key={group.company_id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{group.company_name}</CardTitle>
                  {!group.company_active && (
                    <Badge variant="destructive" className="text-[10px]">
                      Compañía inactiva
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {group.promotions.length} promo
                    {group.promotions.length === 1 ? "" : "s"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="whitespace-nowrap">Vigencia</TableHead>
                      <TableHead>Planes</TableHead>
                      <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.promotions.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="max-w-[320px] align-top">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {promo.description}
                          </p>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" />
                            {formatPromotionDate(promo.starts_on)} —{" "}
                            {formatPromotionDate(promo.ends_on)}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {promo.plans.map((plan) => (
                              <Badge
                                key={plan.id}
                                variant={plan.active ? "secondary" : "outline"}
                                className="font-normal"
                              >
                                {plan.name}
                                {!plan.active ? " (inactivo)" : ""}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void openEdit(promo)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(promo)}
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Nueva promoción" : "Editar promoción"}
            </DialogTitle>
            <DialogDescription>
              Texto libre (máx. {DESCRIPTION_MAX} caracteres), fechas inclusivas y al
              menos un plan activo de la misma compañía.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando detalle…
            </div>
          ) : (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label>Compañía</Label>
                {formMode === "edit" ? (
                  <Input
                    value={
                      companies.find((c) => String(c.id) === form.company_id)?.name ??
                      `Compañía #${form.company_id}`
                    }
                    disabled
                  />
                ) : (
                  <Select
                    value={form.company_id || undefined}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, company_id: v, plan_ids: [] }))
                    }
                  >
                    <SelectTrigger>
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
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="promo-description">Descripción</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {form.description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <Textarea
                  id="promo-description"
                  value={form.description}
                  maxLength={DESCRIPTION_MAX}
                  rows={4}
                  placeholder='Ej: "20% de descuento y hasta 6 cuotas sin interés"'
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="promo-starts">Desde</Label>
                  <Input
                    id="promo-starts"
                    type="date"
                    value={form.starts_on}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, starts_on: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="promo-ends">Hasta</Label>
                  <Input
                    id="promo-ends"
                    type="date"
                    value={form.ends_on}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ends_on: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Planes</Label>
                {!form.company_id ? (
                  <p className="text-xs text-muted-foreground">
                    Primero elegí una compañía para ver sus planes activos.
                  </p>
                ) : isLoadingFormPlans ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando planes…
                  </div>
                ) : formPlans.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay planes activos para esta compañía.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                    {formPlans.map((plan) => {
                      const checked = form.plan_ids.includes(plan.id)
                      return (
                        <label
                          key={plan.id}
                          className="flex cursor-pointer items-start gap-2.5 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => togglePlan(plan.id, v === true)}
                            className="mt-0.5"
                          />
                          <span>{plan.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {inactiveLinkedPlans.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="font-medium">Planes inactivos asociados (no se reenvían)</p>
                    <ul className="mt-1 list-inside list-disc">
                      {inactiveLinkedPlans.map((p) => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-amber-800/80 dark:text-amber-200/80">
                      Reactivalos desde Gestión de planes si querés volver a incluirlos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isLoadingDetail}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formMode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará de forma permanente. Esta acción no se puede deshacer.
              {deleteTarget ? (
                <span className="mt-2 block rounded-md bg-muted px-3 py-2 text-foreground">
                  {deleteTarget.description}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
