/**
 * Servicio de ventas / emisión Omint
 * Endpoints: /v1/sales*
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

export async function createSale(data: CreateOmintSaleRequest): Promise<OmintSale> {
  const response = await apiClient.post<OmintSale>("/v1/sales", data)
  return response.data
}

export async function getSale(saleId: string | number): Promise<OmintSale> {
  const response = await apiClient.get<OmintSale>(`/v1/sales/${saleId}`)
  return response.data
}

export async function getOmintCountries(): Promise<OmintCatalogItem[]> {
  const response = await apiClient.get<OmintCatalogItem[] | { items: OmintCatalogItem[] }>(
    "/v1/sales/omint/countries"
  )
  return Array.isArray(response.data) ? response.data : response.data.items ?? []
}

export async function getOmintProvinces(countryId: string): Promise<OmintCatalogItem[]> {
  const response = await apiClient.get<OmintCatalogItem[] | { items: OmintCatalogItem[] }>(
    `/v1/sales/omint/countries/${countryId}/provinces`
  )
  return Array.isArray(response.data) ? response.data : response.data.items ?? []
}

export async function postSalePassengers(
  saleId: string | number,
  payload: OmintPassengersPayload
): Promise<OmintPassengersResponse> {
  const response = await apiClient.post<OmintPassengersResponse>(
    `/v1/sales/${saleId}/passengers`,
    payload
  )
  return response.data
}

export async function createSalePayment(
  saleId: string | number,
  payload: CreateOmintPaymentRequest
): Promise<CreateOmintPaymentResponse> {
  const response = await apiClient.post<CreateOmintPaymentResponse>(
    `/v1/sales/${saleId}/payment`,
    payload
  )
  return response.data
}

export async function confirmSalePayment(
  saleId: string | number
): Promise<ConfirmOmintPaymentResponse> {
  const response = await apiClient.post<ConfirmOmintPaymentResponse>(
    `/v1/sales/${saleId}/payment/confirm`
  )
  return response.data
}

/** URLs de retorno al panel (SPA con basePath /portal). */
export function buildOmintPaymentReturnUrls(saleId: string | number): {
  return_url_ok: string
  return_url_error: string
  return_url_pending: string
} {
  const make = (payment: "ok" | "error" | "pending") => {
    const url = new URL(window.location.href)
    // Conservar path del panel; limpiar hash y setear query de retorno
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
