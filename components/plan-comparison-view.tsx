"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Check,
  Download,
  GitCompareArrows,
  X,
  MapPin,
  CalendarDays,
  Users,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { QuotationData } from "@/components/quotation-form"
import {
  type Plan,
  type CompanyTheme,
  getCompanyTheme,
  formatNumber,
} from "@/components/quotation-results"

// ── Tipos ──────────────────────────────────────────────────

type PlanComparisonViewProps = {
  plans: Plan[]
  quotationData: QuotationData
  onBack: () => void
  onSelectPlan?: (plan: Plan) => void
}

// ── Helpers ────────────────────────────────────────────────

const destinationLabels: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

function normalizeCoverage(str: string): string {
  return str.toLowerCase().trim()
}

function uniqueCoverages(plan: Plan): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of plan.coverage) {
    const norm = normalizeCoverage(item)
    if (!seen.has(norm)) {
      seen.add(norm)
      result.push(item)
    }
  }
  return result
}

// ── Componente de fila info del viaje ─────────────────────

function InfoPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      {label}
    </div>
  )
}

// ── Selector de plan ───────────────────────────────────────

function PlanSelectorCard({
  plan,
  selected,
  disabled,
  onToggle,
}: {
  plan: Plan
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const theme = getCompanyTheme(plan.empresaCotizacion)

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={cn(
        "group relative w-full rounded-2xl text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
        selected
          ? "shadow-lg scale-[1.02]"
          : "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        disabled && !selected && "cursor-not-allowed opacity-35 hover:translate-y-0 hover:shadow-sm"
      )}
      style={
        selected
          ? { border: `2px solid ${theme.barFrom}` }
          : { border: "2px solid transparent", outline: "2px solid hsl(var(--border))" }
      }
    >
      {/* Gradiente superior de color de la compañía */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(to right, ${theme.barFrom}, ${theme.barTo})` }}
      />

      {/* Cuerpo de la tarjeta */}
      <div
        className="flex flex-col gap-3 p-4"
        style={{ background: selected ? theme.priceBg : "hsl(var(--card))" }}
      >

        {/* Fila superior: logo/empresa + checkbox */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            {plan.imagen ? (
              <img
                src={plan.imagen}
                alt={plan.empresaCotizacion}
                className="h-6 w-auto object-contain mb-0.5"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: theme.dotColor }}
                />
                <p
                  className="text-[10px] font-black uppercase tracking-widest truncate"
                  style={{ color: theme.labelColor }}
                >
                  {plan.empresaCotizacion}
                </p>
              </div>
            )}
            {plan.imagen && (
              <p
                className="text-[9px] font-black uppercase tracking-widest truncate"
                style={{ color: theme.labelColor }}
              >
                {plan.empresaCotizacion}
              </p>
            )}
          </div>

          {/* Indicador de selección */}
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
              selected
                ? "scale-110 shadow-md"
                : "border-muted-foreground/25 bg-background group-hover:border-muted-foreground/50"
            )}
            style={
              selected
                ? { backgroundColor: theme.dotColor, borderColor: theme.dotColor }
                : {}
            }
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Nombre del plan */}
        <div>
          <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">
            {plan.name}
          </p>
        </div>

        {/* Separador sutil */}
        <div
          className="h-px w-full opacity-30"
          style={{ background: `linear-gradient(to right, ${theme.barFrom}, transparent)` }}
        />

        {/* Precio */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Precio total
          </span>
          <span
            className="text-xl font-black leading-none"
            style={{ color: selected ? theme.labelColor : "hsl(var(--foreground))" }}
          >
            USD {formatNumber(plan.price)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {plan.maxCoverage} cobertura máx.
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Tabla de comparación ───────────────────────────────────

const FIXED_ROWS: { key: string; label: string; getValue: (p: Plan) => string }[] = [
  { key: "company", label: "Compañía", getValue: (p) => p.empresaCotizacion },
  { key: "price", label: "Precio Total", getValue: (p) => `USD ${formatNumber(p.price)}` },
  { key: "priceDay", label: "Precio / día", getValue: (p) => `USD ${formatNumber(p.pricePerDay)}` },
  { key: "maxCov", label: "Cobertura Máxima", getValue: (p) => p.maxCoverage },
]

function ComparisonTable({
  selected,
  onSelectPlan,
}: {
  selected: Plan[]
  onSelectPlan?: (plan: Plan) => void
}) {
  const themes = selected.map((p) => getCompanyTheme(p.empresaCotizacion))
  const coveragesByPlan = selected.map((plan) => uniqueCoverages(plan))
  const maxCoverageRows = Math.max(...coveragesByPlan.map((items) => items.length), 0)

  return (
    <div id="comparison-print-area" className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr>
            {/* Label column header */}
            <th className="w-44 min-w-[11rem] bg-muted/40 p-0" />

            {selected.map((plan, i) => {
              const theme = themes[i]
              return (
                <th
                  key={plan.id}
                  className="relative min-w-[10rem] p-0 text-left align-top"
                >
                  {/* Barra de color */}
                  <div
                    className="h-1.5"
                    style={{
                      background: `linear-gradient(to right, ${theme.barFrom}, ${theme.barTo})`,
                    }}
                  />
                  <div
                    className="p-3"
                    style={{ backgroundColor: theme.priceBg }}
                  >
                    {plan.imagen && (
                      <img
                        src={plan.imagen}
                        alt={plan.empresaCotizacion}
                        className="mb-1.5 h-6 w-auto object-contain"
                      />
                    )}
                    <p
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: theme.labelColor }}
                    >
                      {plan.empresaCotizacion}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                      {plan.name}
                    </p>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {/* Filas de precio y datos fijos */}
          {FIXED_ROWS.map((row, rowIdx) => (
            <tr
              key={row.key}
              className={cn(
                "border-t border-border",
                rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <td className="bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {row.label}
              </td>
              {selected.map((plan, i) => {
                const theme = themes[i]
                const isPrice = row.key === "price"
                return (
                  <td
                    key={plan.id}
                    className={cn(
                      "px-4 py-2.5 font-medium text-foreground",
                      isPrice && "font-bold text-base"
                    )}
                    style={isPrice ? { color: theme.labelColor } : {}}
                  >
                    {row.getValue(plan)}
                  </td>
                )
              })}
            </tr>
          ))}

          {/* Separador de coberturas */}
          <tr className="border-t-2 border-border bg-muted/60">
            <td
              colSpan={selected.length + 1}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Coberturas incluidas
            </td>
          </tr>

          {/* Prestaciones alineadas por índice (estilo planilla) */}
          {Array.from({ length: maxCoverageRows }).map((_, rowIdx) => {
            const displayIndex = rowIdx + 1
            const isEven = displayIndex % 2 === 0
            return (
              <tr
                key={`coverage-row-${rowIdx}`}
                className={cn("border-t border-border/60", isEven ? "bg-gray-200" : "bg-background")}
              >
                <td className={cn("px-4 py-2 text-xs font-medium text-foreground whitespace-nowrap", isEven ? "bg-gray-200" : "bg-muted/20")}>
                  Prestación {displayIndex}
                </td>
                {selected.map((plan, i) => {
                  const theme = themes[i]
                  const item = coveragesByPlan[i][rowIdx]
                  return (
                    <td key={`${plan.id}-coverage-row-${rowIdx}`} className="px-4 py-2 align-top">
                      {item ? (
                        <div className="flex items-start gap-1.5 text-xs text-foreground leading-snug">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.dotColor }} />
                          <span>{item}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}

          {/* Fila de botones de selección */}
          {onSelectPlan && (
            <tr className="border-t-2 border-border bg-muted/30 no-print">
              <td className="px-4 py-3 bg-muted/40" />
              {selected.map((plan) => {
                return (
                  <td key={plan.id} className="px-3 py-3">
                    <Button
                      size="sm"
                      className="w-full h-9 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-foreground/90"
                      onClick={() => onSelectPlan(plan)}
                    >
                      Seleccionar
                    </Button>
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────

export function PlanComparisonView({
  plans,
  quotationData,
  onBack,
  onSelectPlan,
}: PlanComparisonViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const desde = new Date(quotationData.desde)
  const hasta = new Date(quotationData.hasta)
  const days =
    Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

  const togglePlan = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      }
      return next
    })
  }

  const selectedPlans = plans.filter((p) => selectedIds.has(p.id))
  const canCompare = selectedPlans.length >= 2

  return (
    <div className="flex flex-col gap-6">
      {/* ── Barra superior ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Volver a resultados"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary shrink-0" />
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              Comparador de planes
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Seleccioná de 2 a 5 planes para comparar precio y prestaciones
          </p>
        </div>

        {canCompare && (
          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            disabled
            title="Descarga de PDF temporalmente deshabilitada"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        )}
      </div>

      {/* ── Info del viaje ── */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap gap-2">
        <InfoPill
          icon={MapPin}
          label={destinationLabels[quotationData.destino] || quotationData.destino}
        />
        <InfoPill
          icon={CalendarDays}
          label={`${formatDate(desde)} → ${formatDate(hasta)}`}
        />
        <InfoPill icon={Clock} label={`${days} día${days > 1 ? "s" : ""}`} />
        <InfoPill
          icon={Users}
          label={`${quotationData.edades.length} pasajero${quotationData.edades.length > 1 ? "s" : ""} (${quotationData.edades.join(", ")} años)`}
        />
      </div>

      {/* ── Selector de planes ── */}
      <div className="flex flex-col gap-4">
        {/* Encabezado del selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Elegí los planes a comparar</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Podés seleccionar hasta 5 planes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                onClick={() => setSelectedIds(new Set())}
              >
                Limpiar
              </button>
            )}
            {/* Indicadores de slots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-200",
                    i < selectedIds.size
                      ? "scale-125"
                      : "bg-muted-foreground/20"
                  )}
                  style={i < selectedIds.size ? { backgroundColor: "#6366f1" } : {}}
                />
              ))}
              <span className="ml-1 text-xs font-bold text-foreground tabular-nums">
                {selectedIds.size}<span className="font-normal text-muted-foreground">/5</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {plans.map((plan) => (
            <PlanSelectorCard
              key={plan.id}
              plan={plan}
              selected={selectedIds.has(plan.id)}
              disabled={selectedIds.size >= 5}
              onToggle={() => togglePlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Estado vacío o instrucción ── */}
      {!canCompare && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 py-16 px-6 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <GitCompareArrows className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-bold text-foreground">
              {selectedIds.size === 0
                ? "Seleccioná al menos 2 planes"
                : "Falta un plan más"}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {selectedIds.size === 0
                ? "Hacé clic en las tarjetas de arriba para elegir los planes que querés comparar."
                : `Tenés ${selectedIds.size} plan seleccionado. Elegí uno más para ver la comparación completa.`}
            </p>
          </div>
          {/* Indicador de progreso */}
          <div className="flex items-center gap-2 mt-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i < selectedIds.size ? "w-8 bg-primary" : "w-8 bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tabla de comparación ── */}
      {canCompare && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Comparación de{" "}
              <span className="text-primary">{selectedPlans.length} planes</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Desplazá horizontalmente para ver todos los planes →
            </p>
          </div>

          <ComparisonTable selected={selectedPlans} onSelectPlan={onSelectPlan} />

          {/* Botón de descarga al pie */}
          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
              title="Descarga de PDF temporalmente deshabilitada"
            >
              <Download className="h-4 w-4" />
              Descargar comparación en PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
