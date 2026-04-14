"use client"

import { useState, useEffect } from "react"
import { Users, Building2, Search, RefreshCw, Eye, EyeOff, KeyRound, Mail, User, Shield, Globe, Percent, Calendar, MapPin, FileText, Phone, CreditCard, Landmark, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { listAgencies, listSellers, adminChangeUserPassword } from "@/lib/services"
import type { AgencyResponse, SellerResponse } from "@/lib/services/types"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type User = {
  id: number
  nombre: string
  email: string
  userName: string
  role: string
  agenciaId: number | null
  telefono?: string
  nacionalidad?: string
  password?: string
  raw: SellerResponse
}

type Agency = {
  id: number
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  password?: string
  raw: AgencyResponse
}

type PasswordTarget = {
  entityType: "seller" | "agency"
  entityName: string
  userEmail?: string
}

export function AdminUsersAgencies() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
  const [searchUsers, setSearchUsers] = useState("")
  const [searchAgencies, setSearchAgencies] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [showSellerPassword, setShowSellerPassword] = useState(false)
  const [showAgencyPassword, setShowAgencyPassword] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<PasswordTarget | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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
      console.log("[AdminUsersAgencies] Respuesta cruda listSellers:", response)
      console.log("[AdminUsersAgencies] Primer seller:", response.items?.[0])
      
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
        password: seller.user.password, // Mostrar contraseña si viene
        raw: seller,
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
      console.log("[AdminUsersAgencies] Respuesta cruda listAgencies:", response)
      console.log("[AdminUsersAgencies] Primera agencia:", response.items?.[0])
      
      // Mapear agencias a la estructura esperada
      const mappedAgencies: Agency[] = response.items.map((agency: AgencyResponse) => ({
        id: agency.id,
        nombre: agency.name,
        email: agency.agency_email,
        telefono: agency.office_phone,
        direccion: agency.address,
        raw: agency,
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
  const agencyNameById = new Map(agencies.map((agency) => [agency.id, agency.nombre]))

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

  const formatCommission = (commission?: string | number | null) => {
    if (commission === null || commission === undefined || commission === "") return "N/A"
    const value = String(commission)
    return value.includes("%") ? value : `${value}%`
  }

  const formatCatalogValue = (value?: string | null, catalog?: Record<string, string>) => {
    if (!value) return "N/A"
    return catalog?.[value] || value
  }

  const getOptionalPassword = (user: unknown): string | null => {
    if (!user || typeof user !== "object" || !("password" in user)) return null
    const password = (user as { password?: unknown }).password
    return typeof password === "string" && password.length > 0 ? password : null
  }

  const openChangePasswordModal = (target: PasswordTarget) => {
    setPasswordTarget(target)
    setNewPassword("")
    setConfirmNewPassword("")
  }

  const closeChangePasswordModal = () => {
    setPasswordTarget(null)
    setNewPassword("")
    setConfirmNewPassword("")
    setIsChangingPassword(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordTarget) return
    if (!newPassword || newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsChangingPassword(true)
    try {
      // Obtener el token del admin
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        toast.error("Sesión expirada", { description: "Por favor, inicia sesión nuevamente" })
        setIsChangingPassword(false)
        return
      }
      // Obtener el userId correcto
      let userId: number | undefined
      if (passwordTarget.entityType === "seller") {
        const userObj = users.find(u => u.email === passwordTarget.userEmail)
        userId = userObj?.raw.user.id
      } else if (passwordTarget.entityType === "agency") {
        const agencyObj = agencies.find(a => a.email === passwordTarget.userEmail)
        userId = agencyObj?.raw.user?.id
      }
      if (!userId) {
        toast.error("No se pudo determinar el usuario a modificar")
        setIsChangingPassword(false)
        return
      }
      await adminChangeUserPassword(userId, newPassword, token)
      toast.success("Contraseña actualizada correctamente", {
        description: `Se cambió la contraseña de ${passwordTarget.entityName}.`,
      })
      // Refrescar la lista correspondiente
      if (passwordTarget.entityType === "seller") {
        await fetchUsers()
      } else if (passwordTarget.entityType === "agency") {
        await fetchAgencies()
      }
      closeChangePasswordModal()
    } catch (err: any) {
      toast.error("No se pudo cambiar la contraseña", { description: err.message })
      setIsChangingPassword(false)
    }
  }

  return (
    <TooltipProvider>
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Nacionalidad</TableHead>
                      <TableHead className="w-[120px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.nombre}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.agenciaId ? agencyNameById.get(user.agenciaId) || `Agencia #${user.agenciaId}` : "Independiente"}
                        </TableCell>
                        <TableCell>{user.nacionalidad || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openChangePasswordModal({
                                      entityType: "seller",
                                      entityName: user.nombre,
                                      userEmail: user.raw.user.email,
                                    })
                                  }
                                  aria-label={`Cambiar contraseña de ${user.nombre}`}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cambiar contraseña</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedUser(user)}
                                  aria-label={`Ver detalle de ${user.nombre}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
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
                      <TableHead className="w-[120px] text-right">Acciones</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openChangePasswordModal({
                                      entityType: "agency",
                                      entityName: agency.nombre,
                                      userEmail: agency.raw.user?.email,
                                    })
                                  }
                                  aria-label={`Cambiar contraseña de ${agency.nombre}`}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cambiar contraseña</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedAgency(agency)}
                                  aria-label={`Ver detalle de ${agency.nombre}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
            setShowSellerPassword(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del vendedor</DialogTitle>
            <DialogDescription>
              Información completa del vendedor seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Nombre:</span> {selectedUser.raw.first_name}</span></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Apellido:</span> {selectedUser.raw.last_name}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Email:</span> {selectedUser.raw.user.email}</span></div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Rol:</span> {selectedUser.raw.user.role}</span></div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Contraseña:</span>
                <span className="font-mono">
                  {selectedUser.password ? (showSellerPassword ? selectedUser.password : "••••••••") : "No disponible"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowSellerPassword((v) => !v)}
                  disabled={!selectedUser.password}
                  aria-label={showSellerPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showSellerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div>
                <span className="font-semibold">Agencia:</span>{" "}
                {selectedUser.raw.agency_id
                  ? agencyNameById.get(selectedUser.raw.agency_id) || `Agencia #${selectedUser.raw.agency_id}`
                  : "Independiente"}
              </div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Nacionalidad:</span> {selectedUser.raw.nationality || "N/A"}</span></div>
              <div className="flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Comisión:</span> {formatCommission(selectedUser.raw.commission)}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Fecha de nacimiento:</span> {selectedUser.raw.birth_date || "N/A"}</span></div>
              <div className="sm:col-span-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /><span><span className="font-semibold">Dirección:</span> {selectedUser.raw.address || "N/A"}</span></div>
              <div className="sm:col-span-2 flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" /><span><span className="font-semibold">Comentarios:</span> {selectedUser.raw.comments || "N/A"}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedAgency}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAgency(null)
            setShowAgencyPassword(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de la agencia</DialogTitle>
            <DialogDescription>
              Información completa de la agencia seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedAgency && (
            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              <section className="rounded-lg border p-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />Datos generales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span className="font-semibold">Nombre:</span> {selectedAgency.raw.name}</div>
                  <div><span className="font-semibold">Razón social:</span> {selectedAgency.raw.legal_name || "N/A"}</div>
                  <div><span className="font-semibold">País:</span> {selectedAgency.raw.country || "N/A"}</div>
                  <div><span className="font-semibold">Fecha activación:</span> {selectedAgency.raw.activation_date || "N/A"}</div>
                  <div className="sm:col-span-2"><span className="font-semibold">Dirección:</span> {selectedAgency.raw.address || "N/A"}</div>
                </div>
              </section>

              <section className="rounded-lg border p-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Datos fiscales y legales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span className="font-semibold">CUIT/CUIL:</span> {selectedAgency.raw.tax_id || "N/A"}</div>
                  <div><span className="font-semibold">Representante legal:</span> {selectedAgency.raw.legal_representative_name || "N/A"}</div>
                  <div>
                    <span className="font-semibold">Condición fiscal:</span>{" "}
                    {formatCatalogValue(selectedAgency.raw.tax_condition, {
                      responsable_inscripto: "Responsable Inscripto",
                      monotributo: "Monotributo",
                      exento: "Exento",
                      consumidor_final: "Consumidor Final",
                    })}
                  </div>
                  <div><span className="font-semibold">Registro SSN:</span> {selectedAgency.raw.ssn_register || "N/A"}</div>
                </div>
              </section>

              <section className="rounded-lg border p-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Contacto</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Email agencia:</span> {selectedAgency.raw.agency_email || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Teléfono oficina:</span> {selectedAgency.raw.office_phone || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Email administración:</span> {selectedAgency.raw.administration_email || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Contacto:</span> {selectedAgency.raw.contact_name || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Email contacto:</span> {selectedAgency.raw.contact_email || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Teléfono contacto:</span> {selectedAgency.raw.contact_phone || "N/A"}</span></div>
                </div>
              </section>

              <section className="rounded-lg border p-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Facturación y pagos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Frecuencia facturación:</span>{" "}
                    {formatCatalogValue(selectedAgency.raw.billing_frequency, {
                      monthly: "Mensual",
                      quarterly: "Trimestral",
                      yearly: "Anual",
                    })}
                  </div>
                  <div>
                    <span className="font-semibold">Método de pago:</span>{" "}
                    {formatCatalogValue(selectedAgency.raw.payment_method, {
                      transfer: "Transferencia",
                      credit_card: "Tarjeta de crédito",
                      debit: "Débito",
                      check: "Cheque",
                    })}
                  </div>
                  <div className="flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Comisión:</span> {formatCommission(selectedAgency.raw.commission)}</span></div>
                  <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Cuenta bancaria:</span> {selectedAgency.raw.bank_account || "N/A"}</span></div>
                </div>
              </section>

              <section className="rounded-lg border p-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Usuario asociado</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Usuario email:</span> {selectedAgency.raw.user?.email || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span><span className="font-semibold">Usuario rol:</span> {selectedAgency.raw.user?.role || "N/A"}</span></div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Contraseña:</span>
                    <span className="font-mono">
                      {(selectedAgency.raw.user as any)?.password ? (showAgencyPassword ? (selectedAgency.raw.user as any).password : "••••••••") : "No disponible"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowAgencyPassword((v) => !v)}
                      disabled={!((selectedAgency.raw.user as any)?.password)}
                      aria-label={showAgencyPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showAgencyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordTarget} onOpenChange={(open) => !open && closeChangePasswordModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              {passwordTarget
                ? `Vas a cambiar la contraseña de ${passwordTarget.entityType === "seller" ? "vendedor" : "agencia"}: ${passwordTarget.entityName}.`
                : "Definí una nueva contraseña."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordTarget?.userEmail && (
              <p className="text-xs text-muted-foreground">
                Usuario asociado: <span className="font-medium">{passwordTarget.userEmail}</span>
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar nueva contraseña</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                autoComplete="new-password"
                disabled={isChangingPassword}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeChangePasswordModal} disabled={isChangingPassword}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Guardando..." : "Guardar cambio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}
