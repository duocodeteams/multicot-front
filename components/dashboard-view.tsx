"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuotationForm, type QuotationData } from "@/components/quotation-form"
import { QuotationResults, QuotationResultsSkeleton } from "@/components/quotation-results"
import { SettingsView } from "@/components/settings-view"
import { AdminUsersAgencies } from "@/components/admin-users-agencies"
import { AdminCreateAgency } from "@/components/admin-create-agency"
import { AdminCreateUser } from "@/components/admin-create-user"
import { AdminManagement } from "@/components/admin-management"
import { PlanEmissionView } from "@/components/plan-emission-view"
import type { SelectedPlan } from "@/components/plan-emission-view"
import { PlanComparisonView } from "@/components/plan-comparison-view"
import type { Plan } from "@/components/quotation-results"
import { useAuth } from "@/lib/auth-context"
import { createQuote } from "@/lib/services"
import { mapQuotationDataToApi } from "@/lib/services/quotes.mapper"
import { toast } from "sonner"

type ViewState = "form" | "loading" | "results" | "emission" | "comparison" | "settings" | "admin-users-agencies" | "admin-create-agency" | "admin-create-user" | "admin-management"

export function DashboardView() {
  const { loginResponse } = useAuth()
  const [view, setView] = useState<ViewState>("form")
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [quotationResponse, setQuotationResponse] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [plansToCompare, setPlansToCompare] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Console.log de la respuesta del backend cuando el componente se monta
  useEffect(() => {
    if (loginResponse) {
      console.log("Respuesta del backend (login):", loginResponse)
    }
  }, [loginResponse])

  const handleSubmit = async (data: QuotationData) => {
    setQuotationData(data)
    setView("loading")
    setIsLoading(true)

    try {
      // Mapear los datos del formulario al formato de la API
      const apiData = mapQuotationDataToApi(data)
      
      // Hacer la petición al backend usando el servicio
      const response = await createQuote(apiData)

      // Guardar la respuesta del backend
      setQuotationResponse(response)
      console.log("Respuesta del backend (cotización):", response)
      
      setView("results")
      toast.success("Cotización realizada", {
        description: "Se han encontrado opciones de asistencia",
      })
    } catch (error: any) {
      console.error("Error al cotizar:", error)
      toast.error("Error al cotizar", {
        description: error.message || "Ocurrió un error al realizar la cotización",
      })
      setView("form")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setView("form")
  }

  const handleSelectPlan = (plan: SelectedPlan) => {
    setSelectedPlan(plan)
    setView("emission")
  }

  const handleBackToResults = () => {
    setView("results")
  }

  const handleCompare = (plans: Plan[]) => {
    setPlansToCompare(plans)
    setView("comparison")
  }

  const handleBackFromComparison = () => {
    setView("results")
  }

  const handleNavigateToForm = () => {
    setView("form")
  }

  const handleNavigateToSettings = () => {
    setView("settings")
  }

  const handleNavigateToAdminUsersAgencies = () => {
    setView("admin-users-agencies")
  }

  const handleNavigateToAdminCreateAgency = () => {
    setView("admin-create-agency")
  }

  const handleNavigateToAdminCreateUser = () => {
    setView("admin-create-user")
  }

  const handleNavigateToAdminManagement = () => {
    setView("admin-management")
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        onNavigateToForm={handleNavigateToForm}
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToAdminUsersAgencies={handleNavigateToAdminUsersAgencies}
        onNavigateToAdminCreateAgency={handleNavigateToAdminCreateAgency}
        onNavigateToAdminCreateUser={handleNavigateToAdminCreateUser}
        onNavigateToAdminManagement={handleNavigateToAdminManagement}
        currentView={view}
      />
      <SidebarInset>
        <DashboardHeader currentView={view} />
        <div className="flex-1 overflow-auto p-4 md:p-6 w-full">
          {view === "form" && (
            <QuotationForm onSubmit={handleSubmit} isLoading={isLoading} />
          )}
          {view === "loading" && <QuotationResultsSkeleton />}
          {view === "results" && quotationData && (
            <QuotationResults
              data={quotationData}
              backendResponse={quotationResponse}
              onBack={handleBack}
              onSelectPlan={handleSelectPlan}
              onCompare={handleCompare}
            />
          )}
          {view === "comparison" && plansToCompare.length >= 2 && quotationData && (
            <PlanComparisonView
              plans={plansToCompare}
              quotationData={quotationData}
              onBack={handleBackFromComparison}
              onSelectPlan={handleSelectPlan}
            />
          )}
          {view === "emission" && selectedPlan && quotationData && (
            <PlanEmissionView
              plan={selectedPlan}
              quotationData={quotationData}
              onBack={handleBackToResults}
              onBackToForm={handleBack}
            />
          )}
          {view === "settings" && <SettingsView />}
          {view === "admin-users-agencies" && <AdminUsersAgencies />}
          {view === "admin-create-agency" && <AdminCreateAgency />}
          {view === "admin-create-user" && <AdminCreateUser />}
          {view === "admin-management" && <AdminManagement />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
