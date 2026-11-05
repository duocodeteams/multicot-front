/** Tipos del flujo de emisión Omint vía /v1/sales */

export type OmintEmissionStatus =
  | "product_selected"
  | "passengers_complete"
  | "issued"
  | "emission_failed"

export type OmintPaymentStatus = "not_started" | "pending" | "approved"

export type OmintDocumentType = "dni" | "passport" | "cuit"

export type OmintCatalogItem = {
  id: string
  name: string
}

export type OmintFinancingOption = {
  id: string
  dues: number
}

export type OmintPaymentMethod = {
  id: string
  code: string
  requires_financing: boolean
  financing?: OmintFinancingOption[]
}

export type OmintEmergencyContact = {
  first_name: string
  last_name: string
  phone: string
  email: string
}

export type OmintPassenger = {
  is_holder: boolean
  first_name: string
  last_name: string
  birth_date: string
  document_type: OmintDocumentType
  document_number: string
  email?: string
  phone?: string
  country_id?: string
  province_id?: string
  country?: string
  province?: string
  street?: string
  street_number?: string
  city?: string
}

export type OmintPassengersPayload = {
  receive_promotions: boolean
  emergency_contact: OmintEmergencyContact
  passengers: OmintPassenger[]
}

export type CreateOmintSaleRequest = {
  company: "omint"
  quote_id: string
}

export type OmintSale = {
  /** En el back es int; lo tratamos como string|number en el front. */
  id: string | number
  company?: string
  quote_id?: string
  amount: number | string
  currency?: string
  emission_status: OmintEmissionStatus
  payment_status: OmintPaymentStatus
  quoted_ages?: number[]
  departure_date?: string
  passengers?: OmintPassenger[]
  emergency_contact?: OmintEmergencyContact
  payment_methods?: OmintPaymentMethod[]
  checkout_url?: string | null
  voucher_number?: string | null
  voucher_url?: string | null
  receive_promotions?: boolean
  plan_name?: string
  company_name?: string
}

export type CreateOmintPaymentRequest = {
  payment_method_id: string
  financing_id?: string
  return_url_ok: string
  return_url_error: string
  return_url_pending: string
}

/** Respuesta de POST /v1/sales/{id}/passengers — no trae amount. */
export type OmintPassengersResponse = {
  sale_id: number
  emission_status: OmintEmissionStatus | string
  emergency_contact?: OmintEmergencyContact
  passengers?: OmintPassenger[]
  payment_methods: OmintPaymentMethod[]
}

export type CreateOmintPaymentResponse = {
  checkout_url: string
  created: boolean
}

export type ConfirmOmintPaymentResponse = {
  payment_received: boolean
  voucher_number?: string | null
  voucher_url?: string | null
  emission_status?: OmintEmissionStatus
  payment_status?: OmintPaymentStatus
}

export type OmintPaymentReturnStatus = "ok" | "error" | "pending"

export const OMINT_SALE_SESSION_KEY = "omint_active_sale"
export const OMINT_SALE_CONTEXT_KEY = "omint_sale_context"
