/**
 * Tipos propios del flujo Inter Assist.
 * Convive con Omint; no depende de omint-types.
 */

import type { Sale, SaleCompanySlug } from "@/lib/issuance/sales-types"

export type InterAssistTripType = "unico_viaje" | "multiviaje" | "larga_estadia"

export type InterAssistQuoteSnapshot = {
  departure_date: string
  return_date?: string | null
  ages: number[]
  origin: string
  destination_id: number
  trip_type: InterAssistTripType
  days_range?: number | null
  amount: string | number
  currency: string
  plan_name: string
  promocion_id: number
  markup: string | number
  net_amount?: string | number | null
  base_amount?: string | number | null
}

export type CreateInterAssistSaleRequest = {
  company: Extract<SaleCompanySlug, "inter_assist">
  /** plan_id numérico de la cotización */
  quote_id: string
  quote: InterAssistQuoteSnapshot
}

export type SimulatePaymentResult = "pending" | "approved" | "rejected"

export type SimulatePaymentRequest = {
  result: SimulatePaymentResult
}

export type InterAssistSale = Sale

export const INTER_ASSIST_SALE_SESSION_KEY = "inter_assist_active_sale"
export const INTER_ASSIST_SALE_CONTEXT_KEY = "inter_assist_sale_context"
