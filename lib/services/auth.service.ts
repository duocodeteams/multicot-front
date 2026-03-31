/**
 * Servicio de Autenticación
 * Endpoints relacionados con autenticación y sesión
 */

import { apiClient } from "../api"
import type { LoginRequest, LoginResponse, HealthCheckResponse } from "./types"

/**
 * Health Check
 * Verifica el estado del servidor
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await apiClient.get<HealthCheckResponse>("/health")
  return response.data
}

/**
 * Login
 * Inicia sesión y obtiene un token de acceso
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/v1/auth/login", credentials)
  return response.data
}
