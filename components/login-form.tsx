"use client"

import React from "react"

import { useState } from "react"
import { Plane, Shield, Globe, Clock, Award, TrendingUp, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("El email es obligatorio")
      return
    }
    if (!password.trim()) {
      setError("La contrasena es obligatoria")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingrese un email valido")
      return
    }

    setLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    const success = login(email, password)
    setLoading(false)

    if (success) {
      onSuccess()
    } else {
      setError("Credenciales incorrectas")
    }
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop')"
          }}
        />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 2xl:p-16 text-white w-full h-full overflow-y-auto">
          {/* Logo and brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 xl:h-14 xl:w-14 items-center justify-center rounded-2xl bg-accent shadow-2xl shadow-accent/50">
                <Plane className="h-6 w-6 xl:h-7 xl:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold tracking-tight">TravelAssist Pro</h1>
                <p className="text-white/80 text-xs xl:text-sm">Plataforma de Cotización Inteligente</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium">La mejor herramienta del mercado</span>
              </div>

              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight">
                Cotizaciones de viaje en{" "}
                <span className="text-accent">segundos</span>
              </h2>

              <p className="text-base xl:text-lg text-white/80 leading-relaxed">
                Compara instantáneamente múltiples proveedores de asistencia al viajero
                y cierra más ventas con las mejores opciones para tus clientes.
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 xl:gap-5 max-w-2xl">
            <div className="group flex items-start gap-3 p-4 xl:p-5 rounded-xl xl:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-lg xl:rounded-xl bg-white/10 shrink-0">
                <Shield className="h-5 w-5 xl:h-6 xl:w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm xl:text-base mb-0.5">Seguro y Confiable</h3>
                <p className="text-xs xl:text-sm text-white/70">Protección garantizada</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 xl:p-5 rounded-xl xl:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-lg xl:rounded-xl bg-white/10 shrink-0">
                <Clock className="h-5 w-5 xl:h-6 xl:w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm xl:text-base mb-0.5">Ahorra Tiempo</h3>
                <p className="text-xs xl:text-sm text-white/70">Cotización instantánea</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 xl:p-5 rounded-xl xl:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-lg xl:rounded-xl bg-white/10 shrink-0">
                <Globe className="h-5 w-5 xl:h-6 xl:w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm xl:text-base mb-0.5">Cobertura Global</h3>
                <p className="text-xs xl:text-sm text-white/70">Destinos en todo el mundo</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 xl:p-5 rounded-xl xl:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-lg xl:rounded-xl bg-white/10 shrink-0">
                <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm xl:text-base mb-0.5">Mejores Precios</h3>
                <p className="text-xs xl:text-sm text-white/70">Compara y ahorra</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 xl:gap-12 pt-6 border-t border-white/10">
            <div>
              <div className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-accent">+50K</div>
              <div className="text-xs xl:text-sm text-white/70">Cotizaciones realizadas</div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-accent">+2.5K</div>
              <div className="text-xs xl:text-sm text-white/70">Agencias activas</div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-accent">98%</div>
              <div className="text-xs xl:text-sm text-white/70">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TravelAssist Pro</h1>
              <p className="text-xs text-muted-foreground">Cotización Inteligente</p>
            </div>
          </div>

          {/* Login card */}
          <div className="space-y-5 p-6 sm:p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border shadow-2xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Users className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-accent">Portal de Agentes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Bienvenido de nuevo</h2>
              <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder a tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@agencia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 sm:h-12 bg-background/50 border-2 border-input focus:border-accent transition-colors pl-4 text-base"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-semibold text-sm">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 sm:h-12 bg-background/50 border-2 border-input focus:border-accent transition-colors pl-4 text-base"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border-2 border-destructive/30 animate-in slide-in-from-top-2">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2" role="alert">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-base font-semibold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Iniciar sesión
                    <Plane className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">Modo demo</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-accent/5 border border-accent/20">
                <p className="text-xs sm:text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  Usa cualquier email y contraseña para probar
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="#" className="text-accent hover:underline">Términos de Servicio</a>
            {" "}y{" "}
            <a href="#" className="text-accent hover:underline">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  )
}
