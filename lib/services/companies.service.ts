/**
 * Servicio de Compañías (providers)
 * Requiere rol ADMIN
 */

import { apiClient } from "../api"
import type {
  CompanyResponse,
  ListCompaniesParams,
  ListCompaniesResponse,
  UpdateCompanyRequest,
} from "./types"

export async function listCompanies(
  params?: ListCompaniesParams
): Promise<ListCompaniesResponse> {
  const response = await apiClient.get<ListCompaniesResponse | CompanyResponse[]>(
    "/v1/companies",
    { params }
  )
  const data = response.data
  if (Array.isArray(data)) {
    return { items: data, total: data.length, limit: data.length, offset: 0 }
  }
  return data
}

export async function updateCompany(
  companyId: number,
  data: UpdateCompanyRequest
): Promise<CompanyResponse> {
  const response = await apiClient.patch<CompanyResponse>(
    `/v1/companies/${companyId}`,
    data
  )
  return response.data
}
