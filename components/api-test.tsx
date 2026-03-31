"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  healthCheck,
  login,
  createQuote,
  listAgencies,
  getAgencyById,
  createAgency,
  listSellers,
  getSellerById,
  createSeller,
} from "@/lib/services"
import type { LoginRequest, CreateQuoteRequest, CreateAgencyRequest, CreateSellerRequest } from "@/lib/services/types"

export function ApiTest() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<string>("")

  // Health Check
  const handleHealthCheck = async () => {
    setLoading("health")
    setResult("")
    try {
      const response = await healthCheck()
      setResult(JSON.stringify(response, null, 2))
      toast.success("Health check exitoso")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error en health check")
    } finally {
      setLoading(null)
    }
  }

  // Login
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: "",
    password: "",
  })

  const handleLogin = async () => {
    setLoading("login")
    setResult("")
    try {
      const response = await login(loginData)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Login exitoso")
      // Guardar token manualmente si es necesario
      if (response.access_token && typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token)
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error en login")
    } finally {
      setLoading(null)
    }
  }

  // Create Quote
  const [quoteData, setQuoteData] = useState<CreateQuoteRequest>({
    departure_date: "",
    return_date: "",
    ages: [],
    origin: "AR",
    destination_id: 1,
    trip_type: "unico_viaje",
  })

  const handleCreateQuote = async () => {
    setLoading("quote")
    setResult("")
    try {
      const response = await createQuote(quoteData)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Cotización creada exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al crear cotización")
    } finally {
      setLoading(null)
    }
  }

  // List Agencies
  const handleListAgencies = async () => {
    setLoading("listAgencies")
    setResult("")
    try {
      const response = await listAgencies({ limit: 10, offset: 0 })
      setResult(JSON.stringify(response, null, 2))
      toast.success("Agencias obtenidas exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al listar agencias")
    } finally {
      setLoading(null)
    }
  }

  // Get Agency by ID
  const [agencyId, setAgencyId] = useState<string>("")
  const handleGetAgency = async () => {
    setLoading("getAgency")
    setResult("")
    try {
      const id = parseInt(agencyId)
      if (isNaN(id)) {
        throw new Error("ID debe ser un número")
      }
      const response = await getAgencyById(id)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Agencia obtenida exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al obtener agencia")
    } finally {
      setLoading(null)
    }
  }

  // Create Agency
  const [agencyData, setAgencyData] = useState<Partial<CreateAgencyRequest>>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    country: "AR",
    legal_representative_name: "",
    agency_email: "",
    office_phone: "",
    activation_date: "",
    billing_frequency: "monthly",
    payment_method: "transfer",
    tax_condition: "responsable_inscripto",
    user: {
      email: "",
      password: "",
    },
  })

  const handleCreateAgency = async () => {
    setLoading("createAgency")
    setResult("")
    try {
      const data = agencyData as CreateAgencyRequest
      if (!data.name || !data.legal_name || !data.tax_id || !data.address || 
          !data.legal_representative_name || !data.agency_email || !data.office_phone ||
          !data.activation_date || !data.user?.email || !data.user?.password) {
        throw new Error("Todos los campos requeridos deben estar completos")
      }
      const response = await createAgency(data)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Agencia creada exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al crear agencia")
    } finally {
      setLoading(null)
    }
  }

  // List Sellers
  const handleListSellers = async () => {
    setLoading("listSellers")
    setResult("")
    try {
      const response = await listSellers({ limit: 10, offset: 0 })
      setResult(JSON.stringify(response, null, 2))
      toast.success("Vendedores obtenidos exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al listar vendedores")
    } finally {
      setLoading(null)
    }
  }

  // Get Seller by ID
  const [sellerId, setSellerId] = useState<string>("")
  const handleGetSeller = async () => {
    setLoading("getSeller")
    setResult("")
    try {
      const id = parseInt(sellerId)
      if (isNaN(id)) {
        throw new Error("ID debe ser un número")
      }
      const response = await getSellerById(id)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Vendedor obtenido exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al obtener vendedor")
    } finally {
      setLoading(null)
    }
  }

  // Create Seller
  const [sellerData, setSellerData] = useState<Partial<CreateSellerRequest>>({
    first_name: "",
    last_name: "",
    address: "",
    nationality: "",
    birth_date: "",
    user: {
      email: "",
      password: "",
    },
  })

  const handleCreateSeller = async () => {
    setLoading("createSeller")
    setResult("")
    try {
      const data = sellerData as CreateSellerRequest
      if (!data.first_name || !data.last_name || !data.address || 
          !data.nationality || !data.birth_date || !data.user?.email || !data.user?.password) {
        throw new Error("Todos los campos requeridos deben estar completos")
      }
      const response = await createSeller(data)
      setResult(JSON.stringify(response, null, 2))
      toast.success("Vendedor creado exitosamente")
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast.error("Error al crear vendedor")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Endpoints API</CardTitle>
          <CardDescription>
            Prueba los endpoints del backend uno por uno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
              <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
              <TabsTrigger value="agencies">Agencias</TabsTrigger>
              <TabsTrigger value="sellers">Vendedores</TabsTrigger>
            </TabsList>

            {/* Health Check */}
            <TabsContent value="health" className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={handleHealthCheck} 
                  disabled={loading === "health"}
                >
                  {loading === "health" ? "Probando..." : "Health Check"}
                </Button>
              </div>
            </TabsContent>

            {/* Auth */}
            <TabsContent value="auth" className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="contraseña123"
                />
              </div>
              <Button onClick={handleLogin} disabled={loading === "login"}>
                {loading === "login" ? "Iniciando sesión..." : "Login"}
              </Button>
            </TabsContent>

            {/* Quotes */}
            <TabsContent value="quotes" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Ida (YYYY-MM-DD)</Label>
                  <Input
                    type="date"
                    value={quoteData.departure_date}
                    onChange={(e) => setQuoteData({ ...quoteData, departure_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Vuelta (YYYY-MM-DD)</Label>
                  <Input
                    type="date"
                    value={quoteData.return_date}
                    onChange={(e) => setQuoteData({ ...quoteData, return_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Edades (separadas por comas)</Label>
                <Input
                  value={quoteData.ages.join(",")}
                  onChange={(e) => {
                    const ages = e.target.value.split(",").map(a => parseInt(a.trim())).filter(a => !isNaN(a))
                    setQuoteData({ ...quoteData, ages })
                  }}
                  placeholder="30, 28"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origen</Label>
                  <Input
                    value={quoteData.origin}
                    onChange={(e) => setQuoteData({ ...quoteData, origin: e.target.value })}
                    placeholder="AR"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destino ID (1-5)</Label>
                  <Input
                    type="number"
                    value={quoteData.destination_id}
                    onChange={(e) => setQuoteData({ ...quoteData, destination_id: parseInt(e.target.value) as any })}
                    min={1}
                    max={5}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Viaje</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={quoteData.trip_type}
                  onChange={(e) => setQuoteData({ ...quoteData, trip_type: e.target.value as any })}
                >
                  <option value="unico_viaje">Único Viaje</option>
                  <option value="multiviaje">Multiviaje</option>
                  <option value="larga_estadia">Larga Estadía</option>
                </select>
              </div>
              <Button onClick={handleCreateQuote} disabled={loading === "quote"}>
                {loading === "quote" ? "Creando cotización..." : "Crear Cotización"}
              </Button>
            </TabsContent>

            {/* Agencies */}
            <TabsContent value="agencies" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button onClick={handleListAgencies} disabled={loading === "listAgencies"}>
                    {loading === "listAgencies" ? "Cargando..." : "Listar Agencias"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    placeholder="ID de agencia"
                  />
                  <Button onClick={handleGetAgency} disabled={loading === "getAgency"}>
                    {loading === "getAgency" ? "Cargando..." : "Obtener Agencia"}
                  </Button>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Crear Nueva Agencia</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={agencyData.name || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Razón Social</Label>
                      <Input
                        value={agencyData.legal_name || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, legal_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CUIT</Label>
                      <Input
                        value={agencyData.tax_id || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, tax_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input
                        value={agencyData.address || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>País</Label>
                      <Input
                        value={agencyData.country || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Representante Legal</Label>
                      <Input
                        value={agencyData.legal_representative_name || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, legal_representative_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Agencia</Label>
                      <Input
                        type="email"
                        value={agencyData.agency_email || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, agency_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={agencyData.office_phone || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, office_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Activación (YYYY-MM-DD)</Label>
                      <Input
                        type="date"
                        value={agencyData.activation_date || ""}
                        onChange={(e) => setAgencyData({ ...agencyData, activation_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Usuario</Label>
                      <Input
                        type="email"
                        value={agencyData.user?.email || ""}
                        onChange={(e) => setAgencyData({ 
                          ...agencyData, 
                          user: { ...agencyData.user!, email: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña Usuario</Label>
                      <Input
                        type="password"
                        value={agencyData.user?.password || ""}
                        onChange={(e) => setAgencyData({ 
                          ...agencyData, 
                          user: { ...agencyData.user!, password: e.target.value } 
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateAgency} disabled={loading === "createAgency"}>
                    {loading === "createAgency" ? "Creando..." : "Crear Agencia"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Sellers */}
            <TabsContent value="sellers" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button onClick={handleListSellers} disabled={loading === "listSellers"}>
                    {loading === "listSellers" ? "Cargando..." : "Listar Vendedores"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    placeholder="ID de vendedor"
                  />
                  <Button onClick={handleGetSeller} disabled={loading === "getSeller"}>
                    {loading === "getSeller" ? "Cargando..." : "Obtener Vendedor"}
                  </Button>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Crear Nuevo Vendedor</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={sellerData.first_name || ""}
                        onChange={(e) => setSellerData({ ...sellerData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido</Label>
                      <Input
                        value={sellerData.last_name || ""}
                        onChange={(e) => setSellerData({ ...sellerData, last_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input
                        value={sellerData.address || ""}
                        onChange={(e) => setSellerData({ ...sellerData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nacionalidad</Label>
                      <Input
                        value={sellerData.nationality || ""}
                        onChange={(e) => setSellerData({ ...sellerData, nationality: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Nacimiento (YYYY-MM-DD)</Label>
                      <Input
                        type="date"
                        value={sellerData.birth_date || ""}
                        onChange={(e) => setSellerData({ ...sellerData, birth_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Usuario</Label>
                      <Input
                        type="email"
                        value={sellerData.user?.email || ""}
                        onChange={(e) => setSellerData({ 
                          ...sellerData, 
                          user: { ...sellerData.user!, email: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña Usuario</Label>
                      <Input
                        type="password"
                        value={sellerData.user?.password || ""}
                        onChange={(e) => setSellerData({ 
                          ...sellerData, 
                          user: { ...sellerData.user!, password: e.target.value } 
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateSeller} disabled={loading === "createSeller"}>
                    {loading === "createSeller" ? "Creando..." : "Crear Vendedor"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Resultado */}
          {result && (
            <div className="mt-6 space-y-2">
              <Label>Resultado:</Label>
              <Textarea
                value={result}
                readOnly
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
