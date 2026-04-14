"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { DashboardView } from "@/components/dashboard-view"

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => {}} />
  }

  return <DashboardView />
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
