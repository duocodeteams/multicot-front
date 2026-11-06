import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/lib/issuance/types"
import {
  INTER_ASSIST_SALE_CONTEXT_KEY,
  INTER_ASSIST_SALE_SESSION_KEY,
} from "@/lib/issuance/inter-assist-types"
import type { SalePaymentReturnStatus } from "@/lib/issuance/sales-types"
import {
  mapDaysRange,
  mapDestinationToId,
  mapTripTypeToApi,
} from "@/lib/services/quotes.mapper"
import type { InterAssistQuoteSnapshot } from "@/lib/issuance/inter-assist-types"

export type InterAssistSaleContext = {
  company: "inter_assist"
  saleId: string
  quoteId: string
  plan: SelectedPlan
  quotationData: QuotationData
}

export function isInterAssistCompany(companyName: string): boolean {
  const key = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
  return key.includes("interassist") || key === "inter"
}

export function saveInterAssistSaleContext(ctx: InterAssistSaleContext) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(INTER_ASSIST_SALE_CONTEXT_KEY, JSON.stringify(ctx))
  sessionStorage.setItem(INTER_ASSIST_SALE_SESSION_KEY, ctx.saleId)
}

export function getInterAssistSaleContext(): InterAssistSaleContext | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(INTER_ASSIST_SALE_CONTEXT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as InterAssistSaleContext
  } catch {
    return null
  }
}

export function clearInterAssistSaleContext() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(INTER_ASSIST_SALE_CONTEXT_KEY)
  sessionStorage.removeItem(INTER_ASSIST_SALE_SESSION_KEY)
}

export function readSaleReturnParams(): {
  saleId: string | null
  payment: SalePaymentReturnStatus | null
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

export function clearSaleReturnParamsFromUrl() {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (!url.searchParams.has("sale_id") && !url.searchParams.has("payment")) return
  url.searchParams.delete("sale_id")
  url.searchParams.delete("payment")
  window.history.replaceState({}, "", url.pathname + url.search + url.hash)
}

/** Snapshot `quote` exigido por POST /v1/sales de Inter Assist. */
export function buildInterAssistQuoteSnapshot(
  plan: SelectedPlan,
  quotationData: QuotationData
): InterAssistQuoteSnapshot {
  const trip_type = mapTripTypeToApi(quotationData.tipoViaje) as InterAssistQuoteSnapshot["trip_type"]
  const days_range = trip_type === "multiviaje" ? mapDaysRange(quotationData.tipoViaje) : null

  const currency = (plan.priceUsd !== undefined ? "USD" : "ARS").toUpperCase()
  const amount = plan.priceUsd ?? plan.priceArs ?? plan.price

  // Orden de ages estable = misma identity en el reference del back
  const ages = quotationData.edades
    .map((a) => parseInt(String(a), 10))
    .filter((n) => Number.isFinite(n))

  return {
    departure_date: quotationData.desde,
    return_date: trip_type === "multiviaje" ? null : quotationData.hasta || null,
    ages,
    origin: (quotationData.origen || "AR").trim().toUpperCase() || "AR",
    destination_id: mapDestinationToId(quotationData.destino),
    trip_type,
    days_range: days_range ?? null,
    amount: Number(amount).toFixed(2),
    currency,
    plan_name: plan.name,
    promocion_id: 0,
    markup: "0",
  }
}

/** quote_id Inter Assist = plan_id numérico de la cotización. */
export function resolveInterAssistQuoteId(plan: SelectedPlan): string {
  const fromPlanId = (plan as SelectedPlan & { planId?: string | number }).planId
  if (fromPlanId !== undefined && fromPlanId !== null && String(fromPlanId).trim()) {
    return String(fromPlanId)
  }
  return String(plan.id)
}
