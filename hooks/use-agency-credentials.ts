"use client"

import { useCallback, useEffect, useState } from "react"
import { getApiErrorStatus } from "@/lib/api"
import {
  deleteAgencyCredentials,
  getAgencyCredentials,
  saveAgencyCredentials,
} from "@/lib/services"
import type {
  AgencyCredentialItem,
  SaveAgencyCredentialsRequest,
} from "@/lib/services/types"

export function describeAgencyCredentialsError(
  error: unknown,
  action: "load" | "save" | "delete",
  companyName?: string
): string {
  const status = getApiErrorStatus(error)
  const raw = error instanceof Error ? error.message.trim() : ""
  const company = companyName?.trim() || "esta compañía"

  if (status === 422) return "Faltan campos obligatorios en las credenciales."
  if (status === 500 && /PASSWORD_ENCRYPTION_KEY/i.test(raw)) {
    return "No se pudieron guardar las credenciales: el servidor no tiene configurada la clave de cifrado."
  }
  if (status === 404) {
    if (action === "delete") {
      return `Esta agencia no tiene credenciales propias de ${company}.`
    }
    if (action === "load") return "No se encontró la agencia o está inactiva."
    return `No se pudo guardar la credencial de ${company}.`
  }
  if (status === 403) return "Solo un administrador puede gestionar estas credenciales."
  if (raw) return raw
  if (action === "load") return "No se pudieron cargar las credenciales."
  if (action === "delete") return "No se pudieron restaurar las credenciales del servidor."
  return "No se pudieron guardar las credenciales."
}

type UseAgencyCredentialsResult = {
  items: AgencyCredentialItem[]
  isLoading: boolean
  savingSlug: string | null
  deletingSlug: string | null
  error: string | null
  reload: () => Promise<void>
  saveCredentials: (
    companySlug: string,
    payload: SaveAgencyCredentialsRequest
  ) => Promise<AgencyCredentialItem>
  deleteCredentials: (companySlug: string) => Promise<void>
}

function upsertItem(
  items: AgencyCredentialItem[],
  next: AgencyCredentialItem
): AgencyCredentialItem[] {
  const others = items.filter((item) => item.company_slug !== next.company_slug)
  return [...others, next].sort((a, b) =>
    a.company_name.localeCompare(b.company_name, "es")
  )
}

export function useAgencyCredentials(agencyId: number | null): UseAgencyCredentialsResult {
  const [items, setItems] = useState<AgencyCredentialItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (agencyId == null) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await getAgencyCredentials(agencyId)
      setItems(response.items)
    } catch (loadError) {
      setItems([])
      setError(describeAgencyCredentialsError(loadError, "load"))
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [agencyId])

  useEffect(() => {
    setItems([])
    setError(null)
    if (agencyId == null) return

    let cancelled = false
    setIsLoading(true)

    getAgencyCredentials(agencyId)
      .then((response) => {
        if (cancelled) return
        setItems(response.items)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setItems([])
        setError(describeAgencyCredentialsError(loadError, "load"))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [agencyId])

  const saveCredentials = useCallback(
    async (companySlug: string, payload: SaveAgencyCredentialsRequest) => {
      if (agencyId == null) {
        throw new Error("No hay una agencia seleccionada")
      }

      setSavingSlug(companySlug)
      try {
        const item = await saveAgencyCredentials(agencyId, companySlug, payload)
        setItems((current) => upsertItem(current, item))
        setError(null)
        return item
      } finally {
        setSavingSlug(null)
      }
    },
    [agencyId]
  )

  const deleteCredentials = useCallback(
    async (companySlug: string) => {
      if (agencyId == null) {
        throw new Error("No hay una agencia seleccionada")
      }

      setDeletingSlug(companySlug)
      try {
        await deleteAgencyCredentials(agencyId, companySlug)
        setItems((current) =>
          upsertItem(current, {
            company_slug: companySlug,
            company_name:
              current.find((item) => item.company_slug === companySlug)?.company_name ||
              companySlug,
            uses_default: true,
            credentials: null,
          })
        )
        setError(null)
      } finally {
        setDeletingSlug(null)
      }
    },
    [agencyId]
  )

  return {
    items,
    isLoading,
    savingSlug,
    deletingSlug,
    error,
    reload,
    saveCredentials,
    deleteCredentials,
  }
}
