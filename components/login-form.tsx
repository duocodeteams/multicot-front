"use client"

import React from "react"
import { useState } from "react"
import { Plane, Shield, Globe, Clock, Users, Sparkles, Mail, Lock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

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
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotUserName, setForgotUserName] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const FORMSPREE_FORGOT_PASSWORD_ENDPOINT =
    process.env.NEXT_PUBLIC_FORMSPREE_FORGOT_PASSWORD_ENDPOINT || "https://formspree.io/f/xdapyjnp"
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormData) => {
    if (loading) return

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
          description: "Email o contraseña inválidos",
        })
      }
    } catch (error: any) {
      console.error("LOGIN ERROR:", error)

      toast.error("Error al iniciar sesión", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Ocurrió un error inesperado",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForgotState = () => {
    setForgotUserName("")
    setForgotLoading(false)
    setForgotSent(false)
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedUserName = forgotUserName.trim()
    if (!trimmedUserName) {
      toast.error("Ingresá tu nombre de usuario")
      return
    }

    if (!FORMSPREE_FORGOT_PASSWORD_ENDPOINT) {
      toast.error("Falta configurar Formspree", {
        description: "Definí NEXT_PUBLIC_FORMSPREE_FORGOT_PASSWORD_ENDPOINT en tus variables de entorno.",
      })
      return
    }

    setForgotLoading(true)
    try {
      const response = await fetch(FORMSPREE_FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nombreUsuario: trimmedUserName,
          origen: "login-olvido-contrasena",
          fechaEnvio: new Date().toISOString(),
          _subject: `Solicitud de recuperacion de contrasena - ${trimmedUserName}`,
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo enviar la solicitud")
      }

      setForgotSent(true)
      toast.success("Solicitud enviada", {
        description: "Recibimos tu pedido para recuperar la contraseña.",
      })
    } catch (error: any) {
      toast.error("No se pudo enviar la solicitud", {
        description: error.message || "Intentá nuevamente en unos minutos.",
      })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1e2460 0%, #282f78 55%, #1a2260 100%)" }}
      >
        {/* Textura sutil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Círculos decorativos de fondo */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #e84620 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14 py-10">
          <div className="max-w-lg w-full">

            {/* Logo */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-4 bg-white border border-white/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <img src="/portal/biantsinfondo.png" alt="Biant Travel" className="h-16 w-auto object-contain" />
                <div className="w-px h-10 bg-white/25" />
                <img src="/portal/biantlogosf.png" alt="Biant" className="h-16 w-auto object-contain" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-white/90" />
              <span className="text-xs font-semibold text-white/90 tracking-widest uppercase">
                Plataforma de Asistencia al Viajero
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] mb-4">
              Simplificamos<br />
              tus{" "}
              <span style={{ color: "#e84620" }}>cotizaciones</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-10 max-w-md">
              Compará precios de múltiples proveedores en tiempo real
              y ofrecé las mejores opciones a tus clientes.
            </p>

            {/* Features */}
            <div className="space-y-5">
              {[
                {
                  icon: Shield,
                  title: "Seguridad y Confianza",
                  desc: "Trabajamos con las mejores aseguradoras para garantizar la protección de tus clientes.",
                },
                {
                  icon: Clock,
                  title: "Cotización Instantánea",
                  desc: "Resultados en segundos. Comparación automática de todas las opciones disponibles.",
                },
                {
                  icon: Globe,
                  title: "Cobertura Global",
                  desc: "Asistencia para todos los destinos del mundo, desde viajes regionales hasta internacionales.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-0.5">{title}</h3>
                    <p className="text-white/60 text-sm leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer del panel izquierdo */}
        <div className="relative z-10 px-10 xl:px-14 pb-8">
          <div className="border-t border-white/15 pt-5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-white/50 shrink-0" />
            <p className="text-xs text-white/50">Más de 500 agentes activos en toda Argentina</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[420px] my-auto py-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
              <img src="/portal/biantsinfondo.png" alt="Biant" className="h-10 w-auto object-contain" />
              <div className="w-px h-8 bg-gray-200" />
              <img src="/portal/biantlogosf.png" alt="Biant logo" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/80 p-8">

            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-4"
                style={{ background: "rgba(232,70,32,0.08)", borderColor: "rgba(232,70,32,0.2)" }}>
                <Users className="h-3.5 w-3.5" style={{ color: "#e84620" }} />
                <span className="text-xs font-semibold" style={{ color: "#e84620" }}>Portal de Agentes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Iniciar Sesión
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Ingresá tus credenciales para acceder a tu cuenta
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(onSubmit)(e)
              }}
              className="space-y-5"
            >

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-800 font-semibold text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    {...register("email")}
                    className={`h-11 bg-white border pl-10 text-sm text-gray-900 placeholder:text-gray-400 rounded-xl transition-all focus-visible:ring-2 ${errors.email
                      ? "border-red-400 focus-visible:ring-red-100"
                      : "border-gray-300 hover:border-gray-400 focus:border-[#282f78] focus-visible:ring-[#282f78]/10"
                      }`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-800 font-semibold text-sm">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    className="text-xs font-semibold transition-colors cursor-pointer"
                    style={{ color: "#e84620" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#c53a1a")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#e84620")}
                    onClick={() => {
                      resetForgotState()
                      setForgotModalOpen(true)
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`h-11 bg-white border pl-10 text-sm text-gray-900 placeholder:text-gray-400 rounded-xl transition-all focus-visible:ring-2 ${errors.password
                      ? "border-red-400 focus-visible:ring-red-100"
                      : "border-gray-300 hover:border-gray-400 focus:border-[#282f78] focus-visible:ring-[#282f78]/10"
                      }`}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold text-white rounded-xl mt-1 transition-all"
                style={{
                  background: loading ? "#c53a1a" : "#e84620",
                  boxShadow: "0 4px 14px rgba(232,70,32,0.35)",
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
          <p className="text-center text-gray-400 text-xs mt-5 leading-relaxed">
            Al iniciar sesión, aceptás nuestros <br />
            <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors underline underline-offset-2">
              Términos de Servicio y Políticas de Privacidad
            </a>

          </p>
        </div>
      </div>

      <Dialog
        open={forgotModalOpen}
        onOpenChange={(open) => {
          setForgotModalOpen(open)
          if (!open) resetForgotState()
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #e84620, #c53a1a)" }} />
          <div className="p-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl text-gray-900">Recuperar contraseña</DialogTitle>
              <DialogDescription>
                Ingresá tu nombre de usuario y te enviaremos una solicitud de recuperación.
              </DialogDescription>
            </DialogHeader>

            {forgotSent ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">Solicitud enviada correctamente.</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Nuestro equipo la revisará y se pondrá en contacto con vos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-username" className="text-gray-800 font-semibold text-sm">
                    Nombre de usuario
                  </Label>
                  <Input
                    id="forgot-username"
                    value={forgotUserName}
                    onChange={(e) => setForgotUserName(e.target.value)}
                    placeholder="Ej: juan.perez"
                    autoComplete="username"
                    className="h-11 rounded-xl"
                    disabled={forgotLoading}
                  />
                </div>

                <DialogFooter className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setForgotModalOpen(false)}
                    disabled={forgotLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    style={{ background: "#e84620" }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Enviando..." : "Enviar solicitud"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
