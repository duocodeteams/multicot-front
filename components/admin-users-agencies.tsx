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
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type User = {
  id: number
  nombre: string
  email: string
  userName: string
  role: number
  agenciaId: number
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
  const [users, setUsers] = useState<User[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
  const [searchUsers, setSearchUsers] = useState("")
  const [searchAgencies, setSearchAgencies] = useState("")

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const { data } = await apiClient.get("/users")
      setUsers(data || [])
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error)
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los usuarios",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchAgencies = async () => {
    setIsLoadingAgencies(true)
    try {
      const { data } = await apiClient.get("/agencias")
      setAgencies(data || [])
    } catch (error: any) {
      console.error("Error al cargar agencias:", error)
      toast.error("Error al cargar agencias", {
        description: error.message || "No se pudieron cargar las agencias",
      })
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
      user.userName.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.nombre.toLowerCase().includes(searchAgencies.toLowerCase()) ||
      (agency.email && agency.email.toLowerCase().includes(searchAgencies.toLowerCase()))
  )

  const getRoleLabel = (role: number) => {
    switch (role) {
      case 1:
        return "Admin"
      case 2:
        return "Agencia"
      case 3:
        return "Usuario"
      default:
        return `Rol ${role}`
    }
  }

  const getRoleBadgeVariant = (role: number) => {
    switch (role) {
      case 1:
        return "destructive"
      case 2:
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Usuarios y Agencias</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona usuarios y agencias del sistema
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
            Usuarios ({users.length})
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
                <CardTitle>Usuarios</CardTitle>
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
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
                  {searchUsers ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Agencia ID</TableHead>
                      <TableHead>Teléfono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.nombre}</TableCell>
                        <TableCell>{user.userName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.agenciaId || "N/A"}</TableCell>
                        <TableCell>{user.telefono || "N/A"}</TableCell>
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
