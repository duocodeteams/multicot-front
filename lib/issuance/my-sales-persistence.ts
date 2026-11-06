/**
 * Lista provisional de saleId del usuario autenticado (localStorage).
 * Fuente temporal hasta que exista GET /v1/sales (listado del back).
 */

const STORE_KEY = "multicot_my_sale_ids_v1"
const OPEN_SALES_KEY = "multicot_open_sales_v2"

type StoreMap = Record<string, string[]>

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

function readStore(): StoreMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoreMap
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: StoreMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

/** IDs de ventas abiertas (legacy / retomables) para no perder historial previo. */
function readOpenSaleIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(OPEN_SALES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, { saleId?: string }>
    if (!parsed || typeof parsed !== "object") return []
    return Object.values(parsed)
      .map((e) => String(e?.saleId ?? ""))
      .filter((id) => id && id !== "undefined" && id !== "null")
  } catch {
    return []
  }
}

/**
 * Persiste un sale.id en la lista del usuario actual.
 * Llamar siempre tras POST /v1/sales (200/201) o GET exitoso al retomar.
 */
export function rememberMySaleId(
  saleId: string | number,
  userId?: string | number | null
): void {
  const id = String(saleId)
  if (!id || id === "undefined" || id === "null") return

  const uid = userId != null ? String(userId) : readAuthUserId()
  if (!uid) return

  const store = readStore()
  const current = store[uid] ?? []
  if (current.includes(id)) {
    // Mantener el más reciente al frente
    store[uid] = [id, ...current.filter((x) => x !== id)]
  } else {
    store[uid] = [id, ...current]
  }
  writeStore(store)
}

export function forgetMySaleId(
  saleId: string | number,
  userId?: string | number | null
): void {
  const id = String(saleId)
  const uid = userId != null ? String(userId) : readAuthUserId()
  if (!uid || !id) return
  const store = readStore()
  const current = store[uid]
  if (!current?.length) return
  store[uid] = current.filter((x) => x !== id)
  writeStore(store)
}

/**
 * IDs conocidos del usuario (lista propia + ventas abiertas legacy).
 * Cuando exista GET /v1/sales, este helper deja de usarse desde listMySales.
 */
export function listRememberedSaleIds(userId?: string | number | null): string[] {
  const uid = userId != null ? String(userId) : readAuthUserId()
  const fromUser = uid ? readStore()[uid] ?? [] : []
  const fromOpen = readOpenSaleIds()
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const id of [...fromUser, ...fromOpen]) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    ordered.push(id)
  }
  return ordered
}
