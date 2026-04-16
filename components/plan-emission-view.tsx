"use client"

import { ArrowLeft, ExternalLink, Globe, CheckCircle2, Shield, FileText, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { QuotationData } from "@/components/quotation-form"

// ── Tipos ─────────────────────────────────────────────────
export type SelectedPlan = {
  id: string | number
  name: string
  price: number
  pricePerDay: number
  badge: string | null
  coverage: string[]
  maxCoverage: string
  empresaCotizacion: string
  imagen?: string
  tarifaTotalUnPago: number
  tarifaNeta: number
  totalUsd: number
  pdfDetallePlan?: string
  pdfCondicionesGenerales?: string
}

type PlanEmissionViewProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  onBack: () => void
  onBackToForm?: () => void
}

// ── Helpers ───────────────────────────────────────────────
function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

const destinationLabels: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

// 🔥 Mapeo de compañía → URL
const portalUrls: Record<string, string> = {
  cardinalassistance: "https://evoucher.cardinalassistance.com/bo/login",
  universalassistance: "https://ar.ec.universal-assistance.com/Emision/Login",
  newtravelassistance: "https://newtravelassistance.page/app/pages/login.php",
  goassistance: "https://back.goassistance.com/v3/Ingresar?ReturnUrl=%2Fv3%2F",
}

// ── Componente principal ──────────────────────────────────
export function PlanEmissionView({ plan, quotationData, onBack, onBackToForm }: PlanEmissionViewProps) {
  const desde = new Date(quotationData.desde)
  const hasta = new Date(quotationData.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
 const normalizeCompany = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD") // elimina acentos
    .replace(/[\u0300-\u036f]/g, "") // limpia diacríticos
    .replace(/[^a-z0-9]/g, "") // elimina TODO lo que no sea alfanumérico
  // Normalizamos el nombre de la compañía
  const empresaKey = normalizeCompany(plan.empresaCotizacion)
  console.log('empresa', empresaKey)
  const portalUrl = portalUrls[empresaKey]

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

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">

      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground leading-tight">
            Plan seleccionado
          </h2>
          <p className="text-xs text-muted-foreground">
            Accedé al portal de la compañía para emitir este plan
          </p>
        </div>
      </div>

      {/* ── Resumen del plan ── */}
      <Card className="overflow-hidden border-border">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {plan.imagen ? (
                <img
                  src={plan.imagen}
                  alt={plan.empresaCotizacion}
                  className="h-10 w-auto object-contain shrink-0 mt-0.5"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      ⭐ {plan.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
                  {plan.empresaCotizacion}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-green-500/50 text-green-600 bg-green-50 shrink-0 flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Seleccionado
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* Precio */}
            <div className="rounded-lg bg-primary/8 border border-primary/15 p-4">
              <p className="text-xs text-muted-foreground mb-1">Precio de venta (PVP)</p>
              <p className="text-3xl font-bold text-foreground">
                USD {formatNumber(plan.price)}
              </p>
              {days > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  USD {formatNumber(plan.pricePerDay)} / día por persona
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-primary/10 text-xs">
                <span className="text-muted-foreground">Cobertura máxima</span>
                <p className="font-semibold text-accent text-sm mt-0.5">{plan.maxCoverage}</p>
              </div>
            </div>

            {/* Datos del viaje */}
            <div className="rounded-lg bg-muted/40 border border-border p-4 flex flex-col gap-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Datos del viaje
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destino</span>
                <span className="font-medium">{destinationLabels[quotationData.destino] || quotationData.destino}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desde</span>
                <span className="font-medium">{formatDate(desde)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hasta</span>
                <span className="font-medium">{formatDate(hasta)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium">{days} día{days > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pasajeros</span>
                <span className="font-medium">
                  {quotationData.edades.length} ({quotationData.edades.join(", ")} años)
                </span>
              </div>
            </div>
          </div>

          {/* PDFs */}
          <div className="grid grid-cols-1 gap-2 hidden sm:grid-cols-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() =>
                handleDownloadPdf(plan.pdfDetallePlan, `Detalle_${plan.name.replace(/\s+/g, "_")}.pdf`)
              }
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              Detalle del plan (PDF)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() =>
                handleDownloadPdf(plan.pdfCondicionesGenerales, `Condiciones_${plan.empresaCotizacion}.pdf`)
              }
            >
              <ScrollText className="h-4 w-4 text-primary shrink-0" />
              Condiciones generales (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Portal ── */}
      <Card className="overflow-hidden border-border">
        <div className="h-1 bg-gradient-to-r from-accent/80 to-accent/40" />
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <Globe className="h-4 w-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">Portal de emisión</CardTitle>
              <p className="text-xs text-muted-foreground">
                Serás redirigido al portal de la compañía
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {portalUrl ? (
            <>
              <div className="text-sm font-mono bg-muted/40 border border-border rounded-lg px-3 py-2 break-all">
                {portalUrl}
              </div>

              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full" size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ir al portal
                </Button>
              </a>
            </>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-dashed border-border">
              ⚠️ No hay portal configurado para esta compañía.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Volver ── */}
      <div className="flex justify-center pb-2">
        <Button
          variant="ghost"
          onClick={onBackToForm || onBack}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>
      </div>

    </div>
  )
}