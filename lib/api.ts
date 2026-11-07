/**
 * Configuración centralizada de la API
 * 
 * Esta configuración centraliza la URL base del backend y proporciona
 * un cliente axios configurado para todas las peticiones.
 */

import axios, { AxiosInstance, AxiosError } from "axios"
import { clearClientSessionData } from "./clear-client-session"

/** Error de API con el status HTTP, para distinguir 404, 422 y 500 en la UI. */
export class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiRequestError) return error.status
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === "number" ? status : undefined
  }
  return undefined
}

function readApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback

  const body = data as Record<string, unknown>
  for (const key of ["message", "detail", "error"] as const) {
    const value = body[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (!Array.isArray(value)) continue

    const parts = value
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim()
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg
          if (typeof msg === "string" && msg.trim()) return msg.trim()
        }
        return null
      })
      .filter((part): part is string => Boolean(part))

    if (parts.length > 0) return parts.join(". ")
  }

  return fallback
}

/**
 * URL base del backend API
 * Se obtiene de la variable de entorno NEXT_PUBLIC_API_URL
 * Si no está definida, usa un valor por defecto para desarrollo local
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://biantravel.tech/"

/**
 * Cliente axios configurado con la URL base y headers por defecto
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

/**
 * Interceptor para agregar el token de autenticación a las peticiones
 * Agrega automáticamente el token desde localStorage a todas las peticiones
 */
apiClient.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage (solo en el cliente)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Interceptor para manejar errores de forma centralizada
 * También maneja errores 401 (no autorizado) para hacer logout automático
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log de depuración para ver qué responde el back
    if (error.response) {
      console.log("[api] error response:", {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      })
    } else if (error.request) {
      console.log("[api] sin respuesta del servidor:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      })
    }

    // Manejo centralizado de errores
    if (error.response) {
      const status = error.response.status

      // Si el token es inválido o expiró (401), limpiar autenticación y datos de sesión
      if (status === 401) {
        clearClientSessionData()

        return Promise.reject(
          new ApiRequestError(
            "Credenciales inválidas o sesión expirada. Por favor, inicia sesión nuevamente.",
            status
          )
        )
      }

      // Si es 403 (Forbidden), puede ser por permisos insuficientes
      if (status === 403) {
        const errorMessage = readApiErrorMessage(
          error.response.data,
          "No tienes permisos para realizar esta acción"
        )
        return Promise.reject(new ApiRequestError(errorMessage, status))
      }

      // El servidor respondió con un código de estado fuera del rango 2xx
      const errorMessage = readApiErrorMessage(error.response.data, "Error en la petición")
      return Promise.reject(new ApiRequestError(errorMessage, status))
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      return Promise.reject(new Error("No se pudo conectar con el servidor"))
    } else {
      // Algo pasó al configurar la petición
      return Promise.reject(error)
    }
  }
)

/**
 * Función helper para construir rutas completas (mantenida por compatibilidad)
 * @deprecated Usar apiClient directamente es preferible
 */
export function apiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL
  return `${baseUrl}${normalizedEndpoint}`
}

/**
 * Crea headers con autenticación
 * @param token - Token de autenticación
 * @returns Headers con el token incluido
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}
