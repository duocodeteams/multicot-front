"use client"

import { LayoutDashboard, Settings, HelpCircle } from "lucide-react"
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

const secondaryNav = [
  { title: "Configuracion", icon: Settings },
  { title: "Ayuda", icon: HelpCircle },
]

type AppSidebarProps = {
  onNavigateToForm?: () => void
  onNavigateToSettings?: () => void
  currentView?: string
}

export function AppSidebar({ 
  onNavigateToForm, 
  onNavigateToSettings,
  currentView = "form"
}: AppSidebarProps) {
  const { user } = useAuth()
  const { t } = useLanguage()

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

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img
              src="/biantlogo.jpg"
              alt="Biant"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
             Biant Seguros
            </span>
            {user?.agenciaId && (
              <span className="text-xs text-sidebar-foreground/60">
                #{user.nombre}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Principal
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
                  <span>{t("dashboard")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            General
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
                  <span>{t("settings")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t("help")}>
                  <HelpCircle className="h-4 w-4" />
                  <span>{t("help")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs font-medium text-sidebar-foreground">
            Viajes Global S.A.
          </p>
          <p className="text-xs text-sidebar-foreground/60">
            Plan Profesional
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
