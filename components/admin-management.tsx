"use client"

import { useState, useEffect } from "react"
import { Settings, BarChart3, Activity, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

type SystemStats = {
  totalUsers: number
  totalAgencies: number
  activeUsers: number
  totalQuotations: number
}

export function AdminManagement() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Intentar obtener estadísticas del sistema
      // Nota: Estos endpoints pueden necesitar ser ajustados según tu backend
      const [usersRes, agenciesRes] = await Promise.all([
        apiClient.get("/users").catch(() => ({ data: [] })),
        apiClient.get("/agencias").catch(() => ({ data: [] })),
      ])

      const users = usersRes.data || []
      const agencies = agenciesRes.data || []

      setStats({
        totalUsers: users.length,
        totalAgencies: agencies.length,
        activeUsers: users.filter((u: any) => u.role !== "admin" && u.role !== 1).length, // Usuarios no admin
        totalQuotations: 0, // Esto requeriría un endpoint específico
      })
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error)
      toast.error("Error al cargar estadísticas", {
        description: "No se pudieron cargar las estadísticas del sistema",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestiones de Administrador</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de control y estadísticas del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalAgencies || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Agencias activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Excluyendo administradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalQuotations || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total de cotizaciones
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiones comunes del administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Gestión de Usuarios</p>
                <p className="text-xs text-muted-foreground">
                  Ver, crear y editar usuarios
                </p>
              </div>
              <Badge variant="outline">Disponible</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Gestión de Agencias</p>
                <p className="text-xs text-muted-foreground">
                  Ver, crear y editar agencias
                </p>
              </div>
              <Badge variant="outline">Disponible</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Reportes</p>
                <p className="text-xs text-muted-foreground">
                  Generar reportes del sistema
                </p>
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
            <CardDescription>
              Estado y configuración general
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Versión del Sistema</span>
              <Badge>v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant="default" className="bg-green-500">
                Operativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Última Actualización</span>
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString("es-AR")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
