"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  KeyRound,
  User,
  CheckCircle2,
  Shield,
  FileText,
  ScrollText,
} from "lucide-react"
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
  // Credenciales del portal de emisión
  portalUrl?: string
  portalUser?: string
  portalPassword?: string
  // URLs de documentos descargables
  pdfDetallePlan?: string
  pdfCondicionesGenerales?: string
}

type PlanEmissionViewProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  onBack: () => void // Vuelve a los resultados (planes cotizados)
  onBackToForm?: () => void // Vuelve al formulario (inicio)
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

// ── Subcomponente: campo de credencial ────────────────────
function CredentialField({
  icon: Icon,
  label,
  value,
  isPassword = false,
  isLink = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  isPassword?: boolean
  isLink?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const displayValue = isPassword && !visible ? "•".repeat(Math.min(value.length, 12)) : value

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copiado`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <span className="flex-1 text-sm font-mono font-medium text-foreground break-all select-all">
          {displayValue}
        </span>
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
          aria-label={`Copiar ${label}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      {isLink && (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 flex items-center gap-1 w-fit transition-colors cursor-pointer"
        >
          Abrir en nueva pestaña
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export function PlanEmissionView({ plan, quotationData, onBack, onBackToForm }: PlanEmissionViewProps) {
  const desde = new Date(quotationData.desde)
  const hasta = new Date(quotationData.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

  const portalUrl = plan.portalUrl || "portal.biantseguros.com"
  const portalUser = plan.portalUser || "—"
  const portalPassword = plan.portalPassword || "—"
  const hasCredentials = plan.portalUrl || plan.portalUser || plan.portalPassword

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
            Usá las credenciales del portal para emitir este plan
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
          {/* Precio + datos del viaje */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Bloque de precio — solo PVP */}
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

          {/* Botones de descarga de documentos */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                handleDownloadPdf(plan.pdfCondicionesGenerales, `Condiciones_Generales_${plan.empresaCotizacion.replace(/\s+/g, "_")}.pdf`)
              }
            >
              <ScrollText className="h-4 w-4 text-primary shrink-0" />
              Condiciones generales (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Credenciales del portal ── */}
      <Card className="overflow-hidden border-border">
        <div className="h-1 bg-gradient-to-r from-accent/80 to-accent/40" />
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <KeyRound className="h-4 w-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">Acceso al portal de emisión</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ingresá con estas credenciales para emitir el plan
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <CredentialField
              icon={Globe}
              label="URL del portal"
              value={portalUrl}
              isLink
            />
            <CredentialField
              icon={User}
              label="Usuario"
              value={portalUser}
            />
            <CredentialField
              icon={KeyRound}
              label="Contraseña"
              value={portalPassword}
              isPassword
            />
          </div>

          {!hasCredentials && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-dashed border-border">
              ⚠️ Las credenciales del portal aún no están configuradas para esta compañía.
              Contactá a tu administrador.
            </p>
          )}

          <a
            href={portalUrl.startsWith("http") ? portalUrl : `https://${portalUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full" size="lg">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir al portal de emisión
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* ── Pie: volver ── */}
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
