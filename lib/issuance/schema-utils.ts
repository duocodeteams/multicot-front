import type {
  FieldCondition,
  FormFieldSchema,
  FormSectionSchema,
  IssuanceFormSchema,
  IssuanceFormValues,
} from "./types"

export function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

export function evaluateCondition(
  condition: FieldCondition | undefined,
  values: IssuanceFormValues
): boolean {
  if (!condition) return true

  const raw = getValueByPath(values, condition.field)
  const { operator, value } = condition

  switch (operator) {
    case "eq":
      return raw === value
    case "neq":
      return raw !== value
    case "in":
      return Array.isArray(value) && value.includes(raw as string | number)
    case "notIn":
      return Array.isArray(value) && !value.includes(raw as string | number)
    case "truthy":
      return Boolean(raw)
    case "falsy":
      return !raw
    default:
      return true
  }
}

export function isFieldVisible(field: FormFieldSchema, values: IssuanceFormValues): boolean {
  return evaluateCondition(field.visibleWhen, values)
}

export function isFieldRequired(field: FormFieldSchema, values: IssuanceFormValues): boolean {
  if (field.required) return true
  if (field.requiredWhen) return evaluateCondition(field.requiredWhen, values)
  return false
}

export function buildInitialValues(
  schema: IssuanceFormSchema,
  context: Record<string, unknown> = {}
): IssuanceFormValues {
  const values: IssuanceFormValues = {}

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === "array") {
        const min = field.minItems ?? 1
        values[field.name] = Array.from({ length: min }, () =>
          buildItemDefaults(field.itemFields ?? [], context)
        )
        continue
      }

      if (field.valueFrom) {
        const fromCtx = getValueByPath(context, field.valueFrom)
        if (fromCtx !== undefined) {
          values[field.name] = fromCtx
          continue
        }
      }

      values[field.name] = field.type === "number" ? "" : ""
    }
  }

  return values
}

function buildItemDefaults(
  fields: FormFieldSchema[],
  context: Record<string, unknown>
): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.valueFrom) {
      const fromCtx = getValueByPath(context, field.valueFrom)
      item[field.name] = fromCtx ?? ""
    } else {
      item[field.name] = ""
    }
  }
  return item
}

export function validateSchemaValues(
  schema: IssuanceFormSchema,
  values: IssuanceFormValues
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const section of schema.sections) {
    validateSection(section, values, errors)
  }

  return errors
}

/** Valida solo una sección (útil para wizard step-by-step). */
export function validateSectionValues(
  section: FormSectionSchema,
  values: IssuanceFormValues
): Record<string, string> {
  const errors: Record<string, string> = {}
  validateSection(section, values, errors)
  return errors
}

function validateSection(
  section: FormSectionSchema,
  values: IssuanceFormValues,
  errors: Record<string, string>,
  pathPrefix = ""
) {
  for (const field of section.fields) {
    if (!isFieldVisible(field, values)) continue

    const key = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
    const value = getValueByPath(values, field.name)

    if (field.type === "array") {
      const items = Array.isArray(value) ? value : []
      const min = field.minItems ?? 1
      if (items.length < min) {
        errors[key] = `Agregá al menos ${min} ${field.itemLabel ?? "ítem"}(s)`
      }

      items.forEach((item, index) => {
        const itemObj = (item ?? {}) as Record<string, unknown>
        for (const child of field.itemFields ?? []) {
          const childKey = `${field.name}.${index}.${child.name}`
          const childValue = itemObj[child.name]
          if (isFieldRequired(child, values) && isEmpty(childValue)) {
            errors[childKey] = `${child.label} es obligatorio`
          }
          if (child.type === "email" && !isEmpty(childValue) && !isValidEmail(String(childValue))) {
            errors[childKey] = "Email inválido"
          }
        }
      })
      continue
    }

    if (isFieldRequired(field, values) && isEmpty(value)) {
      errors[key] = `${field.label} es obligatorio`
    }

    if (field.type === "email" && !isEmpty(value) && !isValidEmail(String(value))) {
      errors[key] = "Email inválido"
    }
  }
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Normaliza nombre de compañía a código interno (ej. "Terra Wind" → "terrawind") */
export function normalizeCompanyCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}
