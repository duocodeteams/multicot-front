"use client"

import { Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import type { QuotationData } from "@/components/quotation-form"

type Plan = {
  id: string
  name: string
  price: number
  pricePerDay: number
  badge: string | null
  coverage: string[]
  maxCoverage: string
}

function generatePlans(data: QuotationData): Plan[] {
  const days =
    data.startDate && data.endDate
      ? Math.ceil(
          (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 7

  const passengerCount = data.passengers.length
  const baseMultiplier =
    data.destination === "europa" || data.destination === "norteamerica"
      ? 1.5
      : data.destination === "asia" || data.destination === "oceania"
        ? 1.3
        : 1

  const ageMultiplier = data.passengers.some((a) => a > 65) ? 1.4 : 1

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
  onBack: () => void
}

export function QuotationResults({ data, onBack }: QuotationResultsProps) {
  const plans = generatePlans(data)

  const destinationLabels: Record<string, string> = {
    europa: "Europa",
    norteamerica: "Norteamerica",
    centroamerica: "Centroamerica y Caribe",
    sudamerica: "Sudamerica",
    asia: "Asia",
    africa: "Africa",
    oceania: "Oceania",
    mundial: "Cobertura Mundial",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="bg-transparent" aria-label="Volver al formulario">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Planes disponibles</h3>
            <p className="text-sm text-muted-foreground">
              {destinationLabels[data.destination] || data.destination} &middot;{" "}
              {data.passengers.length} pasajero{data.passengers.length > 1 ? "s" : ""}
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
              <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Cobertura maxima: {plan.maxCoverage}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div>
                <span className="text-3xl font-bold text-foreground">
                  {"USD "}
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground"> total</span>
                <p className="text-xs text-muted-foreground">
                  {"USD "}
                  {plan.pricePerDay} / dia por persona
                </p>
              </div>
              <Separator />
              <ul className="flex flex-col gap-2">
                {plan.coverage.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
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
