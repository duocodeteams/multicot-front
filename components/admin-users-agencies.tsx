"use client"

import { useState, useEffect } from "react"
import { Users, Building2, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { listAgencies, listSellers } from "@/lib/services"
import type { AgencyResponse, SellerResponse } from "@/lib/services/types"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type User = {
  id: number
  nombre: string
  email: string
  userName: string
  role: string
  agenciaId: number | null
  telefono?: string
  nacionalidad?: string
}

type Agency = {
  id: number
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
}

export function AdminUsersAgencies() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
  const [searchUsers, setSearchUsers] = useState("")
  const [searchAgencies, setSearchAgencies] = useState("")

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      // Verificar que el usuario tenga permisos de admin
      if (user?.role !== "admin") {
        toast.error("Acceso denegado", {
          description: "Solo los administradores pueden ver esta información",
        })
        setIsLoadingUsers(false)
        return
      }

      // Verificar que haya token
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        toast.error("Sesión expirada", {
          description: "Por favor, inicia sesión nuevamente",
        })
        setIsLoadingUsers(false)
        return
      }
      
      // Usar listSellers ya que no hay endpoint de usuarios generales
      const response = await listSellers({ limit: 100, offset: 0 })
      
      // Mapear sellers a la estructura de usuarios
      const mappedUsers: User[] = response.items.map((seller: SellerResponse) => ({
        id: seller.id,
        nombre: `${seller.first_name} ${seller.last_name}`,
        email: seller.user.email,
        userName: seller.user.email.split("@")[0], // Usar parte del email como username
        role: seller.user.role,
        agenciaId: seller.agency_id,
        telefono: undefined, // No viene en la respuesta
        nacionalidad: seller.nationality,
      }))
      
      setUsers(mappedUsers)
    } catch (error: any) {
      if (error.message?.includes("permisos") || error.message?.includes("403")) {
        toast.error("Acceso denegado", {
          description: "No tienes permisos para ver esta información. Se requiere rol de administrador.",
        })
      } else {
        toast.error("Error al cargar vendedores", {
          description: error.message || "No se pudieron cargar los vendedores",
        })
      }
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchAgencies = async () => {
    setIsLoadingAgencies(true)
    try {
      // Verificar que el usuario tenga permisos de admin
      if (user?.role !== "admin") {
        toast.error("Acceso denegado", {
          description: "Solo los administradores pueden ver esta información",
        })
        setIsLoadingAgencies(false)
        return
      }

      // Verificar que haya token
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        toast.error("Sesión expirada", {
          description: "Por favor, inicia sesión nuevamente",
        })
        setIsLoadingAgencies(false)
        return
      }
      
      const response = await listAgencies({ limit: 100, offset: 0 })
      
      // Mapear agencias a la estructura esperada
      const mappedAgencies: Agency[] = response.items.map((agency: AgencyResponse) => ({
        id: agency.id,
        nombre: agency.name,
        email: agency.agency_email,
        telefono: agency.office_phone,
        direccion: agency.address,
      }))
      
      setAgencies(mappedAgencies)
    } catch (error: any) {
      if (error.message?.includes("permisos") || error.message?.includes("403")) {
        toast.error("Acceso denegado", {
          description: "No tienes permisos para ver esta información. Se requiere rol de administrador.",
        })
      } else {
        toast.error("Error al cargar agencias", {
          description: error.message || "No se pudieron cargar las agencias",
        })
      }
    } finally {
      setIsLoadingAgencies(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchAgencies()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
      (user.nacionalidad && user.nacionalidad.toLowerCase().includes(searchUsers.toLowerCase()))
  )

  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.nombre.toLowerCase().includes(searchAgencies.toLowerCase()) ||
      (agency.email && agency.email.toLowerCase().includes(searchAgencies.toLowerCase()))
  )

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "Admin"
      case "agency":
        return "Agencia"
      case "seller":
        return "Vendedor"
      default:
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive"
      case "agency":
        return "default"
      case "seller":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendedores y Agencias</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona vendedores y agencias del sistema
          </p>
        </div>
        <Button onClick={() => { fetchUsers(); fetchAgencies(); }} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Vendedores ({users.length})
          </TabsTrigger>
          <TabsTrigger value="agencies">
            <Building2 className="h-4 w-4 mr-2" />
            Agencias ({agencies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>Vendedores</CardTitle>
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar vendedores..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchUsers ? "No se encontraron vendedores" : "No hay vendedores registrados"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Agencia ID</TableHead>
                      <TableHead>Nacionalidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.nombre}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.agenciaId || "Independiente"}</TableCell>
                        <TableCell>{user.nacionalidad || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>Agencias</CardTitle>
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar agencias..."
                      value={searchAgencies}
                      onChange={(e) => setSearchAgencies(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAgencies ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredAgencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchAgencies ? "No se encontraron agencias" : "No hay agencias registradas"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgencies.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell className="font-medium">{agency.id}</TableCell>
                        <TableCell>{agency.nombre}</TableCell>
                        <TableCell>{agency.email || "N/A"}</TableCell>
                        <TableCell>{agency.telefono || "N/A"}</TableCell>
                        <TableCell>{agency.direccion || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
