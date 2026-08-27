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
 * Inicial de la compañía, para usar cuando no hay logo disponible.
 */
export function getCompanyInitial(company: string | undefined | null): string {
  if (!company) return "?"
  const match = company.match(/[a-zA-Z0-9]/)
  return match ? match[0].toUpperCase() : "?"
}
