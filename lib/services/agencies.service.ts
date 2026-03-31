/**
 * Servicio de Agencias
 * Endpoints relacionados con la gestión de agencias
 * Requiere rol ADMIN
 */

import { apiClient } from "../api"
import type {
  CreateAgencyRequest,
  AgencyResponse,
  UpdateAgencyRequest,
  ListAgenciesResponse,
  ListAgenciesParams,
} from "./types"

/**
 * Crear Agencia
 * Crea una nueva agencia con su usuario principal
 */
export async function createAgency(data: CreateAgencyRequest): Promise<AgencyResponse> {
  const response = await apiClient.post<AgencyResponse>("/v1/agencies", data)
  return response.data
}

/**
 * Listar Agencias
 * Lista agencias activas con paginación
 */
export async function listAgencies(params?: ListAgenciesParams): Promise<ListAgenciesResponse> {
  const response = await apiClient.get<ListAgenciesResponse>("/v1/agencies", {
    params,
  })
  return response.data
}

/**
 * Obtener Agencia por ID
 * Obtiene una agencia específica por su ID
 */
export async function getAgencyById(agencyId: number): Promise<AgencyResponse> {
  const response = await apiClient.get<AgencyResponse>(`/v1/agencies/${agencyId}`)
  return response.data
}

/**
 * Actualizar Agencia
 * Actualiza campos de una agencia (todos los campos son opcionales)
 */
export async function updateAgency(
  agencyId: number,
  data: UpdateAgencyRequest
): Promise<AgencyResponse> {
  const response = await apiClient.patch<AgencyResponse>(`/v1/agencies/${agencyId}`, data)
  return response.data
}

/**
 * Eliminar Agencia
 * Borrado lógico (desactiva la agencia y usuarios/vendedores asociados)
 */
export async function deleteAgency(agencyId: number): Promise<void> {
  await apiClient.delete(`/v1/agencies/${agencyId}`)
}
