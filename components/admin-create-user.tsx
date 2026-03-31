"use client"

import { useState, useEffect } from "react"
import { UserPlus, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listAgencies, createSeller } from "@/lib/services"
import type { AgencyResponse, CreateSellerRequest } from "@/lib/services/types"
import { toast } from "sonner"

type UserFormData = {
  nombre: string
  userName: string
  email: string
  password: string
  confirmPassword: string
  role: string
  agenciaId: string
  telefono?: string
  nacionalidad?: string
}

type Agency = {
  id: number
  nombre: string
}

export function AdminCreateUser() {
  const [formData, setFormData] = useState<UserFormData>({
    nombre: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "3", // Por defecto usuario
    agenciaId: "",
    telefono: "",
    nacionalidad: "",
  })
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    setIsLoadingAgencies(true)
    try {
      const response = await listAgencies({ limit: 100, offset: 0 })
      
      // Verificar que haya items
      if (!response.items || response.items.length === 0) {
        toast.info("No hay agencias disponibles", {
          description: "No se encontraron agencias registradas en el sistema",
        })
        setAgencies([])
        return
      }
      
      // Mapear agencias a la estructura esperada
      const mappedAgencies: Agency[] = response.items.map((agency: AgencyResponse) => ({
        id: agency.id,
        nombre: agency.name,
      }))
      
      console.log("Agencias mapeadas para el select:", mappedAgencies)
      setAgencies(mappedAgencies)
    } catch (error: any) {
      toast.error("Error al cargar agencias", {
        description: error.message || "No se pudieron cargar las agencias para asignar al usuario",
      })
      setAgencies([])
    } finally {
      setIsLoadingAgencies(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.userName.trim()) {
      newErrors.userName = "El nombre de usuario es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!formData.role) {
      newErrors.role = "Seleccione un rol"
    }

    if (formData.role !== "1" && !formData.agenciaId) {
      newErrors.agenciaId = "Seleccione una agencia"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }

    // Solo permitir crear vendedores (sellers) según la API
    // Los roles "admin" y "agency" se crean mediante otros endpoints
    if (formData.role === "1") {
      toast.error("No se puede crear administradores", {
        description: "Los administradores deben ser creados directamente en el sistema",
      })
      return
    }

    if (formData.role === "2") {
      toast.error("No se puede crear agencias desde aquí", {
        description: "Las agencias deben ser creadas desde el módulo de creación de agencias",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Separar nombre completo en first_name y last_name
      const nameParts = formData.nombre.trim().split(" ")
      const first_name = nameParts[0] || ""
      const last_name = nameParts.slice(1).join(" ") || ""

      // Construir payload según la estructura de CreateSellerRequest
      const payload: CreateSellerRequest = {
        first_name,
        last_name,
        address: formData.telefono || "", // Usar teléfono como dirección temporal si no hay campo específico
        nationality: formData.nacionalidad || "Argentina",
        birth_date: "1990-01-01", // Fecha por defecto, deberías agregar un campo de fecha de nacimiento
        comments: "",
        ...(formData.agenciaId && { agency_id: parseInt(formData.agenciaId) }),
        user: {
          email: formData.email.trim(),
          password: formData.password,
        },
      }

      await createSeller(payload)
      
      toast.success("Vendedor creado exitosamente", {
        description: `El vendedor "${formData.nombre}" ha sido creado`,
      })

      // Limpiar formulario
      setFormData({
        nombre: "",
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "3",
        agenciaId: "",
        telefono: "",
        nacionalidad: "",
      })
      setErrors({})
    } catch (error: any) {
      toast.error("Error al crear vendedor", {
        description: error.message || "No se pudo crear el vendedor",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Crear Vendedor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registra un nuevo vendedor en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
          <CardDescription>
            Completa los datos del nuevo vendedor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre completo"
                  className={errors.nombre ? "border-destructive" : ""}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">
                  Nombre de Usuario <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => handleChange("userName", e.target.value)}
                  placeholder="usuario123"
                  className={errors.userName ? "border-destructive" : ""}
                />
                {errors.userName && (
                  <p className="text-sm text-destructive">{errors.userName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@ejemplo.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contraseña <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Repite la contraseña"
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">
                  Rol <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" disabled>Administrador (no disponible)</SelectItem>
                    <SelectItem value="2" disabled>Agencia (usar módulo de agencias)</SelectItem>
                    <SelectItem value="3">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenciaId">
                  Agencia {formData.role !== "1" && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.agenciaId}
                  onValueChange={(value) => handleChange("agenciaId", value)}
                  disabled={formData.role === "1" || isLoadingAgencies}
                >
                  <SelectTrigger className={errors.agenciaId ? "border-destructive" : ""}>
                    <SelectValue placeholder={isLoadingAgencies ? "Cargando..." : "Seleccione una agencia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAgencies ? (
                      <SelectItem value="loading" disabled>
                        Cargando agencias...
                      </SelectItem>
                    ) : agencies.length === 0 ? (
                      <SelectItem value="no-agencies" disabled>
                        No hay agencias disponibles
                      </SelectItem>
                    ) : (
                      agencies.map((agency) => {
                        console.log("Renderizando agencia en select:", agency)
                        return (
                          <SelectItem key={agency.id} value={agency.id.toString()}>
                            {agency.nombre}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
                {errors.agenciaId && (
                  <p className="text-sm text-destructive">{errors.agenciaId}</p>
                )}
                {/* Debug: mostrar cantidad de agencias */}
                {process.env.NODE_ENV === "development" && (
                  <p className="text-xs text-muted-foreground">
                    Debug: {agencies.length} agencias cargadas
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nacionalidad">Nacionalidad</Label>
                <Input
                  id="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={(e) => handleChange("nacionalidad", e.target.value)}
                  placeholder="Argentina"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Vendedor
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
