/**
 * Tipos TypeScript para las respuestas de la API
 * Basados en la documentación de API_ENDPOINTS.MKD
 */

// ==================== AUTENTICACIÓN ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    email: string
    role: "admin" | "agency" | "seller"
    agency_id: number | null
  }
}

export interface HealthCheckResponse {
  status: "ok"
}

// ==================== COTIZACIONES ====================

export type TripType = "unico_viaje" | "multiviaje" | "larga_estadia"
export type DestinationId = 1 | 2 | 3 | 4 | 5

export interface CreateQuoteRequest {
  departure_date: string // YYYY-MM-DD
  return_date: string // YYYY-MM-DD
  ages: number[] // Array de edades (mínimo 1)
  origin: string // Código de país (ej: "AR")
  destination_id: DestinationId
  trip_type: TripType
}

export interface QuoteBenefit {
  id: number
  nombre: string
  valor: string
}

export interface QuotePlan {
  company: string
  id: string
  plan_id: string
  plan_name: string
  coverage_amount: number | string // Puede venir como string desde el backend
  benefits: QuoteBenefit[]
  net_rate: number | string // Puede venir como string desde el backend
  final_rate_usd: number | string // Puede venir como string desde el backend
  exchange_rate: number | string // Puede venir como string desde el backend
  final_rate: number | string // Puede venir como string desde el backend
}

export interface CreateQuoteResponse {
  plans: QuotePlan[]
}

// ==================== AGENCIAS ====================

export type BillingFrequency = "monthly" | "quarterly" | "yearly"
export type PaymentMethod = "transfer" | "credit_card" | "debit" | "check"
export type TaxCondition = "responsable_inscripto" | "monotributo" | "exento" | "consumidor_final"

export interface AgencyUser {
  email: string
  password: string // Mínimo 8 caracteres
}

export interface CreateAgencyRequest {
  name: string
  legal_name: string
  tax_id: string
  address: string
  country: string // ISO 3166-1 alpha-2 (2 caracteres)
  legal_representative_name: string
  agency_email: string
  administration_email?: string
  office_phone: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  activation_date: string // YYYY-MM-DD
  commission?: number
  billing_frequency: BillingFrequency
  payment_method: PaymentMethod
  tax_condition: TaxCondition
  bank_account?: string
  ssn_register?: string
  user: AgencyUser
}

export interface AgencyUserResponse {
  id: number
  email: string
  role: "agency"
}

export interface AgencyResponse {
  id: number
  name: string
  legal_name: string
  tax_id: string
  address: string
  country: string
  legal_representative_name: string
  agency_email: string
  administration_email?: string
  office_phone: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  activation_date: string
  commission?: number
  billing_frequency: BillingFrequency
  payment_method: PaymentMethod
  tax_condition: TaxCondition
  bank_account?: string
  ssn_register?: string
  user: AgencyUserResponse
}

export interface UpdateAgencyRequest {
  name?: string
  legal_name?: string
  tax_id?: string
  address?: string
  country?: string
  legal_representative_name?: string
  agency_email?: string
  administration_email?: string
  office_phone?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  activation_date?: string
  commission?: number
  billing_frequency?: BillingFrequency
  payment_method?: PaymentMethod
  tax_condition?: TaxCondition
  bank_account?: string
  ssn_register?: string
}

export interface ListAgenciesResponse {
  items: AgencyResponse[]
  total: number
  limit: number
  offset: number
}

export interface ListAgenciesParams {
  limit?: number // 1-100, default: 50
  offset?: number // default: 0
}

// ==================== VENDEDORES ====================

export interface SellerUser {
  email: string
  password: string // Mínimo 8 caracteres
}

export interface CreateSellerRequest {
  first_name: string
  last_name: string
  address: string
  nationality: string
  birth_date: string // YYYY-MM-DD
  comments?: string // default: ""
  commission?: number // default: 0
  agency_id?: number | null // Opcional, solo ADMIN puede especificar; null = independiente
  user: SellerUser
}

export interface SellerUserResponse {
  id: number
  email: string
  role: "seller"
  password?: string // Contraseña en texto plano (solo si backend la envía)
}

export interface SellerResponse {
  id: number
  user_id: number
  agency_id: number | null
  first_name: string
  last_name: string
  address: string
  nationality: string
  birth_date: string
  comments?: string
  commission?: number
  user: SellerUserResponse
}

export interface UpdateSellerRequest {
  first_name?: string
  last_name?: string
  address?: string
  nationality?: string
  birth_date?: string
  comments?: string
  commission?: number
  // agency_id NO se puede modificar
  // user NO se puede modificar
}

export interface ListSellersResponse {
  items: SellerResponse[]
  total: number
  limit: number
  offset: number
}

export interface ListSellersParams {
  limit?: number // 1-100, default: 50
  offset?: number // default: 0
  active?: boolean | null // true = solo activos, false = todos, null = solo activos (default)
  agency_id?: number // Solo ADMIN puede usar este filtro
}

// ==================== COMPAÑÍAS / PLANES (ADMIN) ====================

/** Destinos fijos del backend (destination_id). */
export type PlanDestinationId = 1 | 2 | 3 | 4 | 5

export interface CompanyResponse {
  id: number
  slug: string
  name: string
  active: boolean
}

export interface ListCompaniesParams {
  active?: boolean
  limit?: number
  offset?: number
}

export interface ListCompaniesResponse {
  items: CompanyResponse[]
  total: number
  limit: number
  offset: number
}

export interface UpdateCompanyRequest {
  active: boolean
}

export interface PlanDestination {
  destination_id: PlanDestinationId
  enabled: boolean
}

export interface PlanResponse {
  id: number
  company_id: number
  company_slug: string
  company_name: string
  external_plan_id: string
  name: string
  /** Puede venir como string desde el API ("15"). */
  markup: string | number
  active: boolean
  destinations: PlanDestination[]
}

export interface CreatePlanRequest {
  company_id: number
  external_plan_id: string
  name: string
  markup?: number
}

export interface UpdatePlanRequest {
  name?: string
  markup?: number
  active?: boolean
  destinations?: PlanDestination[]
}

export interface ListPlansParams {
  company_id?: number
  destination_id?: PlanDestinationId
  /** Omitido = solo activos. false = todos (incluye baja lógica). */
  active?: boolean
  limit?: number
  offset?: number
}

export interface ListPlansResponse {
  items: PlanResponse[]
  total: number
  limit: number
  offset: number
}
