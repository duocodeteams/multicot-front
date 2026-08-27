/**
 * Servicio de Planes (catálogo comercial + markup + destinos)
 * Requiere rol ADMIN
 */

import { apiClient } from "../api"
import type {
  CreatePlanRequest,
  ListPlansParams,
  ListPlansResponse,
  PlanDestinationId,
  PlanResponse,
  UpdatePlanRequest,
} from "./types"

export const PLAN_DESTINATION_OPTIONS: {
  id: PlanDestinationId
  label: string
  short: string
}[] = [
  { id: 1, label: "Nacional", short: "Nac." },
  { id: 2, label: "Latinoamérica", short: "Latam" },
  { id: 3, label: "Europa", short: "EU" },
  { id: 4, label: "Resto del mundo", short: "Resto" },
  { id: 5, label: "Norteamérica", short: "NA" },
]

/** Parsea un % de markup que puede venir como string o number desde el API. */
export function parseMarkupPercent(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Valida un input de formulario (≥ 0). Vacío = 0. */
export function parseMarkupField(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return 0
  const n = Number(trimmed)
  if (Number.isNaN(n) || n < 0) return null
  return n
}

/** Total admin = suma de los tres % (misma fórmula que el backend). */
export function getPlanMarkupTotal(plan: {
  producer_markup?: string | number | null
  organizer_markup?: string | number | null
  operating_expenses?: string | number | null
}): number {
  return Number(
    (
      parseMarkupPercent(plan.producer_markup) +
      parseMarkupPercent(plan.organizer_markup) +
      parseMarkupPercent(plan.operating_expenses)
    ).toFixed(2)
  )
}

export async function listPlans(params?: ListPlansParams): Promise<ListPlansResponse> {
  const response = await apiClient.get<ListPlansResponse | PlanResponse[]>("/v1/plans", {
    params,
  })
  const data = response.data
  if (Array.isArray(data)) {
    return { items: data, total: data.length, limit: data.length, offset: 0 }
  }
  return data
}

export async function getPlanById(planId: number): Promise<PlanResponse> {
  const response = await apiClient.get<PlanResponse>(`/v1/plans/${planId}`)
  return response.data
}

export async function createPlan(data: CreatePlanRequest): Promise<PlanResponse> {
  const response = await apiClient.post<PlanResponse>("/v1/plans", data)
  return response.data
}

export async function updatePlan(
  planId: number,
  data: UpdatePlanRequest
): Promise<PlanResponse> {
  const response = await apiClient.patch<PlanResponse>(`/v1/plans/${planId}`, data)
  return response.data
}

/** Baja lógica (active=false). */
export async function deletePlan(planId: number): Promise<void> {
  await apiClient.delete(`/v1/plans/${planId}`)
}
