"use client"

import React from "react"
import { useState } from "react"
import { Plane, Shield, Globe, Clock, Award, TrendingUp, Users, Sparkles, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

// Schema de validación con Zod
const loginSchema = z.object({
  email: z.string()
    .min(1, "El email es obligatorio")
    .email("El email no es válido"),
  password: z.string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)

    try {
      const success = await login(data.email, data.password)

      if (success) {
        toast.success("¡Bienvenido a Biant!", {
          description: "Inicio de sesión exitoso",
        })
        onSuccess()
      } else {
        toast.error("Credenciales incorrectas", {
          description: "Por favor verifica tu email y contraseña",
        })
      }
    } catch (error: any) {
      toast.error("Error al iniciar sesión", {
        description: error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
      })
    } finally {
      setLoading(false)
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
        <div className="relative z-10 flex flex-col justify-center p-8 xl:p-12 text-white w-full h-full overflow-y-auto">
          <div className="space-y-6 max-w-lg">
            {/* Logo and brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl">
                <img className='avatar rounded-md' src="/biantlogo.jpg" alt="" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Biant</h1>
                <p className="text-white/90 text-sm">Llevamos tranquilidad</p>
              </div>
            </div>

            {/* Hero text */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/25 backdrop-blur-sm border border-accent/40">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-medium text-white">Plataforma de Asistencia al Viajero</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Simplificamos tus{" "}
                <span className="text-accent font-black">cotizaciones</span>
              </h2>

              <p className="text-base text-white/95 leading-relaxed">
                Compará precios de múltiples proveedores en tiempo real
                y ofrecé las mejores opciones a tus clientes.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm shrink-0 mt-0.5">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5 text-white">Seguridad y Confianza</h3>
                  <p className="text-sm text-white/85 leading-snug">
                    Trabajamos con las mejores aseguradoras para garantizar
                    la protección de tus clientes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm shrink-0 mt-0.5">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5 text-white">Cotización Instantánea</h3>
                  <p className="text-sm text-white/85 leading-snug">
                    Resultados en segundos. Comparación automática
                    de todas las opciones disponibles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm shrink-0 mt-0.5">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5 text-white">Cobertura Global</h3>
                  <p className="text-sm text-white/85 leading-snug">
                    Asistencia para todos los destinos del mundo,
                    desde viajes regionales hasta internacionales.
                  </p>
                </div>
              </div>

           
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Biant</h1>
              <p className="text-xs text-muted-foreground">Cotizador Profesional</p>
            </div>
          </div>

          {/* Login card */}
          <div className="space-y-6 p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Users className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-accent">Portal de Agentes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Iniciar Sesión</h2>
              <p className="text-sm text-muted-foreground">Ingresá tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* UserName field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    {...register("email")}
                    className={`h-12 bg-background border-2 pl-11 text-base transition-colors ${
                      errors.email
                        ? "border-destructive focus:border-destructive"
                        : "border-input focus:border-accent"
                    }`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-destructive" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium text-sm">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`h-12 bg-background border-2 pl-11 text-base transition-colors ${
                      errors.password
                        ? "border-destructive focus:border-destructive"
                        : "border-input focus:border-accent"
                    }`}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-destructive" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all"
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

              
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Al iniciar sesión, aceptás nuestros <br />
            <a href="#" className="text-accent hover:underline font-medium">Términos de Servicio</a>
            {" "}y{" "}
            <a href="#" className="text-accent hover:underline font-medium">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  )
}
