/**
 * Contrato compartido de /v1/sales (pasajeros, pago, detalle).
 * Cada compañía tiene su propio flujo; este módulo solo describe el API común.
 */

export type SaleEmissionStatus =
  | "product_selected"
  | "passengers_complete"
  | "emitting"
  | "issued"
  | "emission_failed"
  | "cancelled"

export type SalePaymentStatus = "not_started" | "pending" | "approved" | "rejected"

export type SaleDocumentType = "dni" | "passport" | "cuit"

export type SaleFinancingOption = {
  id: string
  dues?: number | null
}

export type SalePaymentMethod = {
  id: string
  code: string
  requires_financing: boolean
  financing?: SaleFinancingOption[]
}

export type SaleEmergencyContact = {
  first_name: string
  last_name: string
  phone: string
  email: string
}

export type SalePassenger = {
  is_holder: boolean
  first_name: string
  last_name: string
  birth_date: string
  document_type: SaleDocumentType
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

export type SalePassengersPayload = {
  receive_promotions: boolean
  emergency_contact: SaleEmergencyContact
  passengers: SalePassenger[]
}

export type SalePassengersResponse = {
  sale_id: number
  emission_status: SaleEmissionStatus | string
  emergency_contact?: SaleEmergencyContact
  passengers?: SalePassenger[]
  payment_methods: SalePaymentMethod[]
}

export type Sale = {
  id: string | number
  company?: string
  quote_id?: string
  amount: number | string
  currency?: string
  markup?: number | string
  emission_status: SaleEmissionStatus | string
  payment_status: SalePaymentStatus | string
  quoted_ages?: number[]
  departure_date?: string
  return_date?: string | null
  passengers?: SalePassenger[]
  emergency_contact?: SaleEmergencyContact
  payment_methods?: SalePaymentMethod[]
  checkout_url?: string | null
  voucher_number?: string | null
  voucher_url?: string | null
  receive_promotions?: boolean
  plan_name?: string
  company_name?: string
  plan_id?: number | null
  origin?: string | null
  destination_id?: number | null
  trip_type?: string | null
  days_range?: number | null
}

export type CreateSalePaymentRequest = {
  payment_method_id?: string
  financing_id?: string
  return_url_ok: string
  return_url_error: string
  return_url_pending: string
}

export type CreateSalePaymentResponse = {
  checkout_url: string
  created: boolean
}

export type ConfirmSalePaymentResponse = {
  payment_received: boolean
  voucher_number?: string | null
  voucher_url?: string | null
  emission_status?: SaleEmissionStatus | string
  payment_status?: SalePaymentStatus | string
}

export type SalePaymentReturnStatus = "ok" | "error" | "pending"

export type SaleCompanySlug = "omint" | "inter_assist"

/** Ítem de catálogo país/provincia (Omint o Inter Assist). */
export type SaleCatalogItem = {
  id: string
  name: string
}
