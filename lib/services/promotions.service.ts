/**
 * Servicio de promociones (catálogo informativo).
 * No afecta cotización ni precios. Lectura: cualquier usuario logueado.
 * ABM: solo ADMIN.
 */

import { apiClient } from "../api"
import type {
  CreatePromotionRequest,
  ListPromotionsParams,
  ListPromotionsResponse,
  PromotionResponse,
  UpdatePromotionRequest,
} from "./types"

export async function listPromotions(
  params?: ListPromotionsParams
): Promise<ListPromotionsResponse> {
  const response = await apiClient.get<ListPromotionsResponse | PromotionResponse[]>(
    "/v1/promotions",
    { params }
  )
  const data = response.data
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  return data
}

export async function getPromotionById(id: number): Promise<PromotionResponse> {
  const response = await apiClient.get<PromotionResponse>(`/v1/promotions/${id}`)
  return response.data
}

export async function createPromotion(
  data: CreatePromotionRequest
): Promise<PromotionResponse> {
  const response = await apiClient.post<PromotionResponse>("/v1/promotions", data)
  return response.data
}

export async function updatePromotion(
  id: number,
  data: UpdatePromotionRequest
): Promise<PromotionResponse> {
  const response = await apiClient.patch<PromotionResponse>(`/v1/promotions/${id}`, data)
  return response.data
}

export async function deletePromotion(id: number): Promise<void> {
  await apiClient.delete(`/v1/promotions/${id}`)
}

/** Agrupa items planos (ya ordenados por compañía) preservando el orden del API. */
export function groupPromotionsByCompany(
  items: PromotionResponse[]
): Array<{
  company_id: number
  company_name: string
  company_slug: string
  company_active: boolean
  promotions: PromotionResponse[]
}> {
  const groups: Array<{
    company_id: number
    company_name: string
    company_slug: string
    company_active: boolean
    promotions: PromotionResponse[]
  }> = []
  const indexById = new Map<number, number>()

  for (const item of items) {
    const existing = indexById.get(item.company_id)
    if (existing === undefined) {
      indexById.set(item.company_id, groups.length)
      groups.push({
        company_id: item.company_id,
        company_name: item.company_name,
        company_slug: item.company_slug,
        company_active: item.company_active,
        promotions: [item],
      })
    } else {
      groups[existing].promotions.push(item)
    }
  }

  return groups
}

/** Formatea YYYY-MM-DD a DD/MM/YYYY sin cambiar zona horaria. */
export function formatPromotionDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (!match) return isoDate
  return `${match[3]}/${match[2]}/${match[1]}`
}
