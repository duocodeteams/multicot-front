import type { IssuanceStatus } from "../types"

export type IssuanceListItem = {
  id: string
  companyCode: string
  companyName: string
  planName: string
  status: IssuanceStatus
  externalPolicyId?: string
  holderName: string
  passengerCount: number
  amountLabel: string
  createdAt: string
  agencyName?: string
}

/** Datos mock para maquetar listado admin / usuario */
export const MOCK_ISSUANCES: IssuanceListItem[] = [
  {
    id: "iss-001",
    companyCode: "interassist",
    companyName: "Interassist",
    planName: "INTER 200 - FULL",
    status: "issued",
    externalPolicyId: "MOCK-K8X2P1",
    holderName: "María Gómez",
    passengerCount: 2,
    amountLabel: "USD 72,8",
    createdAt: "2026-10-18T14:22:00.000Z",
    agencyName: "Viajes del Sur",
  },
  {
    id: "iss-002",
    companyCode: "terrawind",
    companyName: "Terrawind",
    planName: "TW Premium Europa",
    status: "processing",
    holderName: "Carlos Pérez",
    passengerCount: 1,
    amountLabel: "USD 145",
    createdAt: "2026-10-19T09:10:00.000Z",
    agencyName: "Biant Travel",
  },
  {
    id: "iss-003",
    companyCode: "omint",
    companyName: "Omint",
    planName: "Omint Travel Plus",
    status: "awaiting_payment",
    externalPolicyId: "OM-99281",
    holderName: "Lucía Fernández",
    passengerCount: 3,
    amountLabel: "USD 210",
    createdAt: "2026-10-19T16:45:00.000Z",
    agencyName: "Agencia Norte",
  },
  {
    id: "iss-004",
    companyCode: "cardinalassistance",
    companyName: "Cardinal Assistance",
    planName: "Cardinal Classic",
    status: "error",
    holderName: "Diego Ruiz",
    passengerCount: 1,
    amountLabel: "USD 98",
    createdAt: "2026-10-20T08:05:00.000Z",
    agencyName: "Viajes del Sur",
  },
  {
    id: "iss-005",
    companyCode: "universalassistance",
    companyName: "Universal Assistance",
    planName: "Universal Max",
    status: "review",
    holderName: "Ana Torres",
    passengerCount: 4,
    amountLabel: "USD 320",
    createdAt: "2026-10-20T10:30:00.000Z",
    agencyName: "Biant Travel",
  },
  {
    id: "iss-006",
    companyCode: "newtravelassistance",
    companyName: "New Travel Assistance",
    planName: "NTA Multi 60",
    status: "draft",
    holderName: "Pedro Sánchez",
    passengerCount: 2,
    amountLabel: "USD 180",
    createdAt: "2026-10-20T11:00:00.000Z",
    agencyName: "Agencia Norte",
  },
]

export const ISSUANCE_STATUS_LABELS: Record<IssuanceStatus, string> = {
  draft: "Borrador",
  validating: "Validando",
  pending: "Pendiente",
  processing: "Procesando",
  issued: "Emitida",
  awaiting_payment: "Esperando pago",
  error: "Error",
  review: "En revisión",
}
