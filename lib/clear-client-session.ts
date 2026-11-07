/**
 * Limpia datos de sesión del navegador que no deben sobrevivir un logout
 * ni mezclarse entre usuarios (cotizaciones/ventas abiertas, contextos de emisión).
 */

import { clearAllOpenSales } from "@/lib/issuance/sale-persistence"
import { clearOmintSaleContext } from "@/lib/issuance/omint-session"
import { clearInterAssistSaleContext } from "@/lib/issuance/inter-assist-session"
import { clearPromotionsModalSeen } from "@/lib/promotions-modal"

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token"
const AUTH_USER_KEY = "auth_user"

export function clearAuthTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

/**
 * Auth + persistencia de cotización/emisión.
 * Usar en logout y en 401.
 */
export function clearClientSessionData() {
  if (typeof window === "undefined") return

  clearAuthTokens()
  clearAllOpenSales()
  clearOmintSaleContext()
  clearInterAssistSaleContext()
  clearPromotionsModalSeen()
}
