/**
 * Persistencia de ventas abiertas (localStorage), aislada por usuario.
 * El back no cancela al salir del menú: el front guarda sale_id y retoma.
 *
 * Clave por usuario:
 * - Omint: company::quote_id (quotationId|productId)
 * - Inter Assist: company::fingerprint del viaje (mismas piezas que el reference del back)
 */

import type { QuotationData } from "@/components/quotation-form"
import type { InterAssistQuoteSnapshot } from "@/lib/issuance/inter-assist-types"
import type { SelectedPlan } from "@/lib/issuance/types"
import type { SaleCompanySlug } from "@/lib/issuance/sales-types"
import { rememberMySaleId } from "@/lib/issuance/my-sales-persistence"

const STORE_KEY = "multicot_open_sales_v3"
const LEGACY_STORE_KEY = "multicot_open_sales_v2"

export type PersistedSaleBinding = {
  company: SaleCompanySlug
  /** quote_id de la API (Omint compuesto / Inter plan_id) */
  quoteId: string
  /** Clave de lookup en el store */
  storageKey: string
  saleId: string
  plan?: SelectedPlan
  quotationData?: QuotationData
  updatedAt: string
}

type StoreMap = Record<string, PersistedSaleBinding>
type UserStoreMap = Record<string, StoreMap>

function readAuthUserId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("auth_user")
    if (!raw) return null
    const user = JSON.parse(raw) as { id?: number | string }
    if (user?.id === undefined || user?.id === null) return null
    return String(user.id)
  } catch {
    return null
  }
}

function fullKey(company: SaleCompanySlug, storageKey: string): string {
  return `${company}::${storageKey}`
}

function dropLegacyStore() {
  if (typeof window === "undefined") return
  localStorage.removeItem(LEGACY_STORE_KEY)
}

function readUserStoreMap(): UserStoreMap {
  if (typeof window === "undefined") return {}
  dropLegacyStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as UserStoreMap
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeUserStoreMap(store: UserStoreMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function readStore(userId?: string | number | null): StoreMap {
  const uid = userId != null ? String(userId) : readAuthUserId()
  if (!uid) return {}
  return readUserStoreMap()[uid] ?? {}
}

function writeStore(next: StoreMap, userId?: string | number | null) {
  const uid = userId != null ? String(userId) : readAuthUserId()
  if (!uid) return
  const all = readUserStoreMap()
  if (Object.keys(next).length === 0) {
    delete all[uid]
  } else {
    all[uid] = next
  }
  writeUserStoreMap(all)
}

/**
 * Misma identidad que usa el back en `_inter_assist_reference`
 * (sin user_id): plan + fechas + edades + trip + destino + promo.
 */
export function interAssistStorageKey(
  planId: string,
  quote: InterAssistQuoteSnapshot
): string {
  const ages = quote.ages.map(String).join(",")
  const ret = quote.return_date ? String(quote.return_date) : ""
  const days = quote.days_range != null ? String(quote.days_range) : ""
  return [
    "ia",
    planId,
    quote.departure_date,
    ret,
    ages,
    quote.trip_type,
    days,
    String(quote.destination_id),
    String(quote.promocion_id ?? 0),
  ].join("|")
}

export function persistOpenSale(binding: {
  company: SaleCompanySlug
  quoteId: string
  /** Si no se pasa, se usa quoteId (Omint). Inter debe pasar fingerprint. */
  storageKey?: string
  saleId: string | number
  plan?: SelectedPlan
  quotationData?: QuotationData
}): PersistedSaleBinding {
  const saleId = String(binding.saleId)
  if (!saleId || saleId === "undefined" || saleId === "null") {
    throw new Error("No se puede persistir una venta sin id")
  }

  const storageKey = binding.storageKey || binding.quoteId
  const store = readStore()
  const key = fullKey(binding.company, storageKey)
  const entry: PersistedSaleBinding = {
    company: binding.company,
    quoteId: binding.quoteId,
    storageKey,
    saleId,
    plan: binding.plan,
    quotationData: binding.quotationData,
    updatedAt: new Date().toISOString(),
  }
  store[key] = entry
  writeStore(store)
  // Lista "Mis ventas" del usuario (provisional hasta GET /v1/sales)
  rememberMySaleId(saleId)
  return entry
}

export function getOpenSaleByStorageKey(
  company: SaleCompanySlug,
  storageKey: string
): PersistedSaleBinding | null {
  if (!storageKey) return null
  return readStore()[fullKey(company, storageKey)] ?? null
}

/** @deprecated preferí getOpenSaleByStorageKey */
export function getOpenSaleByQuote(
  company: SaleCompanySlug,
  quoteId: string
): PersistedSaleBinding | null {
  return getOpenSaleByStorageKey(company, quoteId)
}

export function getOpenSaleBySaleId(saleId: string | number): PersistedSaleBinding | null {
  const id = String(saleId)
  const store = readStore()
  for (const entry of Object.values(store)) {
    if (entry.saleId === id) return entry
  }
  return null
}

export function clearOpenSale(company: SaleCompanySlug, storageKey: string) {
  const store = readStore()
  const key = fullKey(company, storageKey)
  if (!store[key]) return
  delete store[key]
  writeStore(store)
}

export function clearOpenSaleBySaleId(saleId: string | number) {
  const id = String(saleId)
  const store = readStore()
  let changed = false
  for (const [key, entry] of Object.entries(store)) {
    if (entry.saleId === id) {
      delete store[key]
      changed = true
    }
  }
  if (changed) writeStore(store)
}

export function getMostRecentOpenSale(): PersistedSaleBinding | null {
  const entries = Object.values(readStore())
  if (entries.length === 0) return null
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
}

/** IDs de ventas abiertas del usuario autenticado (o el indicado). */
export function listOpenSaleIds(userId?: string | number | null): string[] {
  return Object.values(readStore(userId))
    .map((entry) => String(entry.saleId ?? ""))
    .filter((id) => id && id !== "undefined" && id !== "null")
}

/** Borra ventas abiertas de todos los usuarios y la clave legacy. */
export function clearAllOpenSales() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORE_KEY)
  localStorage.removeItem(LEGACY_STORE_KEY)
}
