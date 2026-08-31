"use client"

import React, { useState, useEffect } from "react"
import { CalendarIcon, Plus, Trash2, ArrowRight, Plane, Users, Globe } from "lucide-react"
import { format, startOfDay, isBefore, differenceInDays, addDays } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const destinations = [
  { value: "1001", label: "Europa" },
  { value: "1004", label: "Norteamérica" },
  { value: "1000", label: "Latinoamérica" },
  { value: "1003", label: "Resto del Mundo" },
  { value: "1002", label: "Nacional" },
]

const tripTypes = [
  { value: "ONE_TRIP", label: "Un viaje" },
  { value: "MULTI_TRIP30", label: "Multi 30 días" },
  { value: "MULTI_TRIP60", label: "Multi 60 días" },
  { value: "MULTI_TRIP90", label: "Multi 90 días" },
]

export type QuotationData = {
  destino: string
  tipoViaje: string
  desde: string
  hasta: string
  edades: string[]
  origen: string
}

type QuotationFormProps = {
  onSubmit: (data: QuotationData) => void
  isLoading: boolean
}

function SectionNumber({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
      {n}
    </span>
  )
}

export function QuotationForm({ onSubmit, isLoading }: QuotationFormProps) {
  const [destino, setDestino] = useState("")
  const [tipoViaje, setTipoViaje] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [tempRange, setTempRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
const [passengers, setPassengers] = useState<string[]>(["30"])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isMultiTrip = tipoViaje.startsWith("MULTI_TRIP")

const addPassenger = () => {
  if (passengers.length < 10) {
    setPassengers([...passengers, "30"])
  }
}

const removePassenger = (index: number) => {
  if (passengers.length > 1) {
    setPassengers(passengers.filter((_, i) => i !== index))
  }
}

const updatePassengerAge = (index: number, age: string) => {
  const updated = [...passengers]
  updated[index] = age
  setPassengers(updated)
}

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const totalDays =
    tempRange?.from && tempRange?.to
      ? differenceInDays(tempRange.to, tempRange.from) + 1
      : null

  const handleOpenCalendar = (open: boolean) => {
    if (open) {
      setTempRange(dateRange)
    }
    setCalendarOpen(open)
  }

  const handleTripTypeChange = (value: string) => {
    setTipoViaje(value)
    // Cada cambio de tipo de viaje invalida fechas previas.
    setDateRange(undefined)
    setTempRange(undefined)
    setErrors((e) => ({ ...e, tipoViaje: "", dates: "" }))
  }

  const handleSelectRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      setTempRange(undefined)
      return
    }

    if (isMultiTrip) {
      // 365 días inclusive: p. ej. 01/09/2026 → 31/08/2027
      setTempRange({
        from: range.from,
        to: addDays(range.from, 364),
      })
      return
    }

    setTempRange(range)
  }

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      setDateRange(tempRange)
    }
    setCalendarOpen(false)
  }

  const handleClear = () => {
    setTempRange(undefined)
    setDateRange(undefined)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!destino) newErrors.destino = "Seleccione un destino"
    if (!tipoViaje) newErrors.tipoViaje = "Seleccione el tipo de viaje"
    if (!dateRange?.from) newErrors.dates = "Seleccione fecha de inicio"
    else if (!dateRange?.to) newErrors.dates = "Seleccione fecha de fin"
    
    const ages = passengers.map(age => {
      const numAge = parseInt(age, 10)
      return isNaN(numAge) ? -1 : numAge
    })
    
    if (ages.some((age) => age < 0 || age > 99)) {
      newErrors.passengers = "Las edades deben estar entre 0 y 99 años"
    }
    if (passengers.length === 0) {
      newErrors.passengers = "Debe haber al menos un pasajero"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate() && dateRange?.from && dateRange?.to) {
      const ages = passengers.map(age => {
        const numAge = parseInt(age, 10)
        return isNaN(numAge) ? "0" : String(Math.max(0, Math.min(99, numAge)))
      })
      onSubmit({
        destino,
        tipoViaje,
        desde: formatDate(dateRange.from),
        hasta: formatDate(dateRange.to),
        edades: ages,
        origen: "AR",
      })
    }
  }


function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)")
    const listener = () => setIsMobile(media.matches)

    listener()
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [])

  return isMobile
}

// 👇 ACÁ SÍ lo usás
const isMobile = useIsMobile()

  return (
    <Card className="border-border overflow-hidden">
      {/* Barra de acento superior */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />

      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <div className="flex items-start gap-2.5 sm:items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Plane className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base text-foreground">Nueva Cotización</CardTitle>
            <CardDescription className="text-xs leading-tight">
              Complete los datos del viaje para obtener las mejores opciones de asistencia.
            </CardDescription>
          </div>
        </div>
      </CardHeader>


      <CardContent className="px-4 sm:px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Sección 1: Destino ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <SectionNumber n={1} />
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                Destino del viaje
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="destino" className="text-foreground text-xs font-medium">
                  Destino
                </Label>
                <Select value={destino} onValueChange={(v) => { setDestino(v); setErrors((e) => ({ ...e, destino: "" })) }}>
                  <SelectTrigger
                    id="destino"
                    className={cn(
                      "bg-background cursor-pointer",
                      errors.destino && "border-destructive focus:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Seleccione destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destino && (
                  <p className="text-xs text-destructive">{errors.destino}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipoViaje" className="text-foreground text-xs font-medium">
                  Tipo de viaje
                </Label>
                <Select value={tipoViaje} onValueChange={handleTripTypeChange}>
                  <SelectTrigger
                    id="tipoViaje"
                    className={cn(
                      "bg-background cursor-pointer",
                      errors.tipoViaje && "border-destructive focus:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoViaje && (
                  <p className="text-xs text-destructive">{errors.tipoViaje}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sección 2: Fechas ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <SectionNumber n={2} />
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                Fechas del viaje
              </h3>
              {dateRange?.from && dateRange?.to && (
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {differenceInDays(dateRange.to, dateRange.from) + 1} días
                </span>
              )}
            </div>
            {/* Botón trigger del calendario */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenCalendar(true)}
              className={cn(
                "w-full justify-start bg-background text-left font-normal transition-colors hover:bg-accent hover:text-accent-foreground hover:border-input/80",
                !dateRange?.from && "text-muted-foreground",
                errors.dates && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {dateRange?.from && dateRange?.to ? (
                <span>
                  {format(dateRange.from, "d MMM yyyy", { locale: es })}
                  <span className="mx-2 text-muted-foreground">→</span>
                  {format(dateRange.to, "d MMM yyyy", { locale: es })}
                </span>
              ) : (
                "Seleccione fechas del viaje"
              )}
            </Button>

            {/* Modal del calendario */}
            <Dialog open={calendarOpen} onOpenChange={(open) => handleOpenCalendar(!!open)}>
              <DialogContent className="w-auto max-w-fit gap-0 pt-8 px-0 pb-0">
                <div className="p-3">
                  <Calendar
                    mode="range"
                    numberOfMonths={isMobile ? 1 : 2}
                    selected={tempRange}
                    onSelect={handleSelectRange}
                    disabled={(date) => {
                      const today = startOfDay(new Date())
                      const compareDate = startOfDay(date instanceof Date ? date : new Date(date))
                      return isBefore(compareDate, today)
                    }}
                    initialFocus
                    className="p-0"
                  />
                </div>
                <div className="border-t px-5 py-3 text-sm text-center text-foreground bg-muted/30">
                  <span className="font-bold tracking-wide">DESDE:</span>{" "}
                  <span className="font-semibold">
                    {tempRange?.from ? format(tempRange.from, "d MMM yyyy", { locale: es }) : "—"}
                  </span>
                  <ArrowRight className="inline mx-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-bold tracking-wide">HASTA:</span>{" "}
                  <span className="font-semibold">
                    {tempRange?.to ? format(tempRange.to, "d MMM yyyy", { locale: es }) : "—"}
                  </span>
                </div>
                <div className="border-t px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    Total:{" "}
                    <strong>
                      {totalDays != null ? `${totalDays} día${totalDays !== 1 ? "s" : ""}.` : "—"}
                    </strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-sm underline text-foreground hover:text-muted-foreground transition-colors cursor-pointer"
                    >
                      Borrar
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-5"
                      onClick={handleApply}
                      disabled={!tempRange?.from || !tempRange?.to}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {errors.dates && (
              <p className="text-xs text-destructive">{errors.dates}</p>
            )}
          </div>

          {/* ── Sección 3: Pasajeros ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <SectionNumber n={3} />
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                Pasajeros
              </h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {passengers.length} / 10
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPassenger}
                disabled={passengers.length >= 10}
                className="h-7 px-2.5 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {passengers.map((age, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">
                    Pasajero {index + 1}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={age}
                      onChange={(e) => updatePassengerAge(index, e.target.value)}
                      className={cn(
                        "bg-background cursor-text",
                        errors.passengers && "border-destructive focus:border-destructive focus:ring-destructive"
                      )}
                      aria-label={`Edad pasajero ${index + 1}`}
                    />
                    {passengers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Eliminar pasajero ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.passengers && (
              <p className="text-xs text-destructive">{errors.passengers}</p>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col items-end gap-2 pt-3 border-t border-border/60 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Los precios se muestran en dólares (USD).
            </p>
            <Button type="submit" size="lg" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <span className="animate-pulse">Cotizando...</span>
                </>
              ) : (
                <>
                  Cotizar asistencia
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
