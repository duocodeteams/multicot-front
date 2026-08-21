/**
 * Servicio de gestión de planes, markups y visibilidad por destino.
 * Por ahora es 100% mock (sin endpoints de backend).
 */

export type DestinationCode = "1000" | "1001" | "1002" | "1003" | "1004"

export const DESTINATION_OPTIONS: { value: DestinationCode; label: string }[] = [
  { value: "1002", label: "Nacional" },
  { value: "1000", label: "Latinoamérica" },
  { value: "1001", label: "Europa" },
  { value: "1004", label: "Norteamérica" },
  { value: "1003", label: "Resto del Mundo" },
]

export type InsuranceCompany = {
  id: string
  name: string
  active: boolean
}

export type InsurancePlan = {
  id: string
  companyId: string
  name: string
  coverageAmount: number
  /** % sobre la tarifa neta de la cotización. 0 = sin markup. */
  markupPercent: number
  active: boolean
}

/** Qué se muestra en el cotizador para un destino. */
export type DestinationVisibility = {
  destinationId: DestinationCode
  companyIds: string[]
  /**
   * Planes explícitamente habilitados.
   * Vacío + compañía habilitada → todos los planes activos de esa compañía.
   */
  planIds: string[]
}

export type PlansCatalog = {
  companies: InsuranceCompany[]
  plans: InsurancePlan[]
  visibility: DestinationVisibility[]
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

/** Estado en memoria (simula persistencia de sesión). */
let catalog: PlansCatalog = {
  companies: [
    { id: "pax", name: "PAX Assistance", active: true },
    { id: "cardinal", name: "Cardinal Assistance", active: true },
    { id: "goassistance", name: "Go Assistance", active: true },
    { id: "interassist", name: "InterAssist", active: true },
    { id: "universal", name: "Universal Assistance", active: true },
    { id: "terrawind", name: "Terrawind", active: true },
    { id: "newtravel", name: "New Travel Assistance", active: true },
  ],
  plans: [
    { id: "pax-basic", companyId: "pax", name: "PAX Basic", coverageAmount: 30000, markupPercent: 0, active: true },
    { id: "pax-plus", companyId: "pax", name: "PAX Plus", coverageAmount: 60000, markupPercent: 20, active: true },
    { id: "pax-premium", companyId: "pax", name: "PAX Premium", coverageAmount: 120000, markupPercent: 0, active: true },
    { id: "card-lite", companyId: "cardinal", name: "Cardinal Lite", coverageAmount: 25000, markupPercent: 0, active: true },
    { id: "card-std", companyId: "cardinal", name: "Cardinal Standard", coverageAmount: 50000, markupPercent: 0, active: true },
    { id: "card-max", companyId: "cardinal", name: "Cardinal Max", coverageAmount: 100000, markupPercent: 8, active: true },
    { id: "go-essential", companyId: "goassistance", name: "Go Essential", coverageAmount: 40000, markupPercent: 0, active: true },
    { id: "go-travel", companyId: "goassistance", name: "Go Travel", coverageAmount: 80000, markupPercent: 0, active: true },
    { id: "go-elite", companyId: "goassistance", name: "Go Elite", coverageAmount: 150000, markupPercent: 22, active: false },
    { id: "inter-base", companyId: "interassist", name: "Inter Base", coverageAmount: 35000, markupPercent: 0, active: true },
    { id: "inter-world", companyId: "interassist", name: "Inter World", coverageAmount: 90000, markupPercent: 0, active: true },
    { id: "uni-start", companyId: "universal", name: "Universal Start", coverageAmount: 30000, markupPercent: 0, active: true },
    { id: "uni-global", companyId: "universal", name: "Universal Global", coverageAmount: 100000, markupPercent: 17, active: true },
    { id: "terra-basic", companyId: "terrawind", name: "Terrawind Basic", coverageAmount: 45000, markupPercent: 0, active: true },
    { id: "terra-pro", companyId: "terrawind", name: "Terrawind Pro", coverageAmount: 110000, markupPercent: 0, active: true },
    { id: "nt-economy", companyId: "newtravel", name: "New Travel Economy", coverageAmount: 20000, markupPercent: 0, active: true },
    { id: "nt-comfort", companyId: "newtravel", name: "New Travel Comfort", coverageAmount: 70000, markupPercent: 15, active: true },
    { id: "nt-vip", companyId: "newtravel", name: "New Travel VIP", coverageAmount: 200000, markupPercent: 0, active: true },
  ],
  visibility: [
    {
      destinationId: "1002",
      companyIds: ["pax", "cardinal", "goassistance", "newtravel"],
      planIds: [],
    },
    {
      destinationId: "1000",
      companyIds: ["pax", "cardinal", "goassistance", "interassist", "universal", "terrawind", "newtravel"],
      planIds: [],
    },
    {
      destinationId: "1001",
      companyIds: ["pax", "cardinal", "goassistance", "interassist", "universal", "terrawind"],
      planIds: ["pax-plus", "pax-premium", "card-std", "card-max", "go-travel", "go-elite", "inter-world", "uni-global", "terra-pro"],
    },
    {
      destinationId: "1004",
      companyIds: ["pax", "cardinal", "universal", "terrawind"],
      planIds: ["pax-premium", "card-max", "uni-global", "terra-pro"],
    },
    {
      destinationId: "1003",
      companyIds: ["pax", "goassistance", "interassist", "universal", "terrawind", "newtravel"],
      planIds: [],
    },
  ],
}

export async function listPlansCatalog(): Promise<PlansCatalog> {
  await delay()
  return structuredClone(catalog)
}

export async function updatePlanMarkup(
  planId: string,
  markupPercent: number
): Promise<InsurancePlan> {
  await delay(200)
  const plan = catalog.plans.find((p) => p.id === planId)
  if (!plan) throw new Error("Plan no encontrado")
  plan.markupPercent = markupPercent
  return structuredClone(plan)
}

export async function updatePlanActive(planId: string, active: boolean): Promise<InsurancePlan> {
  await delay(200)
  const plan = catalog.plans.find((p) => p.id === planId)
  if (!plan) throw new Error("Plan no encontrado")
  plan.active = active
  return structuredClone(plan)
}

export async function updateCompanyActive(
  companyId: string,
  active: boolean
): Promise<InsuranceCompany> {
  await delay(200)
  const company = catalog.companies.find((c) => c.id === companyId)
  if (!company) throw new Error("Compañía no encontrada")
  company.active = active
  return structuredClone(company)
}

export async function updateDestinationVisibility(
  visibility: DestinationVisibility
): Promise<DestinationVisibility> {
  await delay(250)
  const idx = catalog.visibility.findIndex((v) => v.destinationId === visibility.destinationId)
  if (idx >= 0) {
    catalog.visibility[idx] = structuredClone(visibility)
  } else {
    catalog.visibility.push(structuredClone(visibility))
  }
  return structuredClone(visibility)
}
