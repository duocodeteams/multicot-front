"use client"

import React, { useState } from "react"
import { CalendarIcon, Plus, Trash2, ArrowRight } from "lucide-react"
import { format, startOfDay, isBefore, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
]//para que no queden iguales

const tripTypes = [
  { value: "ONE_TRIP", label: "Un viaje" },
  { value: "MULTI_TRIP30", label: "Multi 30 días" },
  { value: "MULTI_TRIP60", label: "Multi 60 días" },
  { value: "MULTI_TRIP90", label: "Multi 90 días" },
]
//aca tambien
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

export function QuotationForm({ onSubmit, isLoading }: QuotationFormProps) {
  const [destino, setDestino] = useState("")
  const [tipoViaje, setTipoViaje] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [tempRange, setTempRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [passengers, setPassengers] = useState<number[]>([30])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addPassenger = () => {
    if (passengers.length < 10) {
      setPassengers([...passengers, 30])
    }
  }

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index))
    }
  }

  const updatePassengerAge = (index: number, age: string) => {
    const numAge = parseInt(age, 10)
    if (!isNaN(numAge) && numAge >= 0 && numAge <= 120) {
      const updated = [...passengers]
      updated[index] = numAge
      setPassengers(updated)
    }
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
      // Al abrir, inicializar el temp con el rango confirmado
      setTempRange(dateRange)
    }
    setCalendarOpen(open)
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
    if (passengers.some((age) => age < 0 || age > 120)) {
      newErrors.passengers = "Las edades deben estar entre 0 y 120"
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
      onSubmit({
        destino,
        tipoViaje,
        desde: formatDate(dateRange.from),
        hasta: formatDate(dateRange.to),
        edades: passengers.map((age) => String(age)),
        origen: "AR",
      })
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Nueva Cotizacion</CardTitle>
        <CardDescription>
          Complete los datos del viaje para obtener las mejores opciones de asistencia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Destination and Trip Type */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="destino" className="text-foreground">Destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger id="destino" className="bg-background cursor-pointer">
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
              <Label htmlFor="tipoViaje" className="text-foreground">Tipo de viaje</Label>
              <Select value={tipoViaje} onValueChange={setTipoViaje}>
                <SelectTrigger id="tipoViaje" className="bg-background cursor-pointer">
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

          {/* Date Range Picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Fechas del viaje</Label>
            <Popover open={calendarOpen} onOpenChange={handleOpenCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start bg-background text-left font-normal transition-colors hover:bg-accent hover:text-accent-foreground hover:border-input/80",
                    !dateRange?.from && "text-muted-foreground"
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
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                {/* Calendario */}
                <div className="p-3">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={tempRange}
                    onSelect={setTempRange}
                    disabled={(date) => {
                      const today = startOfDay(new Date())
                      const compareDate = startOfDay(date instanceof Date ? date : new Date(date))
                      return isBefore(compareDate, today)
                    }}
                    initialFocus
                    className="p-0"
                  />
                </div>

                {/* Barra de info DESDE → HASTA */}
                <div className="border-t px-5 py-3 text-sm text-center text-foreground">
                  <span className="font-bold tracking-wide">DESDE:</span>{" "}
                  <span className="font-semibold">
                    {tempRange?.from
                      ? format(tempRange.from, "d MMM yyyy", { locale: es })
                      : "—"}
                  </span>
                  <ArrowRight className="inline mx-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-bold tracking-wide">HASTA:</span>{" "}
                  <span className="font-semibold">
                    {tempRange?.to
                      ? format(tempRange.to, "d MMM yyyy", { locale: es })
                      : "—"}
                  </span>
                </div>

                {/* Footer con total y acciones */}
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
                      className="text-sm underline text-foreground hover:text-muted-foreground transition-colors"
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
              </PopoverContent>
            </Popover>
            {errors.dates && (
              <p className="text-xs text-destructive">{errors.dates}</p>
            )}
          </div>

          {/* Passengers */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Pasajeros (edades)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPassenger}
                disabled={passengers.length >= 10}
                className="bg-transparent"
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {passengers.map((age, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => updatePassengerAge(index, e.target.value)}
                    className="bg-background cursor-text"
                    aria-label={`Edad pasajero ${index + 1}`}
                  />
                  {passengers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePassenger(index)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Eliminar pasajero ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.passengers && (
              <p className="text-xs text-destructive">{errors.passengers}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full md:w-auto md:self-end" disabled={isLoading}>
            {isLoading ? "Cotizando..." : "Cotizar asistencia"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
