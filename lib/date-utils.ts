/**
 * Utilidades de fechas de calendario (YYYY-MM-DD) sin sesgo UTC.
 *
 * `new Date("YYYY-MM-DD")` se interpreta como medianoche UTC → en Argentina (UTC-3)
 * cae el día anterior. Estas helpers parsean/formatean en calendario local.
 */

export type CalendarParts = { year: number; month: number; day: number }

/** Extrae año/mes/día de "YYYY-MM-DD" (ignora hora/timezone si viniera). */
export function parseCalendarDate(isoDate: string): CalendarParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || "").trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return { year, month, day }
}

/** Date local a medianoche del día de calendario (sin shift UTC). */
export function calendarDateToLocalDate(isoDate: string): Date | null {
  const parts = parseCalendarDate(isoDate)
  if (!parts) return null
  return new Date(parts.year, parts.month - 1, parts.day)
}

/**
 * Días de viaje inclusivos (igual que el formulario: differenceInDays + 1).
 * 01/01 → 07/01 = 7 días.
 */
export function inclusiveTripDays(fromIso: string, toIso: string, fallback = 1): number {
  const from = parseCalendarDate(fromIso)
  const to = parseCalendarDate(toIso)
  if (!from || !to) return fallback

  const start = Date.UTC(from.year, from.month - 1, from.day)
  const end = Date.UTC(to.year, to.month - 1, to.day)
  const diff = Math.round((end - start) / 86_400_000)
  if (!Number.isFinite(diff) || diff < 0) return fallback
  return diff + 1
}

const MONTH_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const

/** Display tipo "7 mar 2026" sin pasar por Date UTC. */
export function formatCalendarDateShort(isoDate: string): string {
  const parts = parseCalendarDate(isoDate)
  if (!parts) return isoDate
  const month = MONTH_SHORT_ES[parts.month - 1] ?? String(parts.month)
  return `${parts.day} ${month} ${parts.year}`
}

/** Display DD/MM/YYYY sin cambiar zona horaria. */
export function formatCalendarDateNumeric(isoDate: string): string {
  const parts = parseCalendarDate(isoDate)
  if (!parts) return isoDate
  const dd = String(parts.day).padStart(2, "0")
  const mm = String(parts.month).padStart(2, "0")
  return `${dd}/${mm}/${parts.year}`
}
