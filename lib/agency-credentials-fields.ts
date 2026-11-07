/**
 * Campos de credenciales por compañía.
 * El back lista ítems multi-compañía; acá definimos el formulario de alta/edición.
 * Si no hay mapa para un slug y uses_default=false, se renderizan las keys de credentials.
 */

export type AgencyCredentialFieldType = "text" | "password" | "guid"

export type AgencyCredentialFieldDef = {
  key: string
  label: string
  type: AgencyCredentialFieldType
  required?: boolean
  help?: string
  placeholder?: string
}

export const AGENCY_CREDENTIAL_FIELDS_BY_SLUG: Record<string, AgencyCredentialFieldDef[]> = {
  cardinal: [
    {
      key: "agente_emisor_guid",
      label: "GUID del agente emisor",
      type: "guid",
      required: true,
      placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      help: "Obligatorio para guardar credenciales propias.",
    },
    {
      key: "agente_emisor_secreto",
      label: "Secreto del agente emisor",
      type: "password",
      required: false,
      help: "Podés dejarlo vacío. La cotización no lo usa; se guarda para la emisión. Si lo borrás y guardás, se elimina el secreto anterior.",
    },
  ],
  // inter_assist / otras: completar cuando el back defina el schema
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function inferFieldType(key: string): AgencyCredentialFieldType {
  if (/guid/i.test(key)) return "guid"
  if (/secret|password|token|clave|secreto/i.test(key)) return "password"
  return "text"
}

/**
 * Campos a mostrar para un ítem.
 * 1) Mapa conocido por slug (alta y edición).
 * 2) Si no hay mapa y hay credentials, keys genéricas.
 * 3) Si no hay mapa ni credentials (default), lista vacía → UI avisa que aún no hay formulario.
 */
export function getCredentialFieldsForItem(item: {
  company_slug: string
  uses_default: boolean
  credentials: Record<string, string> | null
}): AgencyCredentialFieldDef[] {
  const known = AGENCY_CREDENTIAL_FIELDS_BY_SLUG[item.company_slug]
  if (known?.length) return known

  if (!item.uses_default && item.credentials) {
    return Object.keys(item.credentials).map((key) => ({
      key,
      label: humanizeKey(key),
      type: inferFieldType(key),
      required: false,
    }))
  }

  return []
}

export function emptyValuesForFields(
  fields: AgencyCredentialFieldDef[]
): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.key, ""]))
}

export function valuesFromCredentials(
  fields: AgencyCredentialFieldDef[],
  credentials: Record<string, string> | null | undefined
): Record<string, string> {
  const base = emptyValuesForFields(fields)
  if (!credentials) return base
  for (const field of fields) {
    const value = credentials[field.key]
    base[field.key] = typeof value === "string" ? value : ""
  }
  return base
}

export function validateCredentialValues(
  fields: AgencyCredentialFieldDef[],
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const raw = values[field.key] ?? ""
    const value = field.type === "guid" ? raw.trim().replace(/^\{|\}$/g, "") : raw

    // Solo validamos obligatoriedad en el front; el formato lo define el back (422).
    if (field.required && !value.trim()) {
      errors[field.key] = `${field.label} es obligatorio.`
    }
  }

  return errors
}

/** Payload listo para PUT: incluye todas las keys del schema (vacío si el usuario no escribió). */
export function buildCredentialsPayload(
  fields: AgencyCredentialFieldDef[],
  values: Record<string, string>
): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const field of fields) {
    const raw = values[field.key] ?? ""
    payload[field.key] =
      field.type === "guid" ? raw.trim().replace(/^\{|\}$/g, "") : raw
  }
  return payload
}
