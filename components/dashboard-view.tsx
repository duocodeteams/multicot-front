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
import { MySalesView, type ResumeSaleRequest } from "@/components/my-sales-view"
import { OmintEmissionFlow } from "@/components/issuance/omint-emission-flow"
import { InterAssistEmissionFlow } from "@/components/issuance/inter-assist-emission-flow"
import type { Plan } from "@/components/quotation-results"
import { createQuote, getSale } from "@/lib/services"
import { mapQuotationDataToApi } from "@/lib/services/quotes.mapper"
import { getOmintSaleContext, isOmintCompany, readOmintReturnParams } from "@/lib/issuance/omint-session"
import {
  buildInterAssistQuoteSnapshot,
  getInterAssistSaleContext,
  isInterAssistCompany,
  readSaleReturnParams,
  resolveInterAssistQuoteId,
} from "@/lib/issuance/inter-assist-session"
import {
  getMostRecentOpenSale,
  getOpenSaleBySaleId,
  getOpenSaleByStorageKey,
  interAssistStorageKey,
} from "@/lib/issuance/sale-persistence"
import type { SalePaymentReturnStatus } from "@/lib/issuance/sales-types"
import { toast } from "sonner"

type ViewState =
  | "form"
  | "loading"
  | "results"
  | "emission"
  | "comparison"
  | "promotions"
  | "my-sales"
  | "issuances"
  | "settings"
  | "admin-users-agencies"
  | "admin-create-agency"
  | "admin-create-user"
  | "admin-management"
  | "admin-plans"
  | "admin-promotions"

type ResumeCompany = "omint" | "inter_assist" | null

function quoteIdForPlan(plan: SelectedPlan, company: ResumeCompany): string {
  if (company === "inter_assist" || isInterAssistCompany(plan.empresaCotizacion)) {
    return resolveInterAssistQuoteId(plan)
  }
  return String(plan.id)
}

export function DashboardView() {
  const [view, setView] = useState<ViewState>("form")
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [quotationResponse, setQuotationResponse] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [plansToCompare, setPlansToCompare] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resumeSaleId, setResumeSaleId] = useState<string | null>(null)
  const [paymentReturn, setPaymentReturn] = useState<SalePaymentReturnStatus | null>(null)
  const [resumeCompany, setResumeCompany] = useState<ResumeCompany>(null)

  // Retomar: query ?sale_id=… o venta abierta en localStorage
  useEffect(() => {
    const fromOmintHelper = readOmintReturnParams()
    const fromShared = readSaleReturnParams()
    const saleIdFromUrl = fromOmintHelper.saleId || fromShared.saleId
    const payment = fromOmintHelper.payment || fromShared.payment

    const omintCtx = getOmintSaleContext()
    const interCtx = getInterAssistSaleContext()
    const stored = saleIdFromUrl
      ? null
      : getMostRecentOpenSale()

    const saleId = saleIdFromUrl || stored?.saleId || null
    if (!saleId) return

    setResumeSaleId(saleId)
    setPaymentReturn(payment)

    if (omintCtx?.saleId === saleId && omintCtx.plan && omintCtx.quotationData) {
      setSelectedPlan(omintCtx.plan)
      setQuotationData(omintCtx.quotationData)
      setResumeCompany("omint")
      setView("emission")
      return
    }

    if (interCtx?.saleId === saleId && interCtx.plan && interCtx.quotationData) {
      setSelectedPlan(interCtx.plan)
      setQuotationData(interCtx.quotationData)
      setResumeCompany("inter_assist")
      setView("emission")
      return
    }

    if (stored?.saleId === saleId && stored.plan && stored.quotationData) {
      setSelectedPlan(stored.plan)
      setQuotationData(stored.quotationData)
      setResumeCompany(stored.company)
      setView("emission")
      return
    }

    getSale(saleId)
      .then((sale) => {
        const company = String(sale.company || "").toLowerCase()
        if (company.includes("inter")) setResumeCompany("inter_assist")
        else if (company.includes("omint")) setResumeCompany("omint")
        else setResumeCompany(null)
        setView("emission")
      })
      .catch(() => {
        // Sin venta usable: quedarse en form
      })
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
    const company: ResumeCompany = isOmintCompany(plan.empresaCotizacion)
      ? "omint"
      : isInterAssistCompany(plan.empresaCotizacion)
        ? "inter_assist"
        : null

    let existingSaleId: string | null = null
    if (company === "inter_assist" && quotationData) {
      const qid = resolveInterAssistQuoteId(plan)
      const quote = buildInterAssistQuoteSnapshot(plan, quotationData)
      existingSaleId =
        getOpenSaleByStorageKey("inter_assist", interAssistStorageKey(qid, quote))?.saleId ??
        null
    } else if (company === "omint") {
      existingSaleId =
        getOpenSaleByStorageKey("omint", String(plan.id))?.saleId ?? null
    }

    setSelectedPlan(plan)
    setResumeCompany(company)
    setPaymentReturn(null)
    setResumeSaleId(existingSaleId)
    setView("emission")

    // Si ya hay venta emitida, el flujo abre detalle/éxito (no reinicia el wizard)
    if (existingSaleId) {
      void getSale(existingSaleId)
        .then((sale) => {
          if (String(sale.emission_status) === "issued") {
            toast.message("Venta ya emitida", {
              description: "Se abre el detalle del voucher.",
            })
          }
        })
        .catch(() => {
          // El flujo de emisión intentará abrir/crear de nuevo
        })
    }
  }

  const handleContinueSale = (req: ResumeSaleRequest) => {
    const binding = getOpenSaleBySaleId(req.saleId)
    setResumeSaleId(req.saleId)
    setResumeCompany(req.company || binding?.company || null)
    setPaymentReturn(null)
    if (binding?.plan && binding?.quotationData) {
      setSelectedPlan(binding.plan)
      setQuotationData(binding.quotationData)
    } else {
      setSelectedPlan(null)
      // Mantener quotationData previo solo si no hay binding; el resume-only flow no lo necesita
    }
    setView("emission")
  }

  const handleBackToResults = () => {
    // No borramos localStorage: la venta sigue abierta en el back.
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

  const handleNavigateToForm = () => setView("form")
  const handleNavigateToPromotions = () => setView("promotions")
  const handleNavigateToMySales = () => setView("my-sales")
  const handleNavigateToIssuances = () => setView("issuances")
  const handleNavigateToSettings = () => setView("settings")
  const handleNavigateToAdminUsersAgencies = () => setView("admin-users-agencies")
  const handleNavigateToAdminCreateAgency = () => setView("admin-create-agency")
  const handleNavigateToAdminCreateUser = () => setView("admin-create-user")
  const handleNavigateToAdminManagement = () => setView("admin-management")
  const handleNavigateToAdminPlans = () => setView("admin-plans")
  const handleNavigateToAdminPromotions = () => setView("admin-promotions")

  const showFullEmission = view === "emission" && selectedPlan && quotationData
  const showResumeOnlyEmission =
    view === "emission" && resumeSaleId && !(selectedPlan && quotationData)

  return (
    <SidebarProvider>
      <AppSidebar
        onNavigateToForm={handleNavigateToForm}
        onNavigateToPromotions={handleNavigateToPromotions}
        onNavigateToMySales={handleNavigateToMySales}
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
              quoteId={quoteIdForPlan(
                selectedPlan!,
                resumeCompany ||
                  (isOmintCompany(selectedPlan!.empresaCotizacion)
                    ? "omint"
                    : isInterAssistCompany(selectedPlan!.empresaCotizacion)
                      ? "inter_assist"
                      : null)
              )}
              initialSaleId={resumeSaleId}
              paymentReturn={paymentReturn}
            />
          )}
          {showResumeOnlyEmission && resumeCompany === "inter_assist" && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Retomar emisión Inter Assist
                </h2>
                <p className="text-xs text-muted-foreground">Venta {resumeSaleId}</p>
              </div>
              <InterAssistEmissionFlow
                initialSaleId={resumeSaleId}
                paymentReturn={paymentReturn}
                onBack={handleBack}
              />
            </div>
          )}
          {showResumeOnlyEmission && resumeCompany !== "inter_assist" && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Retomar emisión Omint</h2>
                <p className="text-xs text-muted-foreground">Venta {resumeSaleId}</p>
              </div>
              <OmintEmissionFlow
                initialSaleId={resumeSaleId}
                paymentReturn={paymentReturn}
                onBack={handleBack}
              />
            </div>
          )}
          {view === "promotions" && <PromotionsView />}
          {view === "my-sales" && <MySalesView onContinueSale={handleContinueSale} />}
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
