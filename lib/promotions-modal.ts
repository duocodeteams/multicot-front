const STORAGE_KEY = "biant-promotions-modal-shown-for-token"
const LEGACY_STORAGE_KEY = "biant-promotions-modal-seen-at"

/**
 * Muestra el modal una vez por login (token).
 * Al cerrar sesión e iniciar de nuevo, vuelve a aparecer.
 */
export function shouldShowPromotionsModal(token: string | null | undefined): boolean {
  if (typeof window === "undefined") return false
  if (!token) return false

  try {
    // Limpiar clave vieja del cooldown de 7 días
    localStorage.removeItem(LEGACY_STORAGE_KEY)

    const shownFor = localStorage.getItem(STORAGE_KEY)
    return shownFor !== token
  } catch {
    return true
  }
}

export function markPromotionsModalSeen(token: string | null | undefined): void {
  if (typeof window === "undefined" || !token) return

  try {
    localStorage.setItem(STORAGE_KEY, token)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export function clearPromotionsModalSeen(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}
