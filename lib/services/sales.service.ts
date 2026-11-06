/**
 * Cliente HTTP de /v1/sales.
 * Endpoints compartidos entre compañías; cada flujo (Omint / Inter Assist) decide cuándo llamarlos.
 */

import { apiClient } from "../api"
import type {
  ConfirmOmintPaymentResponse,
  CreateOmintPaymentRequest,
  CreateOmintPaymentResponse,
  CreateOmintSaleRequest,
  OmintCatalogItem,
  OmintPassengersPayload,
  OmintPassengersResponse,
  OmintSale,
} from "../issuance/omint-types"
import type {
  CreateInterAssistSaleRequest,
  InterAssistSale,
  SimulatePaymentRequest,
} from "../issuance/inter-assist-types"
import type {
  ConfirmSalePaymentResponse,
  CreateSalePaymentRequest,
  CreateSalePaymentResponse,
  Sale,
  SaleCatalogItem,
  SaleCompanySlug,
  SalePassengersPayload,
  SalePassengersResponse,
} from "../issuance/sales-types"
import {
  clearOpenSale,
  getOpenSaleByStorageKey,
  persistOpenSale,
} from "../issuance/sale-persistence"
import {
  forgetMySaleId,
  listRememberedSaleIds,
  rememberMySaleId,
} from "../issuance/my-sales-persistence"
import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "../issuance/types"

export type CreateSaleRequest = CreateOmintSaleRequest | CreateInterAssistSaleRequest

function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status?: number }).status
    return typeof status === "number" ? status : undefined
  }
  return undefined
}

/**
 * Abre o retoma una venta según la guía del back:
 * 1) Si hay sale_id persistido (o preferred) → GET
 * 2) Si no → POST (200/201 idempotente en product_selected)
 * 3) Si POST 409 (ya avanzó de product_selected) → GET del sale_id guardado
 *
 * Guarda siempre `response.id` tras un POST/GET exitoso.
 */
export async function openOrResumeSale(opts: {
  company: SaleCompanySlug
  quoteId: string
  /** Clave localStorage. Omint=quoteId; Inter Assist=fingerprint del viaje. */
  storageKey?: string
  preferredSaleId?: string | null
  createPayload: CreateSaleRequest
  plan?: SelectedPlan
  quotationData?: QuotationData
}): Promise<Sale> {
  const {
    company,
    quoteId,
    preferredSaleId,
    createPayload,
    plan,
    quotationData,
  } = opts
  const storageKey = opts.storageKey || quoteId
  const stored = getOpenSaleByStorageKey(company, storageKey)
  const candidateId = preferredSaleId || stored?.saleId || null

  const save = (sale: Sale) => {
    if (sale.id === undefined || sale.id === null || sale.id === "") {
      throw new Error("La respuesta de /v1/sales no trajo id")
    }
    persistOpenSale({
      company,
      quoteId,
      storageKey,
      saleId: sale.id,
      plan: plan || stored?.plan,
      quotationData: quotationData || stored?.quotationData,
    })
    return sale
  }

  if (candidateId) {
    try {
      return save(await getSale(candidateId))
    } catch (err) {
      const status = getErrorStatus(err)
      if (status === 404 || status === 403) {
        clearOpenSale(company, storageKey)
      } else {
        throw err
      }
    }
  }

  if (!quoteId) {
    throw new Error("Falta quote_id para abrir o retomar la venta")
  }

  try {
    const created = await createSale(createPayload)
    // 200 o 201: siempre persistir response.id (también Inter Assist)
    return save(created)
  } catch (err) {
    const status = getErrorStatus(err)
    // 409: venta ya avanzada o emitida → solo se retoma con sale_id (GET)
    if (status === 409) {
      const fallbackId =
        getOpenSaleByStorageKey(company, storageKey)?.saleId || candidateId
      if (!fallbackId) {
        throw new Error(
          "Esta cotización ya tiene una venta avanzada/emitida y no hay sale_id guardado. Retomá con GET /v1/sales/{id}."
        )
      }
      return save(await getSale(fallbackId))
    }
    throw err
  }
}

export async function createSale(data: CreateSaleRequest): Promise<Sale> {
  const response = await apiClient.post<Sale>("/v1/sales", data)
  const sale = response.data
  // Siempre persistir sale.id tras POST exitoso (200/201)
  if (sale?.id !== undefined && sale?.id !== null && sale?.id !== "") {
    rememberMySaleId(sale.id)
  }
  return sale
}

/**
 * Ítem del listado "Mis ventas".
 * status=error: GET falló (distinto de 403/404, que se omiten).
 */
export type MySaleListItem =
  | { saleId: string; status: "ok"; sale: Sale }
  | { saleId: string; status: "error"; error: string }

/**
 * Lista ventas del usuario autenticado.
 *
 * Hoy: IDs en localStorage → GET /v1/sales/{id} en paralelo (ignora 403/404).
 * Cuando el back agregue GET /v1/sales, reemplazar solo el cuerpo de `fetchMySaleIds`
 * / este fetch; la UI sigue consumiendo listMySales.
 */
async function fetchMySaleIds(userId?: string | number | null): Promise<string[]> {
  // Provisional — sustituir por: (await apiClient.get<Sale[]>("/v1/sales")).data.map(...)
  return listRememberedSaleIds(userId)
}

export async function listMySales(opts?: {
  userId?: string | number | null
}): Promise<MySaleListItem[]> {
  const ids = await fetchMySaleIds(opts?.userId)
  if (ids.length === 0) return []

  const results = await Promise.all(
    ids.map(async (saleId): Promise<MySaleListItem | null> => {
      try {
        const sale = await getSale(saleId)
        return { saleId, status: "ok", sale }
      } catch (err) {
        const status = getErrorStatus(err)
        if (status === 403 || status === 404) {
          forgetMySaleId(saleId, opts?.userId)
          return null
        }
        const message =
          err instanceof Error ? err.message : "No se pudo cargar la venta"
        return { saleId, status: "error", error: message }
      }
    })
  )

  return results.filter((item): item is MySaleListItem => item != null)
}

/** @deprecated alias tipado Omint — preferí createSale */
export async function createOmintSale(data: CreateOmintSaleRequest): Promise<OmintSale> {
  return createSale(data) as Promise<OmintSale>
}

export async function createInterAssistSale(
  data: CreateInterAssistSaleRequest
): Promise<InterAssistSale> {
  return createSale(data)
}

export async function getSale(saleId: string | number): Promise<Sale> {
  const response = await apiClient.get<Sale>(`/v1/sales/${saleId}`)
  return response.data
}

function catalogPrefix(company: SaleCompanySlug): "omint" | "inter_assist" {
  return company === "inter_assist" ? "inter_assist" : "omint"
}

function unwrapCatalog(
  data: SaleCatalogItem[] | { items: SaleCatalogItem[] } | OmintCatalogItem[] | { items: OmintCatalogItem[] }
): SaleCatalogItem[] {
  if (Array.isArray(data)) return data
  return data.items ?? []
}

/**
 * Catálogo de países según compañía.
 * Omint → /v1/sales/omint/countries
 * Inter Assist → /v1/sales/inter_assist/countries
 */
export async function getSaleCountries(
  company: SaleCompanySlug = "omint"
): Promise<SaleCatalogItem[]> {
  const response = await apiClient.get<SaleCatalogItem[] | { items: SaleCatalogItem[] }>(
    `/v1/sales/${catalogPrefix(company)}/countries`
  )
  return unwrapCatalog(response.data)
}

/**
 * Provincias del país. Inter Assist solo tiene datos para AR; otros → items: [].
 */
export async function getSaleProvinces(
  countryId: string,
  company: SaleCompanySlug = "omint"
): Promise<SaleCatalogItem[]> {
  const response = await apiClient.get<SaleCatalogItem[] | { items: SaleCatalogItem[] }>(
    `/v1/sales/${catalogPrefix(company)}/countries/${countryId}/provinces`
  )
  return unwrapCatalog(response.data)
}

/** @deprecated preferí getSaleCountries("omint") */
export async function getOmintCountries(): Promise<OmintCatalogItem[]> {
  return getSaleCountries("omint")
}

/** @deprecated preferí getSaleProvinces(countryId, "omint") */
export async function getOmintProvinces(countryId: string): Promise<OmintCatalogItem[]> {
  return getSaleProvinces(countryId, "omint")
}

export async function postSalePassengers(
  saleId: string | number,
  payload: SalePassengersPayload | OmintPassengersPayload
): Promise<SalePassengersResponse | OmintPassengersResponse> {
  const response = await apiClient.post<SalePassengersResponse>(
    `/v1/sales/${saleId}/passengers`,
    payload
  )
  return response.data
}

export async function createSalePayment(
  saleId: string | number,
  payload: CreateSalePaymentRequest | CreateOmintPaymentRequest
): Promise<CreateSalePaymentResponse | CreateOmintPaymentResponse> {
  const response = await apiClient.post<CreateSalePaymentResponse>(
    `/v1/sales/${saleId}/payment`,
    payload
  )
  return response.data
}

/** Simulación de pasarela propia (Inter Assist). */
export async function simulateSalePayment(
  saleId: string | number,
  payload: SimulatePaymentRequest
): Promise<Sale> {
  const response = await apiClient.post<Sale>(`/v1/sales/${saleId}/payment/simulate`, payload)
  return response.data
}

export async function confirmSalePayment(
  saleId: string | number
): Promise<ConfirmSalePaymentResponse | ConfirmOmintPaymentResponse> {
  const response = await apiClient.post<ConfirmSalePaymentResponse>(
    `/v1/sales/${saleId}/payment/confirm`
  )
  return response.data
}

/** URLs de retorno al panel (SPA con basePath /portal). */
export function buildSalePaymentReturnUrls(saleId: string | number): {
  return_url_ok: string
  return_url_error: string
  return_url_pending: string
} {
  const make = (payment: "ok" | "error" | "pending") => {
    const url = new URL(window.location.href)
    url.hash = ""
    url.search = ""
    url.searchParams.set("sale_id", String(saleId))
    url.searchParams.set("payment", payment)
    return url.toString()
  }

  return {
    return_url_ok: make("ok"),
    return_url_error: make("error"),
    return_url_pending: make("pending"),
  }
}

/**
 * PDF de voucher vía proxy del back (JWT).
 * Inter Assist no es público: no abrir voucher_url de IA directo en el browser.
 */
export async function fetchSaleVoucherPdf(
  saleId: string | number,
  lang: string = "es"
): Promise<Blob> {
  try {
    const response = await apiClient.get(`/v1/sales/${saleId}/voucher/pdf`, {
      params: { lang },
      responseType: "blob",
    })
    return response.data as Blob
  } catch (err) {
    const status = getErrorStatus(err)
    if (status === 403) {
      throw new Error(
        "Sin permiso para descargar el voucher (403). En el portal de Inter Assist la API Key necesita el módulo vouchers."
      )
    }
    throw err
  }
}

/** Descarga el PDF autenticado y lo abre en una pestaña (blob URL). */
export async function openSaleVoucherPdf(
  saleId: string | number,
  lang: string = "es"
): Promise<void> {
  const blob = await fetchSaleVoucherPdf(saleId, lang)
  const objectUrl = URL.createObjectURL(blob)
  const win = window.open(objectUrl, "_blank", "noopener,noreferrer")
  if (!win) {
    // Popup bloqueado: forzar descarga
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `voucher-${saleId}.pdf`
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  // Liberar memoria un rato después de abrir
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

/** Alias semántico del PDF autenticado (blob + abrir/descargar). */
export const downloadVoucherPdf = openSaleVoucherPdf

/** @deprecated usar buildSalePaymentReturnUrls */
export const buildOmintPaymentReturnUrls = buildSalePaymentReturnUrls
