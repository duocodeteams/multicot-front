/**
 * Servicio de Cotizaciones
 * Endpoints relacionados con la creación y gestión de cotizaciones
 */

import { apiClient } from "../api"
import type { CreateQuoteRequest, CreateQuoteResponse } from "./types"

/**
 * Crear Cotización
 * Obtiene cotizaciones de todas las compañías disponibles
 */
export async function createQuote(data: CreateQuoteRequest): Promise<CreateQuoteResponse> {
  const response = await apiClient.post<CreateQuoteResponse>("/v1/quotes", data)
  return response.data
}
