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

export function parsePlanMarkup(markup: string | number | null | undefined): number {
  if (markup === null || markup === undefined || markup === "") return 0
  const n = typeof markup === "number" ? markup : Number(markup)
  return Number.isFinite(n) ? n : 0
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
