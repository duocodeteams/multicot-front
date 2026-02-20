"use client"

import { useState } from "react"
import { LogOut, User } from "lucide-react"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success(t("logoutSuccess"), {
        description: t("logoutSuccessDescription"),
      })
    } catch (error) {
      toast.error(t("logoutError"), {
        description: t("logoutError"),
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("quotationAssistant")}
        </h2>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.nombre
                  ? user.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium text-foreground">{user?.nombre || "Usuario"}</span>
              <span className="text-xs text-muted-foreground">
                {user?.agenciaId ? `Agencia #${user.agenciaId}` : "Sin agencia"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">{user?.nombre || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "Sin email"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role !== undefined ? `${t("role")}: ${user.role}` : "Sin rol"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            {t("myProfile")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="text-destructive"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? t("loggingIn") : t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
