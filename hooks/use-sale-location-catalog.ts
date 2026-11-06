"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getSaleCountries, getSaleProvinces } from "@/lib/services"
import type { SaleCatalogItem, SaleCompanySlug } from "@/lib/issuance/sales-types"

function getApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Ocurrió un error"
}

/**
 * Catálogo país/provincia para el formulario de pasajeros.
 * Cambia solo el prefijo de API según company (omint | inter_assist).
 */
export function useSaleLocationCatalog(
  company: SaleCompanySlug,
  countryId: string
) {
  const [countries, setCountries] = useState<SaleCatalogItem[]>([])
  const [provinces, setProvinces] = useState<SaleCatalogItem[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingProvinces, setLoadingProvinces] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadCountries() {
      setLoadingCountries(true)
      try {
        const items = await getSaleCountries(company)
        if (!cancelled) setCountries(items)
      } catch (err) {
        if (!cancelled) {
          setCountries([])
          toast.error("No se pudieron cargar los países", {
            description: getApiErrorMessage(err),
          })
        }
      } finally {
        if (!cancelled) setLoadingCountries(false)
      }
    }
    void loadCountries()
    return () => {
      cancelled = true
    }
  }, [company])

  useEffect(() => {
    if (!countryId) {
      setProvinces([])
      setLoadingProvinces(false)
      return
    }
    let cancelled = false
    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const items = await getSaleProvinces(countryId, company)
        if (!cancelled) setProvinces(items)
      } catch (err) {
        if (!cancelled) {
          setProvinces([])
          toast.error("No se pudieron cargar las provincias", {
            description: getApiErrorMessage(err),
          })
        }
      } finally {
        if (!cancelled) setLoadingProvinces(false)
      }
    }
    void loadProvinces()
    return () => {
      cancelled = true
    }
  }, [company, countryId])

  const provinceRequired =
    company === "omint" || countryId === "AR" || provinces.length > 0

  return {
    countries,
    provinces,
    loadingCountries,
    loadingProvinces,
    provinceRequired,
  }
}
