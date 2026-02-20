"use client"

import { Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import type { QuotationData } from "@/components/quotation-form"

type Plan = {
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

// Función para formatear números con separadores de miles
function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

// Función para generar planes desde la respuesta del backend
function generatePlansFromBackend(
  backendResponse: any,
  days: number
): Plan[] | null {
  if (!backendResponse || !backendResponse.cotizaciones) return null

  const plans: Plan[] = []
  const cotizaciones = backendResponse.cotizaciones

  // Iterar sobre todas las compañías
  Object.keys(cotizaciones).forEach((empresa) => {
    const cotizacionesEmpresa = cotizaciones[empresa]

    if (Array.isArray(cotizacionesEmpresa)) {
      cotizacionesEmpresa.forEach((cotizacion: any) => {
        // Extraer prestaciones principales (primeras 5-6 más relevantes)
        const prestaciones = Array.isArray(cotizacion.prestaciones)
          ? cotizacion.prestaciones
          : []
        
        const coverageRaw = prestaciones
          .slice(0, 6)
          .map((p: any) => {
            // Si p es un string, usarlo directamente
            if (typeof p === "string") return p
            // Si es un objeto, buscar nombre o descripción
            return p?.nombre || p?.descripcion || "Prestación incluida"
          })
          .filter((c: string) => c && c.trim() !== "")

        // Eliminar duplicados manteniendo el orden
        const coverage = Array.from(new Set(coverageRaw))

        // Si no hay prestaciones, usar valores por defecto
        if (coverage.length === 0) {
          coverage.push("Asistencia médica")
          coverage.push("Asistencia telefónica 24/7")
        }

        const plan: Plan = {
          id: cotizacion.id || `${empresa}-${Math.random()}`,
          name: `${cotizacion.plan || "Plan"}`,
          price: cotizacion.totalUsd || cotizacion.tarifaApi || 0,
          pricePerDay: days > 0
            ? Math.round((cotizacion.totalUsd || cotizacion.tarifaApi || 0) / days)
            : cotizacion.totalUsd || cotizacion.tarifaApi || 0,
          badge: null, // Se puede agregar lógica para marcar como "Recomendado"
          coverage,
          maxCoverage: `USD ${formatNumber(cotizacion.montoCobertura || 0)}`,
          empresaCotizacion: cotizacion.empresaCotizacion || empresa,
          imagen: cotizacion.imagen,
          tarifaTotalUnPago: cotizacion.tarifaTotalUnPago || 0,
          tarifaNeta: cotizacion.tarifaNeta || 0,
          totalUsd: cotizacion.totalUsd || cotizacion.tarifaApi || 0,
        }

        plans.push(plan)
      })
    }
  })

  // Ordenar por precio (más barato primero)
  plans.sort((a, b) => a.price - b.price)

  // Marcar el segundo más barato como "Recomendado" (si hay al menos 2 planes)
  if (plans.length >= 2) {
    plans[1].badge = "Recomendado"
  }

  return plans.length > 0 ? plans : null
}

function generatePlans(data: QuotationData): Plan[] {
  // Calcular días desde las fechas en formato string
  const desde = new Date(data.desde)
  const hasta = new Date(data.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 7

  const passengerCount = data.edades.length
  const baseMultiplier =
    data.destino === "1001" || data.destino === "1004" // Europa o Norteamérica
      ? 1.5
      : data.destino === "1003" // Resto del Mundo
        ? 1.3
        : 1

  // Convertir edades a números para el cálculo
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
        "Asistencia medica hasta USD 30.000",
        "Equipaje hasta USD 800",
        "Cancelacion de viaje",
        "Asistencia telefonica 24/7",
      ],
    },
    {
      id: "plus",
      name: "Plan Plus",
      price: Math.round(base * 4.2),
      pricePerDay: Math.round((base * 4.2) / days),
      badge: "Recomendado",
      maxCoverage: "USD 60.000",
      coverage: [
        "Asistencia medica hasta USD 60.000",
        "Equipaje hasta USD 1.500",
        "Cancelacion de viaje",
        "Deportes y actividades de aventura",
        "Asistencia telefonica 24/7",
        "Cobertura COVID-19",
      ],
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: Math.round(base * 6.8),
      pricePerDay: Math.round((base * 6.8) / days),
      badge: null,
      maxCoverage: "USD 150.000",
      coverage: [
        "Asistencia medica hasta USD 150.000",
        "Equipaje hasta USD 2.500",
        "Cancelacion de viaje completa",
        "Deportes y aventura extrema",
        "Asistencia telefonica 24/7",
        "Cobertura COVID-19",
        "Preexistencias hasta USD 10.000",
        "Repatriacion sanitaria",
      ],
    },
  ]
}

export function QuotationResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-px w-full" />
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

type QuotationResultsProps = {
  data: QuotationData
  backendResponse?: any | null
  onBack: () => void
}

const destinationLabels: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

export function QuotationResults({ data, backendResponse, onBack }: QuotationResultsProps) {
  // Calcular días del viaje
  const desde = new Date(data.desde)
  const hasta = new Date(data.hasta)
  const days = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) || 1

  // Generar planes desde la respuesta del backend o usar simulados como fallback
  const plans =
    generatePlansFromBackend(backendResponse, days) || generatePlans(data)

  // Contar total de planes disponibles
  const totalPlans = plans.length

  return (
    <div className="flex flex-col gap-6">
      {/* Summary bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="bg-transparent" aria-label="Volver al formulario">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {totalPlans > 0 ? `${totalPlans} planes disponibles` : "Planes disponibles"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {destinationLabels[data.destino] || data.destino} &middot;{" "}
              {data.edades.length} pasajero{data.edades.length > 1 ? "s" : ""} &middot;{" "}
              {days} día{days > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col border-border transition-shadow hover:shadow-md ${
              plan.badge ? "ring-2 ring-primary" : ""
            }`}
          >
            {plan.badge && (
              <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground">
                {plan.badge}
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.empresaCotizacion.toUpperCase()}
                  </p>
                </div>
                {plan.imagen && (
                  <img
                    src={plan.imagen}
                    alt={plan.empresaCotizacion}
                    className="h-8 w-auto object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cobertura máxima: {plan.maxCoverage}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div>
                <span className="text-3xl font-bold text-foreground">
                  USD {formatNumber(plan.price)}
                </span>
                <span className="text-sm text-muted-foreground"> total</span>
                {days > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    USD {formatNumber(plan.pricePerDay)} / día por persona
                  </p>
                )}
              </div>
              <Separator />
              <ul className="flex flex-col gap-2">
                {plan.coverage.map((item, index) => (
                  <li key={`${plan.id}-coverage-${index}-${item}`} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                variant={plan.badge ? "default" : "outline"}
              >
                Seleccionar plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
