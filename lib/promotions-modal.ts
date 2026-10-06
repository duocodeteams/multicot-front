const STORAGE_KEY = "biant-promotions-modal-seen-at"
export const PROMOTIONS_MODAL_COOLDOWN_DAYS = 7

export function shouldShowPromotionsModal(now = Date.now()): boolean {
  if (typeof window === "undefined") return false

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return true

    const seenAt = Number(raw)
    if (!Number.isFinite(seenAt)) return true

    const cooldownMs = PROMOTIONS_MODAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    return now - seenAt >= cooldownMs
  } catch {
    return true
  }
}

export function markPromotionsModalSeen(now = Date.now()): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    // ignore storage errors
  }
}
