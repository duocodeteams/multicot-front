/**
 * Configuración centralizada de la API
 * 
 * Esta configuración centraliza la URL base del backend y proporciona
 * un cliente axios configurado para todas las peticiones.
 */

import axios, { AxiosInstance, AxiosError } from "axios"

/**
 * URL base del backend API
 * Se obtiene de la variable de entorno NEXT_PUBLIC_API_URL
 * Si no está definida, usa un valor por defecto para desarrollo local
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
    // Manejo centralizado de errores
    if (error.response) {
      const status = error.response.status

      // Si el token es inválido o expiró (401), limpiar autenticación
      if (status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_refresh_token")
          localStorage.removeItem("auth_user")
        }

        return Promise.reject(new Error("Credenciales inválidas o sesión expirada. Por favor, inicia sesión nuevamente."))
      }

      // Si es 403 (Forbidden), puede ser por permisos insuficientes
      if (status === 403) {
        const errorMessage =
          (error.response.data as any)?.message ||
          (error.response.data as any)?.detail ||
          (error.response.data as any)?.error ||
          "No tienes permisos para realizar esta acción"
        return Promise.reject(new Error(errorMessage))
      }

      // El servidor respondió con un código de estado fuera del rango 2xx
      const errorMessage =
        (error.response.data as any)?.message ||
        (error.response.data as any)?.detail ||
        (error.response.data as any)?.error ||
        "Error en la petición"
      return Promise.reject(new Error(errorMessage))
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

