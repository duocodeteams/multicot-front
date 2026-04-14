/**
 * Funciones helper para mapear datos del formulario al formato de la API
 */

import type { QuotationData } from "@/components/quotation-form"
import type { CreateQuoteRequest, DestinationId, TripType } from "./types"

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
 * Convierte los datos del formulario al formato requerido por la API
 */
export function mapQuotationDataToApi(data: QuotationData): CreateQuoteRequest {
  return {
    departure_date: data.desde,
    return_date: data.hasta,
    ages: data.edades.map(age => parseInt(age, 10)),
    origin: data.origen,
    destination_id: mapDestinationToId(data.destino),
    trip_type: mapTripTypeToApi(data.tipoViaje),
  }
}

/** * Mapea la compañia del back y la convierte a un formato legible para el frontend
 */
export function mapCompanyToFormalCompany (company: string): string {
  const mapping: Record<string, string> = {
    "Cardinal": "Cardinal Assistance",
    "GoAssistance": "GO! Assistance",
    "New Travel": "New Travel Assistance",
    "Terrawind": "Terrawind Global Protection",
    "Universal": "Universal Assistance",
  }

  return mapping[company] || company
}
