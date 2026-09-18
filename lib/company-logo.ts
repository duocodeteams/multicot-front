/**
 * Logos de las compañías de asistencia
 *
 * El backend manda el nombre de la compañía en formatos distintos según el
 * endpoint ("GoAssistance", "GO! Assistance", "New Travel", etc.), así que la
 * búsqueda se hace sobre una versión normalizada del nombre.
 */

/** Normaliza el nombre: minúsculas, sin acentos y sin separadores. */
export function normalizeCompanyKey(company: string): string {
  return company
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

// Prefijo /portal por el basePath de Next (next.config.mjs)
const LOGO_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/newtravel/, "/portal/newtravellogo.png"],
  [/terrawind/, "/portal/terrawindlogo.png"],
  [/universal/, "/portal/universallogo.png"],
  [/cardinal/, "/portal/cardinallogo.png"],
  [/inter/, "/portal/interlogo.png"],
  [/^go/, "/portal/gologo.png"],
  [/pax/, "/portal/paxlogo.png"],
  [/omint/, "/portal/omint.webp"],
]

/**
 * Devuelve la ruta del logo de la compañía, o null si no hay uno conocido.
 */
export function getCompanyLogo(company: string | undefined | null): string | null {
  if (!company) return null

  const key = normalizeCompanyKey(company)
  if (!key) return null

  for (const [pattern, logo] of LOGO_RULES) {
    if (pattern.test(key)) return logo
  }

  return null
}

/**
 * Prefiere el logo local tipado; si no hay, usa la URL del backend.
 */
export function resolvePlanLogo(opts: {
  companyRaw?: string | null
  empresaCotizacion?: string | null
  imagen?: string | null
}): string | null {
  return (
    getCompanyLogo(opts.companyRaw) ??
    getCompanyLogo(opts.empresaCotizacion) ??
    opts.imagen ??
    null
  )
}

/** Clases para logo en cabecera de tarjeta de cotización. */
export const COMPANY_LOGO_CARD_CLASS =
  "max-h-11 h-11 w-auto max-w-[200px] object-contain object-left"

/** Clases para logo en comparador / modal (un poco más compacto). */
export const COMPANY_LOGO_COMPACT_CLASS =
  "max-h-9 h-9 w-auto max-w-[180px] object-contain object-left"

/**
 * Inicial de la compañía, para usar cuando no hay logo disponible.
 */
export function getCompanyInitial(company: string | undefined | null): string {
  if (!company) return "?"
  const match = company.match(/[a-zA-Z0-9]/)
  return match ? match[0].toUpperCase() : "?"
}
