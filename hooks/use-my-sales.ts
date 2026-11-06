"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { listMySales, type MySaleListItem } from "@/lib/services"

export function useMySales() {
  const { user } = useAuth()
  const [items, setItems] = useState<MySaleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listMySales({ userId: user?.id })
      setItems(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar tus ventas"
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}
