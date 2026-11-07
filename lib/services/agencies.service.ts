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
  AgencyCredentialItem,
  AgencyCompanyCredentials,
  ListAgencyCredentialsResponse,
  SaveAgencyCredentialsRequest,
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

function readCompanyCredentials(value: unknown): AgencyCompanyCredentials | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const credentials: AgencyCompanyCredentials = {}
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === "string") credentials[key] = entry
    else if (entry == null) credentials[key] = ""
    else credentials[key] = String(entry)
  }
  return credentials
}

function normalizeCredentialItem(item: AgencyCredentialItem): AgencyCredentialItem {
  const usesDefault = Boolean(item.uses_default)
  return {
    company_slug: item.company_slug,
    company_name: item.company_name,
    uses_default: usesDefault,
    credentials: usesDefault ? null : readCompanyCredentials(item.credentials),
  }
}

/**
 * Listar credenciales de una agencia (multi-compañía).
 * Solo ADMIN. 404 si la agencia no existe o está inactiva.
 */
export async function getAgencyCredentials(
  agencyId: number
): Promise<ListAgencyCredentialsResponse> {
  const response = await apiClient.get<ListAgencyCredentialsResponse>(
    `/v1/agencies/${agencyId}/credentials`
  )
  return {
    items: (response.data.items ?? []).map(normalizeCredentialItem),
  }
}

/**
 * Reemplaza las credenciales de una compañía.
 * Enviar todas las keys del schema: si se omite un secreto, el back puede borrarlo.
 */
export async function saveAgencyCredentials(
  agencyId: number,
  companySlug: string,
  data: SaveAgencyCredentialsRequest
): Promise<AgencyCredentialItem> {
  const slug = companySlug.trim()
  const response = await apiClient.put<AgencyCredentialItem>(
    `/v1/agencies/${agencyId}/credentials/${encodeURIComponent(slug)}`,
    data
  )
  return normalizeCredentialItem(response.data)
}

/**
 * Borra las credenciales propias de una compañía.
 * 204. El próximo listado vuelve a uses_default: true para ese slug.
 */
export async function deleteAgencyCredentials(
  agencyId: number,
  companySlug: string
): Promise<void> {
  const slug = companySlug.trim()
  await apiClient.delete(
    `/v1/agencies/${agencyId}/credentials/${encodeURIComponent(slug)}`
  )
}
