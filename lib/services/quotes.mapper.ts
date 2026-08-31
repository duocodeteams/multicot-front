/**
 * Funciones helper para mapear datos del formulario al formato de la API
 */

import type { QuotationData } from "@/components/quotation-form"
import type { CreateQuoteRequest, DaysRange, DestinationId, TripType } from "./types"

/**
 * Mapea el destino del formulario al destination_id de la API
 */
export function mapDestinationToId(destino: string): DestinationId {
  const mapping: Record<string, DestinationId> = {
    "1002": 1, // Nacional
    "1000": 2, // Latinoamérica
    "1001": 3, // Europa
    "1003": 4, // Resto del Mundo
    "1004": 5, // Norteamérica
  }
  
  const mapped = mapping[destino]
  if (!mapped) {
    throw new Error(`Destino inválido: ${destino}`)
  }
  
  return mapped
}

/**
 * Mapea el tipo de viaje del formulario al trip_type de la API
 */
export function mapTripTypeToApi(tipoViaje: string): TripType {
  // Si es un viaje único
  if (tipoViaje === "ONE_TRIP") {
    return "unico_viaje"
  }
  
  // Si es multiviaje (cualquier variante)
  if (tipoViaje.startsWith("MULTI_TRIP")) {
    return "multiviaje"
  }
  
  // Por defecto, asumimos viaje único
  return "unico_viaje"
}

/**
 * Extrae days_range (30 | 60 | 90) de MULTI_TRIP30 / MULTI_TRIP60 / MULTI_TRIP90.
 */
export function mapDaysRange(tipoViaje: string): DaysRange | undefined {
  const match = tipoViaje.match(/^MULTI_TRIP(30|60|90)$/)
  if (!match) return undefined
  return Number(match[1]) as DaysRange
}

/**
 * Convierte los datos del formulario al formato requerido por la API
 */
export function mapQuotationDataToApi(data: QuotationData): CreateQuoteRequest {
  const trip_type = mapTripTypeToApi(data.tipoViaje)
  const request: CreateQuoteRequest = {
    departure_date: data.desde,
    return_date: data.hasta,
    ages: data.edades.map(age => parseInt(age, 10)),
    origin: data.origen,
    destination_id: mapDestinationToId(data.destino),
    trip_type,
  }

  if (trip_type === "multiviaje") {
    const days_range = mapDaysRange(data.tipoViaje)
    if (days_range) request.days_range = days_range
  }

  return request
}

/**
 * Mapea el nombre/slug de compañía del back a un nombre comercial legible.
 */
export function mapCompanyToFormalCompany(company: string): string {
  const mapping: Record<string, string> = {
    cardinal: "Cardinal Assistance",
    cardinalassistance: "Cardinal Assistance",
    goassistance: "GO! Assistance",
    go: "GO! Assistance",
    newtravel: "New Travel Assistance",
    newtravelassistance: "New Travel Assistance",
    terrawind: "Terrawind Global Protection",
    terrawindglobalprotection: "Terrawind Global Protection",
    universal: "Universal Assistance",
    universalassistance: "Universal Assistance",
    pax: "PAX Assistance",
    paxassistance: "PAX Assistance",
    interassist: "InterAssist",
    inter: "InterAssist",
    interassistance: "InterAssist",
    omint: "Omint",
    omintassistance: "Omint",
    omintassist: "Omint",
  }

  const key = company
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

  return mapping[key] || company
}
