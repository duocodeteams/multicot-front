"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { PromotionsBanner } from "@/components/promotions-banner"
import { PromotionsModal } from "@/components/promotions-modal"
import { PromotionsView } from "@/components/promotions-view"
import { QuotationForm, type QuotationData } from "@/components/quotation-form"
import { QuotationResults, QuotationResultsSkeleton } from "@/components/quotation-results"
import { SettingsView } from "@/components/settings-view"
import { AdminUsersAgencies } from "@/components/admin-users-agencies"
import { AdminCreateAgency } from "@/components/admin-create-agency"
import { AdminCreateUser } from "@/components/admin-create-user"
import { AdminManagement } from "@/components/admin-management"
import { AdminPlansManagement } from "@/components/admin-plans-management"
import { AdminPromotionsManagement } from "@/components/admin-promotions-management"
import { PlanEmissionView } from "@/components/plan-emission-view"
import type { SelectedPlan } from "@/components/plan-emission-view"
import { PlanComparisonView } from "@/components/plan-comparison-view"
import { IssuancesView } from "@/components/issuances-view"
import { OmintEmissionFlow } from "@/components/issuance/omint-emission-flow"
import type { Plan } from "@/components/quotation-results"
import { createQuote } from "@/lib/services"
import { mapQuotationDataToApi } from "@/lib/services/quotes.mapper"
import {
  getOmintSaleContext,
  readOmintReturnParams,
} from "@/lib/issuance/omint-session"
import type { OmintPaymentReturnStatus } from "@/lib/issuance/omint-types"
import { toast } from "sonner"

type ViewState =
  | "form"
  | "loading"
  | "results"
  | "emission"
  | "comparison"
  | "promotions"
  | "issuances"
  | "settings"
  | "admin-users-agencies"
  | "admin-create-agency"
  | "admin-create-user"
  | "admin-management"
  | "admin-plans"
  | "admin-promotions"

export function DashboardView() {
  const [view, setView] = useState<ViewState>("form")
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [quotationResponse, setQuotationResponse] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [plansToCompare, setPlansToCompare] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resumeSaleId, setResumeSaleId] = useState<string | null>(null)
  const [paymentReturn, setPaymentReturn] = useState<OmintPaymentReturnStatus | null>(null)

  // Retorno desde checkout Omint o resume por query
  useEffect(() => {
    const { saleId, payment } = readOmintReturnParams()
    if (!saleId) return

    const ctx = getOmintSaleContext()
    setResumeSaleId(saleId)
    setPaymentReturn(payment)

    if (ctx?.plan && ctx?.quotationData) {
      setSelectedPlan(ctx.plan)
      setQuotationData(ctx.quotationData)
    }

    setView("emission")
  }, [])

  const handleSubmit = async (data: QuotationData) => {
    setQuotationData(data)
    setView("loading")
    setIsLoading(true)

    try {
      const apiData = mapQuotationDataToApi(data)
      const response = await createQuote(apiData)
      setQuotationResponse(response)
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
    setResumeSaleId(null)
    setPaymentReturn(null)
    setView("emission")
  }

  const handleBackToResults = () => {
    setResumeSaleId(null)
    setPaymentReturn(null)
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

  const handleNavigateToPromotions = () => {
    setView("promotions")
  }

  const handleNavigateToIssuances = () => {
    setView("issuances")
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

  const handleNavigateToAdminPlans = () => {
    setView("admin-plans")
  }

  const handleNavigateToAdminPromotions = () => {
    setView("admin-promotions")
  }

  const showFullEmission = view === "emission" && selectedPlan && quotationData
  const showResumeOnlyEmission =
    view === "emission" && resumeSaleId && !(selectedPlan && quotationData)

  return (
    <SidebarProvider>
      <AppSidebar
        onNavigateToForm={handleNavigateToForm}
        onNavigateToPromotions={handleNavigateToPromotions}
        onNavigateToIssuances={handleNavigateToIssuances}
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToAdminUsersAgencies={handleNavigateToAdminUsersAgencies}
        onNavigateToAdminCreateAgency={handleNavigateToAdminCreateAgency}
        onNavigateToAdminCreateUser={handleNavigateToAdminCreateUser}
        onNavigateToAdminManagement={handleNavigateToAdminManagement}
        onNavigateToAdminPlans={handleNavigateToAdminPlans}
        onNavigateToAdminPromotions={handleNavigateToAdminPromotions}
        currentView={view}
      />
      <SidebarInset>
        <DashboardHeader currentView={view} />
        <PromotionsModal onNavigateToPromotions={handleNavigateToPromotions} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 w-full min-w-0 max-w-full">
          {view === "form" && (
            <>
              <PromotionsBanner onNavigateToPromotions={handleNavigateToPromotions} />
              <QuotationForm onSubmit={handleSubmit} isLoading={isLoading} />
            </>
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
          {showFullEmission && (
            <PlanEmissionView
              plan={selectedPlan!}
              quotationData={quotationData!}
              onBack={handleBackToResults}
              onBackToForm={handleBack}
              quoteId={String(selectedPlan!.id)}
              initialSaleId={resumeSaleId}
              paymentReturn={paymentReturn}
            />
          )}
          {showResumeOnlyEmission && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Retomar emisión Omint</h2>
                <p className="text-xs text-muted-foreground">
                  Continuamos desde la venta {resumeSaleId}
                </p>
              </div>
              <OmintEmissionFlow
                initialSaleId={resumeSaleId}
                paymentReturn={paymentReturn}
                onBack={handleBack}
              />
            </div>
          )}
          {view === "promotions" && <PromotionsView />}
          {view === "issuances" && <IssuancesView />}
          {view === "settings" && <SettingsView />}
          {view === "admin-users-agencies" && <AdminUsersAgencies />}
          {view === "admin-create-agency" && <AdminCreateAgency />}
          {view === "admin-create-user" && <AdminCreateUser />}
          {view === "admin-management" && <AdminManagement />}
          {view === "admin-plans" && <AdminPlansManagement />}
          {view === "admin-promotions" && <AdminPromotionsManagement />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
