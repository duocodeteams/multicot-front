import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/lib/issuance/types"
import {
  OMINT_SALE_CONTEXT_KEY,
  OMINT_SALE_SESSION_KEY,
  type OmintPaymentReturnStatus,
} from "@/lib/issuance/omint-types"

export type OmintSaleContext = {
  saleId: string
  quoteId: string
  plan: SelectedPlan
  quotationData: QuotationData
}

export function saveOmintActiveSaleId(saleId: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(OMINT_SALE_SESSION_KEY, saleId)
}

export function getOmintActiveSaleId(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(OMINT_SALE_SESSION_KEY)
}

export function clearOmintActiveSaleId() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(OMINT_SALE_SESSION_KEY)
}

export function saveOmintSaleContext(ctx: OmintSaleContext) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(OMINT_SALE_CONTEXT_KEY, JSON.stringify(ctx))
  saveOmintActiveSaleId(ctx.saleId)
}

export function getOmintSaleContext(): OmintSaleContext | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(OMINT_SALE_CONTEXT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OmintSaleContext
  } catch {
    return null
  }
}

export function clearOmintSaleContext() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(OMINT_SALE_CONTEXT_KEY)
  clearOmintActiveSaleId()
}

export function readOmintReturnParams(): {
  saleId: string | null
  payment: OmintPaymentReturnStatus | null
} {
  if (typeof window === "undefined") return { saleId: null, payment: null }
  const params = new URLSearchParams(window.location.search)
  const saleId = params.get("sale_id")
  const paymentRaw = params.get("payment")
  const payment =
    paymentRaw === "ok" || paymentRaw === "error" || paymentRaw === "pending"
      ? paymentRaw
      : null
  return { saleId, payment }
}

export function clearOmintReturnParamsFromUrl() {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (!url.searchParams.has("sale_id") && !url.searchParams.has("payment")) return
  url.searchParams.delete("sale_id")
  url.searchParams.delete("payment")
  window.history.replaceState({}, "", url.pathname + url.search + url.hash)
}

export function isOmintCompany(companyName: string): boolean {
  return companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .includes("omint")
}
