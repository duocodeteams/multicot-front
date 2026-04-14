"use client"

import { useState } from "react"
import { LogOut, User, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

type ViewState =
  | "form"
  | "loading"
  | "results"
  | "settings"
  | "admin-users-agencies"
  | "admin-create-agency"
  | "admin-create-user"
  | "admin-management"

const VIEW_TITLES: Record<string, { label: string; section?: string }> = {
  form:                   { label: "Nueva Cotización",      section: "Cotizador" },
  loading:                { label: "Procesando...",          section: "Cotizador" },
  results:                { label: "Resultados",             section: "Cotizador" },
  emission:               { label: "Emitir Plan",           section: "Cotizador" },
  settings:               { label: "Configuración" },
  "admin-users-agencies": { label: "Usuarios y Agencias",   section: "Administración" },
  "admin-create-agency":  { label: "Crear Agencia",         section: "Administración" },
  "admin-create-user":    { label: "Crear Vendedor",        section: "Administración" },
  "admin-management":     { label: "Panel de Administración", section: "Administración" },
}

type DashboardHeaderProps = {
  currentView?: string
}

export function DashboardHeader({ currentView = "form" }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const viewInfo = VIEW_TITLES[currentView] ?? { label: "Dashboard" }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success("Sesión cerrada", {
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      toast.error("Error al cerrar sesión", {
        description: "Error al cerrar sesión",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = () => {
    if (user?.nombre) {
      return user.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.split("@")[0].slice(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <header className="flex h-24 shrink-0 items-center justify-between border-b border-border bg-card px-0 shadow-sm shadow-black/5">

      {/* Izquierda: logos + breadcrumb */}
      <div className="flex items-center min-w-0">
        {/* Carril guía: mismo ancho que la barra colapsada del sidebar (3rem) */}
        <div className="w-12 shrink-0" />
        <Separator orientation="vertical" className="h-10" />

        <div className="flex items-center gap-3 pl-4">
          {/* Contenedor de logos */}
          <div className="flex items-center gap-3.5 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-100 shrink-0">
            <img
              src="/portal/biantlogosf.png"
              alt="Biant"
              className="h-14 w-14 object-cover"
            />
            <div className="w-px h-10 bg-gray-200" />
            <img
              src="/portal/biantsinfondo.png"
              alt="Biant Travel"
              className="h-12 w-auto max-w-[220px] object-cover"
            />
          </div>

          <Separator orientation="vertical" className="h-5" />

          <nav className="flex items-center gap-1 text-sm">
            {viewInfo.section && (
              <>
                <span className="text-muted-foreground/70 font-medium">{viewInfo.section}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </>
            )}
            <span className="font-semibold text-foreground">{viewInfo.label}</span>
          </nav>
        </div>
      </div>

      {/* Derecha: usuario con dropdown */}
      <div className="pr-4">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 h-10 rounded-lg hover:bg-accent/60"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium text-foreground leading-tight">
                {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {user?.agenciaId ? `Agencia #${user.agenciaId}` : "Sin agencia"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {user?.nombre || user?.email || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email || "Sin email"}</p>
                {user?.role !== undefined && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit mt-0.5">
                    {String(user.role).toLowerCase() === "admin" || String(user.role) === "1"
                      ? "Admin"
                      : String(user.role).toLowerCase() === "agency" || String(user.role) === "2"
                      ? "Agencia"
                      : "Vendedor"}
                  </span>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  )
}
