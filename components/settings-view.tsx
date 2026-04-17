"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Bell, Globe, User, Mail, Phone, Building2, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SettingsView() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
    // Cargar preferencias guardadas
    const savedNotifications = localStorage.getItem("notifications_enabled")
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true")
    }
  }, [setTheme])

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked)
    localStorage.setItem("notifications_enabled", String(checked))
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tus preferencias y datos de cuenta
        </p>
      </div>

      {/* Datos del Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Datos del Usuario</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user?.nombre
                  ? user.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{user?.nombre || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "Sin email"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium text-foreground">{user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Usuario</Label>
                <p className="text-sm font-medium text-foreground">{user?.userName || "N/A"}</p>
              </div>
            </div>

            {user?.telefono && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Teléfono</Label>
                  <p className="text-sm font-medium text-foreground">{user.telefono}</p>
                </div>
              </div>
            )}

        

            {user?.nacionalidad && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Nacionalidad</Label>
                  <p className="text-sm font-medium text-foreground">{user.nacionalidad}</p>
                </div>
              </div>
            )}

            
          </div>
        </CardContent>
      </Card>

      {/* Preferencias de Apariencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <div>
              <CardTitle>Tema de Color</CardTitle>
              <CardDescription>Elige entre tema claro u oscuro</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-switch" className="text-base">
                Modo Oscuro
              </Label>
              <p className="text-sm text-muted-foreground">
                Activa el tema oscuro para una mejor experiencia visual
              </p>
            </div>
            <Switch
              id="theme-switch"
              checked={isDark}
              onCheckedChange={handleThemeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Gestiona tus preferencias de notificaciones</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-switch" className="text-base">
                Activar Notificaciones
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas y actualizaciones importantes
              </p>
            </div>
            <Switch
              id="notifications-switch"
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

