"use client"

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
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

const secondaryNav = [
  { title: "Configuracion", icon: Settings },
  { title: "Ayuda", icon: HelpCircle },
]

type AppSidebarProps = {
  onNavigateToForm?: () => void
  onNavigateToSettings?: () => void
  onNavigateToAdminUsersAgencies?: () => void
  onNavigateToAdminCreateAgency?: () => void
  onNavigateToAdminCreateUser?: () => void
  onNavigateToAdminManagement?: () => void
  onNavigateToLogout?: () => void
  currentView?: string
}

export function AppSidebar({
  onNavigateToForm,
  onNavigateToSettings,
  onNavigateToAdminUsersAgencies,
  onNavigateToAdminCreateAgency,
  onNavigateToAdminCreateUser,
  onNavigateToAdminManagement,
  onNavigateToLogout,
  currentView = "form"
}: AppSidebarProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  // Verificar si el usuario es admin (role === "admin")
  const isAdmin = user?.role === "admin" || user?.role === 1

  const handleDashboardClick = () => {
    if (onNavigateToForm) {
      onNavigateToForm()
    }
  }

  const handleSettingsClick = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings()
    }
  }

  const handleAdminUsersAgenciesClick = () => {
    if (onNavigateToAdminUsersAgencies) {
      onNavigateToAdminUsersAgencies()
    }
  }

  const handleAdminCreateAgencyClick = () => {
    if (onNavigateToAdminCreateAgency) {
      onNavigateToAdminCreateAgency()
    }
  }

  const handleAdminCreateUserClick = () => {
    if (onNavigateToAdminCreateUser) {
      onNavigateToAdminCreateUser()
    }
  }

  const handleAdminManagementClick = () => {
    if (onNavigateToAdminManagement) {
      onNavigateToAdminManagement()
    }
  }

  const handleLogout = () => {
    logout()
    toast.success("Sesión cerrada correctamente")
  }

  const handleLogoutClick = () => {
    if (onNavigateToLogout) {
      onNavigateToLogout()
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 px-4 flex justify-center">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shrink-0">
            <img
              src="/biantlogo.jpg"
              alt="Biant"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Biant Seguros
            </span>
            {user?.agenciaId && (
              <span className="text-xs text-sidebar-foreground/60">
                #{user.agenciaId}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-white">
            -Principal-
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "form" || currentView === "loading" || currentView === "results"}
                  tooltip="Dashboard"
                  onClick={handleDashboardClick}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">{t("dashboard")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/50">
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-users-agencies"}
                      tooltip="Usuarios y Agencias"
                      onClick={handleAdminUsersAgenciesClick}
                    >
                      <Users className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Usuarios y Agencias</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-create-agency"}
                      tooltip="Crear Agencia"
                      onClick={handleAdminCreateAgencyClick}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Crear Agencia</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-create-user"}
                      tooltip="Crear Usuario"
                      onClick={handleAdminCreateUserClick}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Crear Usuario</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "admin-management"}
                      tooltip="Gestiones de Admin"
                      onClick={handleAdminManagementClick}
                    >
                      <Shield className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Gestiones de Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-white">
            -General-
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "settings"}
                  tooltip={t("settings")}
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">{t("settings")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t("help")}>
                  <HelpCircle className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">{t("help")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={currentView === "logout"} tooltip="Cerrar sesión" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
