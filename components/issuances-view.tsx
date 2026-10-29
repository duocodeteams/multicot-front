"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FileCheck2,
  Loader2,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listIssuances, type IssuanceListItem } from "@/lib/services"
import { ISSUANCE_STATUS_LABELS } from "@/lib/issuance/mocks/issuances"
import type { IssuanceStatus } from "@/lib/issuance/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const STATUS_FILTERS: Array<{ value: IssuanceStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "issued", label: "Emitidas" },
  { value: "processing", label: "Procesando" },
  { value: "awaiting_payment", label: "Esperando pago" },
  { value: "review", label: "En revisión" },
  { value: "error", label: "Error" },
  { value: "draft", label: "Borrador" },
]

function statusBadgeClass(status: IssuanceStatus): string {
  switch (status) {
    case "issued":
      return "bg-emerald-600 text-white hover:bg-emerald-600 border-transparent"
    case "processing":
    case "validating":
    case "pending":
      return "bg-sky-600 text-white hover:bg-sky-600 border-transparent"
    case "awaiting_payment":
      return "bg-amber-500 text-white hover:bg-amber-500 border-transparent"
    case "review":
      return "bg-violet-600 text-white hover:bg-violet-600 border-transparent"
    case "error":
      return "bg-destructive text-destructive-foreground hover:bg-destructive border-transparent"
    case "draft":
    default:
      return "bg-muted text-muted-foreground hover:bg-muted"
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function IssuancesView() {
  const { user } = useAuth()
  const isAdmin =
    String(user?.role ?? "").toLowerCase() === "admin" ||
    String(user?.role ?? "") === "1"

  const [items, setItems] = useState<IssuanceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<IssuanceStatus | "all">("all")
  const [selected, setSelected] = useState<IssuanceListItem | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listIssuances({
        status,
        search: search.trim() || undefined,
      })
      setItems(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar las emisiones"
      toast.error("Error", { description: message })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const counts = useMemo(() => {
    const base = { all: items.length } as Record<string, number>
    for (const item of items) {
      base[item.status] = (base[item.status] ?? 0) + 1
    }
    return base
  }, [items])

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <FileCheck2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">Emisiones</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Seguimiento de emisiones de todas las agencias (mock)."
                : "Historial de emisiones asociadas a tu cuenta (mock)."}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wide">
          Mock
        </Badge>
      </div>

      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Listado</CardTitle>
              <CardDescription className="text-xs">
                Filtrá por estado o buscá por titular, plan o referencia.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 w-fit"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row pt-1">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load()
                }}
                placeholder="Buscar titular, plan, compañía…"
                className="pl-8 h-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as IssuanceStatus | "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" className="h-9" onClick={() => void load()}>
              Buscar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando emisiones…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground px-4">
              <AlertCircle className="h-5 w-5" />
              No hay emisiones para los filtros seleccionados.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="flex flex-col gap-2 px-4 pb-4 sm:hidden">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="rounded-lg border border-border bg-card p-3 text-left flex flex-col gap-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{item.holderName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.planName} · {item.companyName}
                        </p>
                      </div>
                      <Badge className={cn("shrink-0 text-[10px]", statusBadgeClass(item.status))}>
                        {ISSUANCE_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{formatDate(item.createdAt)}</span>
                      <span className="font-medium text-foreground">{item.amountLabel}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Titular</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Compañía</TableHead>
                      {isAdmin && <TableHead>Agencia</TableHead>}
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(item)}
                      >
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.holderName}</TableCell>
                        <TableCell className="text-xs">{item.planName}</TableCell>
                        <TableCell className="text-xs">{item.companyName}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-xs text-muted-foreground">
                            {item.agencyName ?? "—"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge className={cn("text-[10px]", statusBadgeClass(item.status))}>
                            {ISSUANCE_STATUS_LABELS[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium whitespace-nowrap">
                          {item.amountLabel}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detalle simple */}
      {selected && (
        <Card className="border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
          <CardHeader className="pb-2 pt-4 px-4 sm:px-5 flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Detalle de emisión</CardTitle>
              <CardDescription className="text-xs font-mono">{selected.id}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
            <DetailRow label="Titular" value={selected.holderName} />
            <DetailRow label="Estado" value={ISSUANCE_STATUS_LABELS[selected.status]} />
            <DetailRow label="Plan" value={selected.planName} />
            <DetailRow label="Compañía" value={selected.companyName} />
            <DetailRow label="Pasajeros" value={String(selected.passengerCount)} />
            <DetailRow label="Importe" value={selected.amountLabel} />
            <DetailRow label="Referencia" value={selected.externalPolicyId ?? "—"} mono />
            <DetailRow label="Fecha" value={formatDate(selected.createdAt)} />
            {isAdmin && <DetailRow label="Agencia" value={selected.agencyName ?? "—"} />}
            <p className="sm:col-span-2 text-[11px] text-muted-foreground pt-2 border-t border-border">
              Vista mock: cuando el backend esté listo se mostrarán intentos, eventos y documentos.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {counts.all} emisión{counts.all !== 1 ? "es" : ""} · datos de demostración
        </p>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium text-right break-all", mono && "font-mono")}>
        {value}
      </span>
    </div>
  )
}
