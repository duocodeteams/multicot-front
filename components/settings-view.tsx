"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Bell, Globe, User, Mail, Phone, Building2, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SettingsView() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
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

  const handleLanguageChange = (value: string) => {
    setLanguage(value as "es" | "en")
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
        <h1 className="text-2xl font-bold text-foreground">{t("settingsTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settingsDescription")}
        </p>
      </div>

      {/* Datos del Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("userData")}</CardTitle>
              <CardDescription>{t("userDataDescription")}</CardDescription>
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
                <Label className="text-xs text-muted-foreground">{t("email")}</Label>
                <p className="text-sm font-medium text-foreground">{user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">{t("user")}</Label>
                <p className="text-sm font-medium text-foreground">{user?.userName || "N/A"}</p>
              </div>
            </div>

            {user?.telefono && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t("phone")}</Label>
                  <p className="text-sm font-medium text-foreground">{user.telefono}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">{t("agency")}</Label>
                <p className="text-sm font-medium text-foreground">
                  {user?.agenciaId ? `${t("agency")} #${user.agenciaId}` : "N/A"}
                </p>
              </div>
            </div>

            {user?.nacionalidad && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t("nationality")}</Label>
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
              <CardTitle>{t("colorTheme")}</CardTitle>
              <CardDescription>{t("colorThemeDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-switch" className="text-base">
                {t("darkMode")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("darkModeDescription")}
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

      {/* Idioma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("language")}</CardTitle>
              <CardDescription>{t("languageDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language-select">{t("appLanguage")}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language-select" className="w-full md:w-[300px]">
                <SelectValue placeholder={t("appLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("languageDescriptionText")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("notifications")}</CardTitle>
              <CardDescription>{t("notificationsDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-switch" className="text-base">
                {t("enableNotifications")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("notificationsDescriptionText")}
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

