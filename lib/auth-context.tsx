"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { apiClient } from "./api"

type User = {
  id: number
  nombre: string
  email: string
  userName: string
  role: number
  agenciaId: number
  telefono?: string
  nacionalidad?: string
  comision?: string
  metodoPago?: string
  foto?: string | null
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean // Indica si se está cargando la sesión desde localStorage
  loginResponse: any | null // Respuesta completa del backend
  token: string | null
  login: (userName: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Claves para localStorage
const AUTH_TOKEN_KEY = "auth_token"
const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token"
const AUTH_USER_KEY = "auth_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loginResponse, setLoginResponse] = useState<any | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Recuperar datos de autenticación al cargar la app
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      const savedUser = localStorage.getItem(AUTH_USER_KEY)
      
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setToken(savedToken)
          setUser(parsedUser)
        } catch (error) {
          console.error("Error al recuperar datos de autenticación:", error)
          // Limpiar datos corruptos
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
        }
      }
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (userName: string, password: string): Promise<boolean> => {
    try {
      const { data } = await apiClient.post("/users/login", {
        userName,
        password,
      })
      
      // Guardar la respuesta completa del backend
      setLoginResponse(data)
      
      // Extraer token de la respuesta
      const authToken = data.token
      
      if (!authToken) {
        throw new Error("El backend no devolvió un token en la respuesta")
      }
      
      // Guardar token en localStorage y estado
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, authToken)
        setToken(authToken)
        
        // Si hay refresh token, también guardarlo
        const refreshToken = data.refreshToken || data.refresh_token
        if (refreshToken) {
          localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken)
        }
      }
      
      // Extraer y guardar datos del usuario de la respuesta
      // La estructura del backend es: data.user contiene los datos del usuario
      if (!data.user) {
        throw new Error("El backend no devolvió datos del usuario")
      }
      
      const userData: User = {
        id: data.user.id,
        nombre: data.user.nombre,
        email: data.user.email,
        userName: data.user.userName,
        role: data.user.role,
        agenciaId: data.user.agenciaId,
        telefono: data.user.telefono,
        nacionalidad: data.user.nacionalidad,
        comision: data.user.comision,
        metodoPago: data.user.metodoPago,
        foto: data.user.foto,
      }
      
      setUser(userData)
      
      // Guardar usuario en localStorage para persistencia
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
      }

      return true
    } catch (error: any) {
      console.error("Error en login:", error)
      // Re-lanzar el error para que el componente pueda manejarlo
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Obtener userId y token antes de limpiar el estado
      const currentUser = user
      const currentToken = token

      // Si hay usuario y token, hacer logout en el backend
      if (currentUser?.id && currentToken) {
        try {
          await apiClient.put(`/users/logout?userId=${currentUser.id}`)
        } catch (error: any) {
          // Si falla el logout en el backend, igualmente limpiar la sesión local
          console.error("Error al hacer logout en el backend:", error)
          // Continuar con la limpieza local
        }
      }
    } catch (error: any) {
      console.error("Error en logout:", error)
      // Continuar con la limpieza local incluso si hay error
    } finally {
      // Siempre limpiar estado y localStorage
      setUser(null)
      setLoginResponse(null)
      setToken(null)
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }
  }, [user, token])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!token,
        isLoading,
        loginResponse,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
