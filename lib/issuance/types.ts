/**
 * Contrato del esquema de formulario dinámico de emisión.
 * El backend es la fuente de verdad; el front solo lo representa.
 */

/** Plan seleccionado desde resultados de cotización, listo para emitir. */
export type SelectedPlan = {
  id: string | number
  name: string
  price: number
  pricePerDay: number
  priceUsd?: number
  priceArs?: number
  basePriceUsd?: number
  basePriceArs?: number
  discountPct?: number
  promotionName?: string | null
  exchange_rate?: number
  badge: string | null
  coverage: string[]
  maxCoverage: string
  empresaCotizacion: string
  imagen?: string
  tarifaTotalUnPago: number
  tarifaNeta: number
  totalUsd: number
  pdfDetallePlan?: string
  pdfCondicionesGenerales?: string
}

export type FieldSource = "user" | "catalog" | "quotation" | "system"

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "select"
  | "textarea"
  | "readonly"
  | "array"

export type ConditionOperator = "eq" | "neq" | "in" | "notIn" | "truthy" | "falsy"

export type FieldCondition = {
  field: string
  operator: ConditionOperator
  value?: string | number | boolean | Array<string | number>
}

export type CatalogOption = {
  value: string
  label: string
}

export type FormFieldSchema = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  source?: FieldSource
  options?: CatalogOption[]
  /** Prefill desde cotización u otro contexto (dot-path) */
  valueFrom?: string
  readOnly?: boolean
  /** Campos hijos cuando type === "array" (ej. pasajeros) */
  itemFields?: FormFieldSchema[]
  minItems?: number
  maxItems?: number
  itemLabel?: string
  visibleWhen?: FieldCondition
  requiredWhen?: FieldCondition
}

export type FormSectionSchema = {
  id: string
  title: string
  description?: string
  fields: FormFieldSchema[]
}

export type IssuanceFormSchema = {
  companyCode: string
  companyName: string
  version: string
  planId?: string | number
  sections: FormSectionSchema[]
}

export type IssuanceStatus =
  | "draft"
  | "validating"
  | "pending"
  | "processing"
  | "issued"
  | "awaiting_payment"
  | "error"
  | "review"

export type IssuanceFormValues = Record<string, unknown>

export type CreateIssuancePayload = {
  quotationId?: string
  planId: string | number
  companyCode: string
  idempotencyKey: string
  values: IssuanceFormValues
}

export type CreateIssuanceResult = {
  id: string
  status: IssuanceStatus
  externalPolicyId?: string
  message?: string
}
