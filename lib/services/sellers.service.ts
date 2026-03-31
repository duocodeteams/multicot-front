/**
 * Servicio de Vendedores
 * Endpoints relacionados con la gestión de vendedores
 * Requiere rol ADMIN o AGENCY
 */

import { apiClient } from "../api"
import type {
  CreateSellerRequest,
  SellerResponse,
  UpdateSellerRequest,
  ListSellersResponse,
  ListSellersParams,
} from "./types"

/**
 * Crear Vendedor
 * Crea un nuevo vendedor con su usuario de login
 */
export async function createSeller(data: CreateSellerRequest): Promise<SellerResponse> {
  const response = await apiClient.post<SellerResponse>("/v1/sellers", data)
  return response.data
}

/**
 * Listar Vendedores
 * Lista vendedores con paginación y filtros
 */
export async function listSellers(params?: ListSellersParams): Promise<ListSellersResponse> {
  const response = await apiClient.get<ListSellersResponse>("/v1/sellers", {
    params,
  })
  return response.data
}

/**
 * Obtener Vendedor por ID
 * Obtiene un vendedor específico por su ID
 */
export async function getSellerById(sellerId: number): Promise<SellerResponse> {
  const response = await apiClient.get<SellerResponse>(`/v1/sellers/${sellerId}`)
  return response.data
}

/**
 * Actualizar Vendedor
 * Actualiza campos de un vendedor (todos los campos son opcionales, excepto agency_id que no se puede modificar)
 */
export async function updateSeller(
  sellerId: number,
  data: UpdateSellerRequest
): Promise<SellerResponse> {
  const response = await apiClient.patch<SellerResponse>(`/v1/sellers/${sellerId}`, data)
  return response.data
}

/**
 * Eliminar Vendedor
 * Borrado lógico (desactiva el vendedor y su usuario)
 */
export async function deleteSeller(sellerId: number): Promise<void> {
  await apiClient.delete(`/v1/sellers/${sellerId}`)
}
