"use client"

import { CheckCircle2, Shield, FileText, ScrollText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/lib/issuance/types"

const destinationLabels: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

type PlanSummarySidebarProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  portalUrl?: string
  /** Compacto horizontal para mobile */
  variant?: "sidebar" | "compact"
}

export function PlanSummarySidebar({
  plan,
  quotationData,
  portalUrl,
  variant = "sidebar",
}: PlanSummarySidebarProps) {
  const desde = new Date(quotationData.desde)
  const hasta = new Date(quotationData.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

  const priceLabel =
    plan.priceUsd !== undefined
      ? `USD ${formatNumber(plan.priceUsd)}`
      : plan.priceArs !== undefined
        ? `ARS ${formatNumber(plan.priceArs)}`
        : `USD ${formatNumber(plan.price)}`

  const handleDownloadPdf = (url?: string, fileName?: string) => {
    if (!url) {
      toast.info("El documento no está disponible aún para esta compañía")
      return
    }
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "documento.pdf"
    a.target = "_blank"
    a.click()
  }

  if (variant === "compact") {
    return (
      <aside className="rounded-xl border border-border bg-card overflow-hidden lg:hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
        <div className="p-3 flex items-center gap-3">
          {plan.imagen ? (
            <img
              src={plan.imagen}
              alt={plan.empresaCotizacion}
              className="h-8 w-auto object-contain shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">{plan.name}</p>
              {plan.badge && (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[9px] uppercase px-1.5 py-0">
                  {plan.badge}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {plan.empresaCotizacion} · {destinationLabels[quotationData.destino] || quotationData.destino} · {days}d
            </p>
          </div>
          <div className="text-right shrink-0">
            {plan.badge &&
              plan.basePriceUsd !== undefined &&
              plan.priceUsd !== undefined &&
              plan.basePriceUsd > plan.priceUsd && (
                <p className="text-[10px] text-muted-foreground line-through">
                  USD {formatNumber(plan.basePriceUsd)}
                </p>
              )}
            <p className="text-sm font-bold text-foreground">{priceLabel}</p>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="rounded-xl border border-border bg-card overflow-hidden sticky top-4">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />

      <div className="p-4 flex flex-col gap-4">
        {/* Cabecera plan */}
        <div className="flex items-start gap-3">
          {plan.imagen ? (
            <img
              src={plan.imagen}
              alt={plan.empresaCotizacion}
              className="h-9 w-auto object-contain shrink-0 mt-0.5"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground leading-snug">{plan.name}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
              {plan.empresaCotizacion}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {plan.badge && (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[9px] uppercase tracking-wide">
                  {plan.badge}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-green-500/50 text-green-600 bg-green-50 text-[9px] flex items-center gap-0.5"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Seleccionado
              </Badge>
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="rounded-lg bg-primary/8 border border-primary/15 p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">
            Precio de venta
          </p>
          {plan.badge &&
            plan.basePriceUsd !== undefined &&
            plan.priceUsd !== undefined &&
            plan.basePriceUsd > plan.priceUsd && (
              <p className="text-xs text-muted-foreground line-through">
                USD {formatNumber(plan.basePriceUsd)}
              </p>
            )}
          {plan.badge &&
            plan.priceUsd === undefined &&
            plan.basePriceArs !== undefined &&
            plan.priceArs !== undefined &&
            plan.basePriceArs > plan.priceArs && (
              <p className="text-xs text-muted-foreground line-through">
                ARS {formatNumber(plan.basePriceArs)}
              </p>
            )}
          <p className="text-2xl font-bold text-foreground leading-tight">{priceLabel}</p>
          {plan.priceUsd !== undefined &&
            plan.priceArs !== undefined &&
            plan.exchange_rate !== 2 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ARS {formatNumber(plan.priceArs)}
                {plan.exchange_rate && plan.exchange_rate > 2
                  ? ` · TC ${formatNumber(plan.exchange_rate)}`
                  : ""}
              </p>
            )}
          {days > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {plan.priceUsd !== undefined ? "USD" : "ARS"} {formatNumber(plan.pricePerDay)} / día
              por persona
            </p>
          )}
          <div className="mt-2.5 pt-2.5 border-t border-primary/10">
            <p className="text-[10px] text-muted-foreground">Cobertura máxima</p>
            <p className="font-semibold text-accent text-sm">{plan.maxCoverage}</p>
          </div>
        </div>

        {/* Viaje */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Datos del viaje
          </p>
          <dl className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Destino</dt>
              <dd className="font-medium text-right">
                {destinationLabels[quotationData.destino] || quotationData.destino}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Desde</dt>
              <dd className="font-medium">{formatDate(desde)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Hasta</dt>
              <dd className="font-medium">{formatDate(hasta)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Duración</dt>
              <dd className="font-medium">
                {days} día{days > 1 ? "s" : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Pasajeros</dt>
              <dd className="font-medium text-right">
                {quotationData.edades.length} ({quotationData.edades.join(", ")} años)
              </dd>
            </div>
          </dl>
        </div>

        {/* PDFs */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2 text-xs"
            onClick={() =>
              handleDownloadPdf(plan.pdfDetallePlan, `Detalle_${plan.name.replace(/\s+/g, "_")}.pdf`)
            }
          >
            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
            Detalle del plan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2 text-xs"
            onClick={() =>
              handleDownloadPdf(
                plan.pdfCondicionesGenerales,
                `Condiciones_${plan.empresaCotizacion}.pdf`
              )
            }
          >
            <ScrollText className="h-3.5 w-3.5 text-primary shrink-0" />
            Condiciones generales
          </Button>
          {portalUrl && (
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 px-2 text-xs text-muted-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                Portal de la compañía
              </Button>
            </a>
          )}
        </div>
      </div>
    </aside>
  )
}
