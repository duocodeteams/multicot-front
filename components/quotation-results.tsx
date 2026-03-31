"use client"

import { useState } from "react"
import { Check, ArrowLeft, Eye, MapPin, CalendarDays, Users, Clock, Star, GitCompareArrows, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/components/plan-emission-view"

export type Plan = {
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
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

function parseCoverageAmount(coverageStr: string): number {
  // Extrae el número de strings como "USD 30.000" (formato AR) o "USD 30,000" (formato US)
  const match = coverageStr.match(/[\d.,]+/)
  if (!match) return 0
  const numStr = match[0]
  // Si tiene punto y coma, asumimos formato US (30,000.50)
  // Si solo tiene puntos, asumimos formato AR (30.000)
  if (numStr.includes(",") && numStr.includes(".")) {
    // Formato US: 30,000.50 -> 30000.50
    return parseFloat(numStr.replace(/,/g, "")) || 0
  } else if (numStr.includes(".") && !numStr.includes(",")) {
    // Formato AR: 30.000 -> 30000
    return parseFloat(numStr.replace(/\./g, "")) || 0
  } else if (numStr.includes(",")) {
    // Solo coma: podría ser decimal o miles, intentamos ambos
    return parseFloat(numStr.replace(/,/g, ".")) || parseFloat(numStr.replace(/,/g, "")) || 0
  }
  return parseFloat(numStr) || 0
}

function parseNumber(value: string | number | undefined, defaultValue: number = 0): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

function generatePlansFromBackend(backendResponse: any, days: number): Plan[] | null {
  if (!backendResponse) return null

  if (backendResponse.plans && Array.isArray(backendResponse.plans)) {
    const plans: Plan[] = backendResponse.plans.map((planData: any) => {
      const finalRateUsd = parseNumber(planData.final_rate_usd || planData.final_rate, 0)
      const coverageAmount = parseNumber(planData.coverage_amount, 0)
      const netRate = parseNumber(planData.net_rate, 0)
      const benefits = Array.isArray(planData.benefits) ? planData.benefits : []
      const coverage = benefits
        .map((benefit: any) => {
          if (!benefit) return ""
          
          // Si es un objeto con nombre y valor
          if (typeof benefit === "object") {
            const nombre = benefit.nombre || benefit.name || ""
            const valor = benefit.valor || ""
            
            // Limpiar y formatear el valor
            let valorFormateado = valor.trim()
            // Normalizar "USS" a "USD" y limpiar espacios
            valorFormateado = valorFormateado.replace(/USS/gi, "USD").trim()
            
            // Si hay valor, combinarlo con el nombre
            if (nombre && valorFormateado) {
              return `${nombre} - ${valorFormateado}`
            }
            // Si solo hay nombre, devolverlo
            if (nombre) return nombre
            // Si solo hay valor (raro pero posible)
            if (valorFormateado) return valorFormateado
          }
          
          // Si es un string directo
          if (typeof benefit === "string") return benefit.trim()
          
          return ""
        })
        .filter((c: string) => c && c.trim() !== "")

      if (coverage.length === 0) {
        coverage.push("Asistencia médica")
        coverage.push("Asistencia telefónica 24/7")
      }

      return {
        id: planData.id || planData.plan_id || `plan-${Math.random()}`,
        name: planData.plan_name || planData.plan || "Plan",
        price: finalRateUsd,
        pricePerDay: days > 0 ? Math.round(finalRateUsd / days) : finalRateUsd,
        badge: null,
        coverage,
        maxCoverage: `USD ${formatNumber(coverageAmount)}`,
        empresaCotizacion: planData.company || "Compañía",
        imagen: planData.imagen,
        tarifaTotalUnPago: finalRateUsd,
        tarifaNeta: netRate,
        totalUsd: finalRateUsd,
      } as Plan
    })

    plans.sort((a, b) => a.price - b.price)
    return plans.length > 0 ? plans : null
  }

  if (backendResponse.cotizaciones) {
    const plans: Plan[] = []
    const cotizaciones = backendResponse.cotizaciones

    Object.keys(cotizaciones).forEach((empresa) => {
      const cotizacionesEmpresa = cotizaciones[empresa]
      if (Array.isArray(cotizacionesEmpresa)) {
        cotizacionesEmpresa.forEach((cotizacion: any) => {
          const prestaciones = Array.isArray(cotizacion.prestaciones) ? cotizacion.prestaciones : []
          const coverageRaw = prestaciones
            .slice(0, 6)
            .map((p: any) => {
              if (typeof p === "string") return p
              return p?.nombre || p?.descripcion || "Prestación incluida"
            })
            .filter((c: string) => c && c.trim() !== "")
          const coverage = Array.from(new Set(coverageRaw)) as string[]
          if (coverage.length === 0) {
            coverage.push("Asistencia médica")
            coverage.push("Asistencia telefónica 24/7")
          }
          plans.push({
            id: cotizacion.id || `${empresa}-${Math.random()}`,
            name: `${cotizacion.plan || "Plan"}`,
            price: parseNumber(cotizacion.totalUsd || cotizacion.tarifaApi, 0),
            pricePerDay:
              days > 0
                ? Math.round(parseNumber(cotizacion.totalUsd || cotizacion.tarifaApi, 0) / days)
                : parseNumber(cotizacion.totalUsd || cotizacion.tarifaApi, 0),
            badge: null,
            coverage,
            maxCoverage: `USD ${formatNumber(parseNumber(cotizacion.montoCobertura, 0))}`,
            empresaCotizacion: cotizacion.empresaCotizacion || empresa,
            imagen: cotizacion.imagen,
            tarifaTotalUnPago: parseNumber(cotizacion.tarifaTotalUnPago, 0),
            tarifaNeta: parseNumber(cotizacion.tarifaNeta, 0),
            totalUsd: parseNumber(cotizacion.totalUsd || cotizacion.tarifaApi, 0),
          })
        })
      }
    })

    plans.sort((a, b) => a.price - b.price)
    return plans.length > 0 ? plans : null
  }

  return null
}

function generatePlans(data: QuotationData): Plan[] {
  const desde = new Date(data.desde)
  const hasta = new Date(data.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 7
  const passengerCount = data.edades.length
  const baseMultiplier =
    data.destino === "1001" || data.destino === "1004" ? 1.5 : data.destino === "1003" ? 1.3 : 1
  const ages = data.edades.map((a) => parseInt(a, 10))
  const ageMultiplier = ages.some((a) => a > 65) ? 1.4 : 1
  const base = days * passengerCount * baseMultiplier * ageMultiplier

  return [
    {
      id: "esencial",
      name: "Plan Esencial",
      price: Math.round(base * 2.5),
      pricePerDay: Math.round((base * 2.5) / days),
      badge: null,
      maxCoverage: "USD 30.000",
      coverage: [
        "Asistencia médica hasta USD 30.000",
        "Equipaje hasta USD 800",
        "Cancelación de viaje",
        "Asistencia telefónica 24/7",
      ],
      empresaCotizacion: "Biant Seguros",
      tarifaTotalUnPago: Math.round(base * 2.5),
      tarifaNeta: Math.round(base * 2),
      totalUsd: Math.round(base * 2.5),
    },
    {
      id: "plus",
      name: "Plan Plus",
      price: Math.round(base * 4.2),
      pricePerDay: Math.round((base * 4.2) / days),
      badge: null,
      maxCoverage: "USD 60.000",
      coverage: [
        "Asistencia médica hasta USD 60.000",
        "Equipaje hasta USD 1.500",
        "Cancelación de viaje",
        "Deportes y actividades de aventura",
        "Asistencia telefónica 24/7",
        "Cobertura COVID-19",
      ],
      empresaCotizacion: "Biant Seguros",
      tarifaTotalUnPago: Math.round(base * 4.2),
      tarifaNeta: Math.round(base * 3.5),
      totalUsd: Math.round(base * 4.2),
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: Math.round(base * 6.8),
      pricePerDay: Math.round((base * 6.8) / days),
      badge: null,
      maxCoverage: "USD 150.000",
      coverage: [
        "Asistencia médica hasta USD 150.000",
        "Equipaje hasta USD 2.500",
        "Cancelación de viaje completa",
        "Deportes y aventura extrema",
        "Asistencia telefónica 24/7",
        "Cobertura COVID-19",
        "Preexistencias hasta USD 10.000",
        "Repatriación sanitaria",
      ],
      empresaCotizacion: "Biant Seguros",
      tarifaTotalUnPago: Math.round(base * 6.8),
      tarifaNeta: Math.round(base * 5.5),
      totalUsd: Math.round(base * 6.8),
    },
  ]
}

// ── Skeleton ──────────────────────────────────────────────
export function QuotationResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip skeleton */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="h-1 bg-muted" />
            <div className="p-4 flex flex-col gap-4">
              {/* Company header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
              {/* Plan name */}
              <Skeleton className="h-5 w-40" />
              {/* Price block */}
              <Skeleton className="h-16 w-full rounded-xl" />
              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/70" />
                <Skeleton className="h-2.5 w-20" />
                <div className="h-px flex-1 bg-border/70" />
              </div>
              {/* Benefits */}
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-start gap-2.5">
                  <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                  <Skeleton className={`h-3.5 ${j === 3 ? "w-3/5" : "w-full"}`} />
                </div>
              ))}
              {/* Extra badge */}
              <Skeleton className="h-6 w-36 rounded-full" />
              {/* Buttons */}
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────
type QuotationResultsProps = {
  data: QuotationData
  backendResponse?: any | null
  onBack: () => void
  onSelectPlan?: (plan: SelectedPlan) => void
  onCompare?: (plans: Plan[]) => void
}

const destinationLabels: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

const tripTypeLabels: Record<string, string> = {
  ONE_TRIP: "Un viaje",
  MULTI_TRIP30: "Multi 30 días",
  MULTI_TRIP60: "Multi 60 días",
  MULTI_TRIP90: "Multi 90 días",
}

// ── Temas de color por compañía ───────────────────────────
export type CompanyTheme = {
  barFrom: string
  barTo: string
  labelColor: string
  priceBg: string
  priceBorder: string
  dotColor: string
  btnBg: string
  btnText: string
  logo: string
}

// Paletas oficiales de cada compañía
// barFrom → barTo: gradiente de la franja top y dorso
// El fondo de la carta es blanco; los detalles usan estos colores
const COMPANY_THEMES: Record<string, CompanyTheme> = {
  // ── Pax Assistance: púrpura → magenta ─────────────────────
  "pax assistance": {
    barFrom: "#400099", barTo: "#e81eb2",
    labelColor: "#400099",
    priceBg: "rgba(64,0,153,0.05)", priceBorder: "rgba(64,0,153,0.18)",
    dotColor: "#400099",
    btnBg: "linear-gradient(to right,#400099,#e81eb2)", btnText: "#ffffff",
    logo: '/paxlogo.png'
  },
  // ── Cardinal Assistance: rojo → naranja ───────────────────
  "cardinal assistance": {
    barFrom: "#e60252", barTo: "#f29100",
    labelColor: "#c46d00",
    priceBg: "rgba(242,145,0,0.08)", priceBorder: "rgba(242,145,0,0.28)",
    dotColor: "#f29100",
    btnBg: "linear-gradient(to right,#e60252,#f29100)", btnText: "#ffffff",
    logo: '/cardinallogo.png'
  },
  // ── Go Assistance: azul eléctrico → magenta ──────────────
  "go assistance": {
    barFrom: "#0a68ff", barTo: "#ef08ff",
    labelColor: "#7738ff",
    priceBg: "rgba(119,56,255,0.05)", priceBorder: "rgba(119,56,255,0.18)",
    dotColor: "#7738ff",
    btnBg: "linear-gradient(to right,#0a68ff,#ef08ff)", btnText: "#ffffff",
    logo: '/gologo.png'
  },
  // ── Inter Assist: verde lima → verde oscuro ───────────────
  "inter assist": {
    barFrom: "#9cc45c", barTo: "#5a8a2a",
    labelColor: "#3d6018",
    priceBg: "rgba(90,138,42,0.06)", priceBorder: "rgba(90,138,42,0.18)",
    dotColor: "#5a8a2a",
    btnBg: "linear-gradient(to right,#9cc45c,#5a8a2a)", btnText: "#ffffff",
    logo: '/interlogo.png'
  },
  // ── Terrawind: azul → navy ────────────────────────────────
  "terrawind": {
    barFrom: "#007cba", barTo: "#223e66",
    labelColor: "#005a8a",
    priceBg: "rgba(0,124,186,0.05)", priceBorder: "rgba(0,124,186,0.18)",
    dotColor: "#007cba",
    btnBg: "linear-gradient(to right,#007cba,#223e66)", btnText: "#ffffff",
    logo: '/terrawindlogo.png'
  },
  // ── Universal Assistance: navy → azul oscuro ─────────────
  "universal assistance": {
    barFrom: "#002447", barTo: "#004d8f",
    labelColor: "#002447",
    priceBg: "rgba(0,36,71,0.05)", priceBorder: "rgba(0,36,71,0.18)",
    dotColor: "#004d8f",
    btnBg: "linear-gradient(to right,#002447,#004d8f)", btnText: "#ffffff",
    logo: '/universallogo.png'
  },
  // ── New Travel Assistance: azul petróleo → aqua ──────────
  "new travel assistance": {
    barFrom: "#016b91", barTo: "#5bbec2",
    labelColor: "#015a79",
    priceBg: "rgba(1,107,145,0.06)", priceBorder: "rgba(1,107,145,0.18)",
    dotColor: "#016b91",
    btnBg: "linear-gradient(to right,#016b91,#5bbec2)", btnText: "#ffffff",
    logo: '/newtravellogo.png'
  },
}

// Alias de normalización → clave canónica del mapa
const COMPANY_ALIASES: Record<string, string> = {
  // Pax
  "pax": "pax assistance",
  "pax assist": "pax assistance",
  // Cardinal
  "cardinal": "cardinal assistance",
  "cardinal assist": "cardinal assistance",
  // Go
  "go": "go assistance",
  "goassistance": "go assistance",
  "go-assistance": "go assistance",
  // Inter Assist
  "inter": "inter assist",
  "interassist": "inter assist",
  "inter-assist": "inter assist",
  // Terrawind (sin alias extra, ya cae por nombre directo)
  // Universal
  "universal": "universal assistance",
  // New Travel
  "new travel": "new travel assistance",
  "newtravel": "new travel assistance",
  "new travel assist": "new travel assistance",
  "new travel asistance": "new travel assistance",
  "newtravel assistance": "new travel assistance",
  "newtravelassist": "new travel assistance",
  // Otros (no son compañías del cliente pero los dejamos con fallback genérico)
  "assist card": "__generic_sky",
  "assistcard": "__generic_sky",
}

// Paleta genérica para compañías desconocidas (8 variantes)
const GENERIC_PALETTE: CompanyTheme[] = [
  { barFrom: "#0284c7", barTo: "#0369a1", labelColor: "#0369a1", priceBg: "rgba(2,132,199,0.06)", priceBorder: "rgba(2,132,199,0.18)", dotColor: "#0284c7", btnBg: "linear-gradient(to right,#0284c7,#0369a1)", btnText: "#ffffff", logo: "" },
  { barFrom: "#7c3aed", barTo: "#6d28d9", labelColor: "#6d28d9", priceBg: "rgba(124,58,237,0.06)", priceBorder: "rgba(124,58,237,0.18)", dotColor: "#7c3aed", btnBg: "linear-gradient(to right,#7c3aed,#6d28d9)", btnText: "#ffffff", logo: "" },
  { barFrom: "#d97706", barTo: "#b45309", labelColor: "#92400e", priceBg: "rgba(217,119,6,0.06)", priceBorder: "rgba(217,119,6,0.18)", dotColor: "#d97706", btnBg: "linear-gradient(to right,#d97706,#b45309)", btnText: "#ffffff", logo: "" },
  { barFrom: "#e11d48", barTo: "#be123c", labelColor: "#9f1239", priceBg: "rgba(225,29,72,0.06)", priceBorder: "rgba(225,29,72,0.18)", dotColor: "#e11d48", btnBg: "linear-gradient(to right,#e11d48,#be123c)", btnText: "#ffffff", logo: "" },
  { barFrom: "#16a34a", barTo: "#15803d", labelColor: "#14532d", priceBg: "rgba(22,163,74,0.06)", priceBorder: "rgba(22,163,74,0.18)", dotColor: "#16a34a", btnBg: "linear-gradient(to right,#16a34a,#15803d)", btnText: "#ffffff", logo: "" },
  { barFrom: "#0891b2", barTo: "#0e7490", labelColor: "#155e75", priceBg: "rgba(8,145,178,0.06)", priceBorder: "rgba(8,145,178,0.18)", dotColor: "#0891b2", btnBg: "linear-gradient(to right,#0891b2,#0e7490)", btnText: "#ffffff", logo: "" },
  { barFrom: "#4f46e5", barTo: "#4338ca", labelColor: "#3730a3", priceBg: "rgba(79,70,229,0.06)", priceBorder: "rgba(79,70,229,0.18)", dotColor: "#4f46e5", btnBg: "linear-gradient(to right,#4f46e5,#4338ca)", btnText: "#ffffff", logo: "" },
  { barFrom: "#0d9488", barTo: "#059669", labelColor: "#0d7a6a", priceBg: "rgba(13,148,136,0.06)", priceBorder: "rgba(13,148,136,0.18)", dotColor: "#0d9488", btnBg: "linear-gradient(to right,#0d9488,#059669)", btnText: "#ffffff", logo: "" },
]

// Mantener PALETTE exportada para compatibilidad con plan-comparison-view
export const PALETTE = GENERIC_PALETTE

export function getCompanyTheme(company: string): CompanyTheme {
  const key = company.toLowerCase().trim()

  // Buscar nombre exacto en el mapa de temas oficiales
  if (key in COMPANY_THEMES) return COMPANY_THEMES[key]

  // Resolver alias → nombre canónico → tema oficial
  const canonical = COMPANY_ALIASES[key]
  if (canonical && canonical in COMPANY_THEMES) return COMPANY_THEMES[canonical]

  // Fallback determinístico para compañías no mapeadas: hash → paleta genérica
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  }
  return GENERIC_PALETTE[Math.abs(hash) % GENERIC_PALETTE.length]
}

function InfoPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      {label}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export function QuotationResults({ data, backendResponse, onBack, onSelectPlan, onCompare }: QuotationResultsProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "coverage-asc" | "coverage-desc">("price-asc")
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())

  const desde = new Date(data.desde)
  const hasta = new Date(data.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const allPlans = generatePlansFromBackend(backendResponse, days) || generatePlans(data)
  
  // Obtener lista única de compañías
  const availableCompanies = Array.from(new Set(allPlans.map((p) => p.empresaCotizacion))).sort()

  // Filtrar por compañía
  const filteredByCompany = selectedCompanies.size > 0
    ? allPlans.filter((p) => selectedCompanies.has(p.empresaCotizacion))
    : allPlans

  // Ordenar planes
  const sortedPlans = [...filteredByCompany].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price
    if (sortBy === "price-desc") return b.price - a.price
    if (sortBy === "coverage-asc") {
      return parseCoverageAmount(a.maxCoverage) - parseCoverageAmount(b.maxCoverage)
    }
    if (sortBy === "coverage-desc") {
      return parseCoverageAmount(b.maxCoverage) - parseCoverageAmount(a.maxCoverage)
    }
    return 0
  })

  const plans = sortedPlans
  const totalPlans = plans.length

  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDialogOpen(true)
  }

  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="flex flex-col gap-6">

      {/* ── Barra superior: volver + título ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Volver al formulario"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {totalPlans > 0 ? `${totalPlans} planes disponibles` : "Planes disponibles"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {sortBy === "price-asc" && "Ordenados por menor precio"}
            {sortBy === "price-desc" && "Ordenados por mayor precio"}
            {sortBy === "coverage-asc" && "Ordenados por menor cobertura"}
            {sortBy === "coverage-desc" && "Ordenados por mayor cobertura"}
          </p>
        </div>
        {onCompare && sortedPlans.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompare(sortedPlans)}
            className="shrink-0 gap-1.5"
          >
            <GitCompareArrows className="h-4 w-4" />
            Comparar planes
          </Button>
        )}
      </div>

      {/* ── Strip de info del viaje ── */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap gap-2">
        <InfoPill icon={MapPin} label={destinationLabels[data.destino] || data.destino} />
        <InfoPill
          icon={CalendarDays}
          label={`${formatDateDisplay(desde)} → ${formatDateDisplay(hasta)}`}
        />
        <InfoPill icon={Clock} label={`${days} día${days > 1 ? "s" : ""}`} />
        <InfoPill
          icon={Users}
          label={`${data.edades.length} pasajero${data.edades.length > 1 ? "s" : ""} (${data.edades.join(", ")} años)`}
        />
        {data.tipoViaje && (
          <InfoPill icon={Star} label={tripTypeLabels[data.tipoViaje] || data.tipoViaje} />
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
          </div>
          {(sortBy !== "price-asc" || selectedCompanies.size > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortBy("price-asc")
                setSelectedCompanies(new Set())
              }}
              className="h-7 gap-1.5 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Filtro de ordenamiento */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Menor precio</SelectItem>
                <SelectItem value="price-desc">Mayor precio</SelectItem>
                <SelectItem value="coverage-asc">Menor cobertura</SelectItem>
                <SelectItem value="coverage-desc">Mayor cobertura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de compañía */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Filtrar por compañía</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {selectedCompanies.size === 0
                    ? "Todas las compañías"
                    : `${selectedCompanies.size} compañía${selectedCompanies.size > 1 ? "s" : ""} seleccionada${selectedCompanies.size > 1 ? "s" : ""}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b">
                    <span className="text-xs font-semibold text-foreground">Compañías</span>
                    {selectedCompanies.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCompanies(new Set())}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {availableCompanies.map((company) => {
                      const isSelected = selectedCompanies.has(company)
                      return (
                        <label
                          key={company}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedCompanies((prev) => {
                                const next = new Set(prev)
                                if (checked) {
                                  next.add(company)
                                } else {
                                  next.delete(company)
                                }
                                return next
                              })
                            }}
                          />
                          <span className="flex-1">{company}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Badges de compañías seleccionadas */}
        {selectedCompanies.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Compañías seleccionadas:</span>
            {Array.from(selectedCompanies).map((company) => (
              <Badge
                key={company}
                variant="secondary"
                className="gap-1.5 pr-1.5"
              >
                {company}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompanies((prev) => {
                      const next = new Set(prev)
                      next.delete(company)
                      return next
                    })
                  }}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelectedCompanies(new Set())}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* Contador de resultados */}
        {selectedCompanies.size > 0 && (
          <p className="text-xs text-muted-foreground pt-1 border-t">
            Mostrando {totalPlans} de {allPlans.length} planes
          </p>
        )}
      </div>

      {/* ── Tarjetas de planes ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => {
          const theme = getCompanyTheme(plan.empresaCotizacion)
          const visibleBenefits = plan.coverage.slice(0, 3)
          const extraCount = plan.coverage.length - 3

          return (
            <div
              key={plan.id}
              className="group relative flex flex-col rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}
            >
              {/* Barra de color — identificador principal de la compañía */}
              <div
                className="h-1"
                style={{ background: `linear-gradient(to right, ${theme.barFrom}, ${theme.barTo})` }}
              />

              {/* Cabecera: zona levemente tintada con el color de la compañía */}
              <div
                className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-border/40"
                style={{ backgroundColor: theme.priceBg }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.dotColor }}
                  />
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest truncate"
                    style={{ color: theme.labelColor }}
                  >
                    {plan.empresaCotizacion}
                  </p>
                </div>
                {theme.logo && (
                  <img
                    src={theme.logo}
                    alt={plan.empresaCotizacion}
                    className="h-5 w-auto max-w-[76px] object-contain shrink-0 opacity-75 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                )}
              </div>

              {/* Nombre del plan */}
              <div className="px-4 pt-3.5 pb-4">
                <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">
                  {plan.name}
                </h3>
              </div>

              {/* Bloque de precio — neutro con acento izquierdo de la compañía */}
              <div
                className="mx-4 mb-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 overflow-hidden relative"
                style={{ borderLeftColor: theme.dotColor, borderLeftWidth: "3px" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Precio total
                </p>
                <span className="text-[26px] font-black leading-none text-foreground">
                  USD {formatNumber(plan.price)}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cobertura máx.{" "}
                  <span className="font-semibold text-foreground/80">{plan.maxCoverage}</span>
                </p>
              </div>

              {/* Divisor con etiqueta */}
              <div className="flex items-center gap-2 px-4 mb-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Prestaciones
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Lista de prestaciones — 3 ítems fijos */}
              <ul className="flex flex-col gap-2 px-4 pb-3 flex-1">
                {visibleBenefits.map((item, index) => (
                  <li
                    key={`${plan.id}-cov-${index}`}
                    className="flex items-start gap-2.5"
                  >
                    {/* Checkmark con dotColor — único uso de color en el cuerpo */}
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      style={{ color: theme.dotColor }}
                    />
                    <span className="text-[13px] text-foreground/80 leading-snug line-clamp-2">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Chip neutro de prestaciones extra */}
              {extraCount > 0 ? (
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(plan)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="text-[10px] font-bold">+{extraCount}</span>
                    prestación{extraCount > 1 ? "es" : ""} más
                  </button>
                </div>
              ) : (
                <div className="pb-4" />
              )}

              {/* Acciones — botones neutros y consistentes */}
              <div className="flex flex-col gap-2 px-4 pb-4 mt-auto">
                <button
                  type="button"
                  onClick={() => handleViewDetails(plan)}
                  className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl border border-border text-[13px] font-medium text-muted-foreground bg-background hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver detalle
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan)}
                  className="flex items-center justify-center w-full h-10 rounded-xl bg-foreground text-background text-[13px] font-bold tracking-wide hover:bg-foreground/90 active:scale-[0.98] transition-all"
                >
                  Seleccionar plan
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal de detalles ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          hideClose
          className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card"
        >
          {selectedPlan && (() => {
            const modalTheme = getCompanyTheme(selectedPlan.empresaCotizacion)
            return (
            <>
              {/* Accessibility */}
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedPlan.name} — {selectedPlan.empresaCotizacion}</DialogTitle>
                <DialogDescription>
                  Detalle completo del plan {selectedPlan.name} de {selectedPlan.empresaCotizacion}
                </DialogDescription>
              </DialogHeader>

              {/* ── Barra de color (igual que la carta) ── */}
              <div
                className="h-1 shrink-0"
                style={{ background: `linear-gradient(to right, ${modalTheme.barFrom}, ${modalTheme.barTo})` }}
              />

              {/* ── Cabecera tintada (igual que la carta) ── */}
              <div
                className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border/40 shrink-0"
                style={{ backgroundColor: modalTheme.priceBg }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: modalTheme.dotColor }}
                  />
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest truncate"
                    style={{ color: modalTheme.labelColor }}
                  >
                    {selectedPlan.empresaCotizacion}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(modalTheme.logo || selectedPlan.imagen) && (
                    <img
                      src={modalTheme.logo || selectedPlan.imagen}
                      alt={selectedPlan.empresaCotizacion}
                      className="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[140px] object-contain opacity-90"
                      onError={(e) => { e.currentTarget.style.display = "none" }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Nombre del plan ── */}
              <div className="px-5 pt-4 pb-3 shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                  {selectedPlan.name}
                </h2>
              </div>

              {/* ── Cuerpo scrolleable ── */}
              <div className="overflow-y-auto max-h-[60dvh] sm:max-h-[55dvh]">
                <div className="px-5 pb-5 space-y-5">

                  {/* Bloque de precio (igual que la carta) */}
                  <div
                    className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
                    style={{ borderLeftColor: modalTheme.dotColor, borderLeftWidth: "3px" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                      Precio total
                    </p>
                    <span className="text-[28px] sm:text-[32px] font-black leading-none text-foreground">
                      USD {formatNumber(selectedPlan.price)}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
                      <p className="text-[11px] text-muted-foreground">
                        Cobertura máx.{" "}
                        <span className="font-semibold text-foreground/80">{selectedPlan.maxCoverage}</span>
                      </p>
                      {days > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          USD {formatNumber(selectedPlan.pricePerDay)} / día
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divisor con etiqueta "Prestaciones" (igual que la carta) */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Prestaciones ({selectedPlan.coverage.length})
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  {/* Lista de prestaciones (mismo checkmark que la carta) */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
                    {selectedPlan.coverage.map((item, index) => (
                      <li
                        key={`detail-${selectedPlan.id}-cov-${index}`}
                        className="flex items-start gap-2.5"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: modalTheme.dotColor }}
                        />
                        <span className="text-[13px] text-foreground/80 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Divisor con etiqueta "Detalles del viaje" */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Detalles del viaje
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  {/* Info del viaje */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { icon: MapPin,      label: "Destino",    value: destinationLabels[data.destino] || data.destino },
                      { icon: Clock,       label: "Duración",   value: `${days} día${days > 1 ? "s" : ""}` },
                      { icon: Users,       label: "Pasajeros",  value: `${data.edades.length} pasajero${data.edades.length > 1 ? "s" : ""}` },
                      { icon: CalendarDays,label: "Edades",     value: `${data.edades.join(", ")} años` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                            {label}
                          </p>
                          <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Footer (mismo estilo de botones que la carta) ── */}
              <div className="flex gap-2 px-5 py-4 border-t border-border bg-card shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-border text-[13px] font-medium text-muted-foreground bg-background hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false)
                    if (selectedPlan) onSelectPlan?.(selectedPlan)
                  }}
                  className="flex-[2] h-10 rounded-xl bg-foreground text-background text-[13px] font-bold tracking-wide hover:bg-foreground/90 active:scale-[0.98] transition-all"
                >
                  Seleccionar este plan
                </button>
              </div>
            </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
