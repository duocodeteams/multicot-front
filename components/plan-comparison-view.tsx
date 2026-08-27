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
  Printer,
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

function formatARS(num: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num)
}

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
            {plan.priceUsd !== undefined
              ? `USD ${formatNumber(plan.priceUsd)}`
              : plan.priceArs !== undefined
                ? `ARS ${formatNumber(plan.priceArs)}`
                : `USD ${formatNumber(plan.price)}`}
          </span>
          {plan.priceUsd !== undefined &&
            plan.priceArs !== undefined &&
            plan.exchange_rate !== 2 && (
            <span className="text-[10px] text-muted-foreground">
              ARS {formatNumber(plan.priceArs)}
            </span>
          )}
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
  {
    key: "price",
    label: "Precio Total (USD)",
    getValue: (p) =>
      p.priceUsd !== undefined ? `USD ${formatNumber(p.priceUsd)}` : "-",
  },
  {
    key: "priceARS",
    label: "Precio Total (ARS)",
    getValue: (p) => {
      if (p.priceArs === undefined || p.exchange_rate === 2) return "-"
      const tc =
        p.priceUsd !== undefined && p.exchange_rate && p.exchange_rate > 2
          ? `\n(TC: ${formatNumber(p.exchange_rate)})`
          : ""
      return `${formatARS(p.priceArs)}${tc}`
    },
  },
  {
    key: "priceDay",
    label: "Precio / día",
    getValue: (p) => {
      const currency = p.priceUsd !== undefined ? "USD" : "ARS"
      return `${currency} ${formatNumber(p.pricePerDay)}`
    },
  },
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
                    <span
                      className="text-xl font-black leading-none"
                      style={{ color: theme.labelColor }}
                    >
                      {plan.priceUsd !== undefined
                        ? `USD ${formatNumber(plan.priceUsd)}`
                        : plan.priceArs !== undefined
                          ? `ARS ${formatNumber(plan.priceArs)}`
                          : `USD ${formatNumber(plan.price)}`}
                    </span>
                    {plan.priceUsd !== undefined &&
                      plan.priceArs !== undefined &&
                      plan.exchange_rate !== 2 && (
                      <span className="text-[13px] font-semibold text-foreground/80">
                        {formatARS(plan.priceArs)}
                        {plan.exchange_rate && plan.exchange_rate > 2 ? (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            (TC: {formatNumber(plan.exchange_rate)})
                          </span>
                        ) : null}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {plan.maxCoverage} cobertura máx.
                    </span>
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

  const handleDownloadPdf = () => {
    const selectedPlansSnap = plans.filter((p) => selectedIds.has(p.id))
    if (selectedPlansSnap.length < 2) return

    const win = window.open("", "_blank", "width=1200,height=900")
    if (!win) return

    const origin = window.location.origin
    const destLabel = destinationLabels[quotationData.destino] || quotationData.destino
    const dateStr = `${formatDate(desde)} → ${formatDate(hasta)}`
    const daysStr = `${days} día${days > 1 ? "s" : ""}`
    const paxStr = `${quotationData.edades.length} pasajero${quotationData.edades.length > 1 ? "s" : ""} · ${quotationData.edades.join(", ")} años`
    const todayStr = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })

    const themes = selectedPlansSnap.map((p) => getCompanyTheme(p.empresaCotizacion))
    const coveragesByPlan = selectedPlansSnap.map((plan) => uniqueCoverages(plan))
    const maxRows = Math.max(...coveragesByPlan.map((c) => c.length), 0)

    const pillStyle = `display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;font-weight:600;color:#334155;`

    // Cabecera de columnas
    const theadCols = selectedPlansSnap.map((plan, i) => {
      const t = themes[i]
      const logoHtml = plan.imagen
        ? `<img src="${origin}${plan.imagen.startsWith("/") ? plan.imagen : "/" + plan.imagen}" style="height:24px;width:auto;object-fit:contain;display:block;margin-bottom:5px;" />`
        : ""
      return `
        <th style="min-width:150px;padding:0;text-align:left;vertical-align:top;border:1px solid #e2e8f0;">
          <div style="height:5px;background:linear-gradient(to right,${t.barFrom},${t.barTo});"></div>
          <div style="padding:10px 12px;background:${t.priceBg};">
            ${logoHtml}
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:${t.labelColor};">${plan.empresaCotizacion}</div>
            <div style="font-size:12px;font-weight:600;color:#1e293b;margin-top:3px;line-height:1.3;">${plan.name}</div>
          </div>
        </th>`
    }).join("")

    // Filas de precio/datos fijos
    const fixedRowsHtml = FIXED_ROWS.map((row, idx) =>
      `<tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;white-space:nowrap;">${row.label}</td>
        ${selectedPlansSnap.map((plan, i) => {
        const t = themes[i]
        const isPrice = row.key === "price"
        return `<td style=\"padding:8px 12px;font-weight:${isPrice ? "800" : "500"};font-size:${isPrice ? "14px" : "12px"};color:${isPrice ? t.labelColor : "#1e293b"};border:1px solid #e2e8f0;white-space:pre-line;\">${row.getValue(plan)}</td>`
      }).join("")}
      </tr>`
    ).join("")

    // Separador de coberturas
    const covHeaderHtml = `
      <tr style="background:#f1f5f9;border-top:2px solid #cbd5e1;">
        <td colspan="${selectedPlansSnap.length + 1}" style="padding:7px 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;border:1px solid #e2e8f0;">Coberturas incluidas</td>
      </tr>`

    // Filas de coberturas
    const covRowsHtml = Array.from({ length: maxRows }).map((_, rowIdx) =>
      `<tr style="background:${rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:6px 12px;font-size:10px;font-weight:600;color:#475569;background:${rowIdx % 2 === 0 ? "#f8fafc" : "#eef2f7"};border:1px solid #e2e8f0;white-space:nowrap;">Prestación ${rowIdx + 1}</td>
        ${selectedPlansSnap.map((plan, i) => {
        const t = themes[i]
        const item = coveragesByPlan[i][rowIdx]
        return `<td style="padding:6px 12px;font-size:11px;color:#334155;border:1px solid #e2e8f0;vertical-align:top;">
            ${item
            ? `<span style="color:${t.dotColor};font-weight:700;margin-right:4px;">✓</span>${item}`
            : `<span style="color:#cbd5e1;">—</span>`
          }
          </td>`
      }).join("")}
      </tr>`
    ).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comparación de Planes — Biant</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#1e293b; background:#fff; }
    @page { size:A4 landscape; margin:10mm 12mm 14mm; }
    table { border-collapse:collapse; width:100%; }
  </style>
</head>
<body>
  <div style="padding:0;">

    <!-- HEADER: logos -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <img src="${origin}/portal/biantsinfondo.png" alt="Biant" style="height:46px;width:auto;object-fit:contain;" />
      <div style="text-align:right;">
        <img src="${origin}/biantlogosf.png" alt="Biant" style="height:30px;width:auto;object-fit:contain;opacity:0.6;display:block;margin-left:auto;" />
        <div style="font-size:10px;color:#94a3b8;margin-top:3px;">Cotizador de Asistencia al Viajero</div>
      </div>
    </div>

    <div style="border-top:2px solid #e2e8f0;margin-bottom:14px;"></div>

    <!-- Título + fecha -->
    <h1 style="font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.4px;margin-bottom:3px;">Comparación de Planes</h1>
    <p style="font-size:11px;color:#64748b;margin-bottom:12px;">Generado el ${todayStr}</p>

    <!-- Pills info del viaje -->
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">
      <span style="${pillStyle}">📍 ${destLabel}</span>
      <span style="${pillStyle}">📅 ${dateStr}</span>
      <span style="${pillStyle}">⏱ ${daysStr}</span>
      <span style="${pillStyle}">👤 ${paxStr}</span>
    </div>

    <div style="border-top:1px solid #e2e8f0;margin-bottom:16px;"></div>

    <!-- Tabla de comparación -->
    <table>
      <thead>
        <tr>
          <th style="width:140px;background:#f8fafc;border:1px solid #e2e8f0;padding:0;"></th>
          ${theadCols}
        </tr>
      </thead>
      <tbody>
        ${fixedRowsHtml}
        ${covHeaderHtml}
        ${covRowsHtml}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:10px;color:#94a3b8;">Biant — Cotizador de Asistencia al Viajero</span>
      <span style="font-size:10px;color:#94a3b8;">${todayStr}</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`

    win.document.write(html)
    win.document.close()
  }

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
            onClick={handleDownloadPdf}
          >
            <Printer className="h-4 w-4" />
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
              onClick={handleDownloadPdf}
            >
              <Printer className="h-4 w-4" />
              Descargar comparación en PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
