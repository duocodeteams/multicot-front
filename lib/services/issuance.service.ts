/**
 * Servicio de Emisión
 * Por ahora usa mocks locales. Cuando el backend exponga los endpoints,
 * reemplazar el cuerpo de cada función sin cambiar la firma pública.
 */

import { buildGenericIssuanceSchema } from "../issuance/mocks/generic"
import { MOCK_ISSUANCES, type IssuanceListItem } from "../issuance/mocks/issuances"
import { buildTerrawindSchema } from "../issuance/mocks/terrawind"
import { normalizeCompanyCode } from "../issuance/schema-utils"
import type {
  CreateIssuancePayload,
  CreateIssuanceResult,
  IssuanceFormSchema,
  IssuanceStatus,
} from "../issuance/types"
// import { apiClient } from "../api"

const USE_MOCK = true

export type { IssuanceListItem }

export type ListIssuancesParams = {
  status?: IssuanceStatus | "all"
  search?: string
}

export type GetIssuanceSchemaParams = {
  companyCode: string
  companyName?: string
  planId?: string | number
}

/**
 * Obtiene el esquema de formulario para emitir con una compañía/plan.
 * Futuro: GET /v1/issuance-schemas/:companyCode?planId=...
 */
export async function getIssuanceSchema(
  params: GetIssuanceSchemaParams
): Promise<IssuanceFormSchema> {
  const code = normalizeCompanyCode(params.companyCode)

  if (USE_MOCK) {
    await delay(280)
    if (code.includes("terra")) {
      return buildTerrawindSchema(params.planId)
    }
    return buildGenericIssuanceSchema(
      code || "unknown",
      params.companyName || params.companyCode || "Compañía",
      params.planId
    )
  }

  // const response = await apiClient.get<IssuanceFormSchema>(
  //   `/v1/issuance-schemas/${code}`,
  //   { params: { planId: params.planId } }
  // )
  // return response.data
  throw new Error("Issuance schema API no configurada")
}

/**
 * Crea / envía una emisión.
 * Futuro: POST /v1/issuances
 */
export async function createIssuance(
  payload: CreateIssuancePayload
): Promise<CreateIssuanceResult> {
  if (USE_MOCK) {
    await delay(900)
    console.log("[emisión] mock payload:", payload)
    return {
      id: crypto.randomUUID(),
      status: "issued",
      externalPolicyId: `MOCK-${Date.now().toString(36).toUpperCase()}`,
      message: "Emisión simulada correctamente (mock). El backend aún no está conectado.",
    }
  }

  // const response = await apiClient.post<CreateIssuanceResult>("/v1/issuances", payload)
  // return response.data
  throw new Error("Issuance API no configurada")
}

/**
 * Lista emisiones (admin / usuario).
 * Futuro: GET /v1/issuances
 */
export async function listIssuances(
  params: ListIssuancesParams = {}
): Promise<IssuanceListItem[]> {
  if (USE_MOCK) {
    await delay(350)
    let items = [...MOCK_ISSUANCES]
    if (params.status && params.status !== "all") {
      items = items.filter((i) => i.status === params.status)
    }
    if (params.search?.trim()) {
      const q = params.search.trim().toLowerCase()
      items = items.filter(
        (i) =>
          i.holderName.toLowerCase().includes(q) ||
          i.planName.toLowerCase().includes(q) ||
          i.companyName.toLowerCase().includes(q) ||
          i.externalPolicyId?.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    }
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  // const response = await apiClient.get<{ items: IssuanceListItem[] }>("/v1/issuances", { params })
  // return response.data.items
  throw new Error("Issuance list API no configurada")
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
