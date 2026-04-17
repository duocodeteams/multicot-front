"use client"

import { useState } from "react"
import { LogOut, User, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
  form: { label: "Nueva Cotización", section: "Cotizador" },
  loading: { label: "Procesando...", section: "Cotizador" },
  results: { label: "Resultados", section: "Cotizador" },
  emission: { label: "Emitir Plan", section: "Cotizador" },
  settings: { label: "Configuración" },
  "admin-users-agencies": { label: "Usuarios y Agencias", section: "Administración" },
  "admin-create-agency": { label: "Crear Agencia", section: "Administración" },
  "admin-create-user": { label: "Crear Vendedor", section: "Administración" },
  "admin-management": { label: "Panel de Administración", section: "Administración" },
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
    } catch {
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
    <header className="w-full max-w-full overflow-hidden bg-blue-900 flex h-16 md:h-20 items-center justify-between border-b border-border bg-card px-3 md:px-6 shadow-sm">

      {/* IZQUIERDA */}
      <div className="flex items-center min-w-0 gap-2 md:gap-4">

        {/* espacio sidebar */}
       

        {/* BOTÓN SIDEBAR (mobile) */}
        <div className="flex items-center ">
          <div className="md:hidden">
            <SidebarTrigger className="h-9 w-9" />
          </div>

          {/* espacio solo en desktop */}
          <div className="hidden md:block w-12 shrink-0" />
        </div>

        {/* LOGOS (solo desktop) */}
        <div className="hidden md:flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 shrink-0">
          <img
            src="/portal/biantlogosf.png"
            alt="Biant"
            className="h-10 w-10 object-cover shrink-0"
          />
          <div className="w-px h-8 bg-gray-200 shrink-0" />
          <img
            src="/portal/biantsinfondo.png"
            alt="Biant Travel"
            className="h-10 w-auto max-w-[140px] object-contain"
          />
        </div>

        {/* breadcrumb */}
        <nav className="flex items-center gap-1 text-xs md:text-sm min-w-0">
          {viewInfo.section && (
            <>
              <span className="text-muted-foreground/70 truncate">
                {viewInfo.section}
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
            </>
          )}
          <span className="font-semibold text-foreground truncate">
            {viewInfo.label}
          </span>
        </nav>
      </div>

      {/* DERECHA */}
      <div className="flex items-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 rounded-lg"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              {/* oculto en mobile */}
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-foreground  min-w-[140px]">
                  {user?.email || "Usuario"}
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
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.nombre || user?.email || "Usuario"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "Sin email"}
                  </p>
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