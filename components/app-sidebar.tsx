"use client"

import { useState } from "react"
import { LayoutDashboard, Settings, HelpCircle, Users, Building2, UserPlus, Shield, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

type AppSidebarProps = {
  onNavigateToForm?: () => void
  onNavigateToSettings?: () => void
  onNavigateToAdminUsersAgencies?: () => void
  onNavigateToAdminCreateAgency?: () => void
  onNavigateToAdminCreateUser?: () => void
  onNavigateToAdminManagement?: () => void
  currentView?: string
}

export function AppSidebar({
  onNavigateToForm,
  onNavigateToSettings,
  onNavigateToAdminUsersAgencies,
  onNavigateToAdminCreateAgency,
  onNavigateToAdminCreateUser,
  onNavigateToAdminManagement,
  currentView = "form"
}: AppSidebarProps) {
  const { user, logout } = useAuth()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const normalizedRole = String(user?.role ?? "").toLowerCase()
  const isAdmin = normalizedRole === "admin" || normalizedRole === "1"
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ""

  const getInitials = () => {
    if (user?.nombre) {
      return user.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.split("@")[0].slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const getRoleLabel = () => {
    const role = String(user?.role ?? "").toLowerCase()
    if (role === "admin" || role === "1") return "Admin"
    if (role === "agency" || role === "2") return "Agencia"
    if (role === "seller" || role === "3") return "Vendedor"
    return "Usuario"
  }

  const handleLogout = () => {
    logout()
    toast.success("Sesión cerrada correctamente")
  }

  const handleOpenSupportWhatsApp = () => {
    const supportMessage = "Hola, necesito soporte con la plataforma."
    const cleanPhone = supportPhone.replace(/\D/g, "")
    const text = encodeURIComponent(supportMessage)
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`

    window.open(url, "_blank", "noopener,noreferrer")
    setIsSupportModalOpen(false)
  }

  return (
    <Sidebar collapsible="icon">

      {/* ── Header: toggle de colapso ── */}
      <SidebarHeader className="h-24 flex items-center justify-center border-b border-sidebar-border/40 px-2">
        <div className="w-full flex items-center justify-center">
          <SidebarTrigger className="h-8 w-8 mx-auto text-sidebar-white hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg" />
        </div>
      </SidebarHeader>

      {/* ── Contenido ── */}
      <SidebarContent className="py-3 gap-0">

        {/* Principal */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-white uppercase tracking-widest mb-1">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    currentView === "form" ||
                    currentView === "loading" ||
                    currentView === "results"
                  }
                  tooltip="Cotizador"
                  onClick={onNavigateToForm}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <>
            <SidebarSeparator className="mx-2 my-2 bg-sidebar-border/40" />
            <SidebarGroup className="px-2">
              <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-widest mb-1">
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-users-agencies"}
                      tooltip="Usuarios y Agencias"
                      onClick={onNavigateToAdminUsersAgencies}
                    >
                      <Users className="h-4 w-4" />
                      <span>Usuarios y Agencias</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-create-agency"}
                      tooltip="Crear Agencia"
                      onClick={onNavigateToAdminCreateAgency}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Crear Agencia</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-create-user"}
                      tooltip="Crear Vendedor"
                      onClick={onNavigateToAdminCreateUser}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Crear Vendedor</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-management"}
                      tooltip="Gestión Admin"
                      onClick={onNavigateToAdminManagement}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Gestión Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* General */}
        <SidebarSeparator className="mx-2 my-2 bg-sidebar-border/40" />
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-white uppercase tracking-widest mb-1">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "settings"}
                  tooltip="Configuración"
                  onClick={onNavigateToSettings}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Ayuda"
                  onClick={() => setIsSupportModalOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Ayuda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* ── Footer: usuario + logout ── */}
      <SidebarFooter className="border-t border-sidebar-border/40 p-3 gap-1">

        {/* Tarjeta de usuario */}
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-foreground/15 shadow-sm">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
              {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            </span>
            <span className="text-[11px] text-sidebar-foreground/45 truncate leading-tight">
              {user?.email || "Sin email"}
            </span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sidebar-primary/40 text-sidebar-foreground/80 shrink-0 group-data-[collapsible=icon]:hidden">
            {getRoleLabel()}
          </span>
        </div>

        {/* Botón logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar sesión"
              onClick={handleLogout}
              className="text-sidebar-white hover:!text-red-300 hover:!bg-red-500/15 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarFooter>

      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Centro de soporte</DialogTitle>
            <DialogDescription>
              Si necesitás ayuda con la plataforma, contactanos por WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsSupportModalOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleOpenSupportWhatsApp}>Contactar soporte por WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
