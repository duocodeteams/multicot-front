"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuotationForm, type QuotationData } from "@/components/quotation-form"
import { QuotationResults, QuotationResultsSkeleton } from "@/components/quotation-results"

type ViewState = "form" | "loading" | "results"

export function DashboardView() {
  const [view, setView] = useState<ViewState>("form")
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)

  const handleSubmit = async (data: QuotationData) => {
    setQuotationData(data)
    setView("loading")
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setView("results")
  }

  const handleBack = () => {
    setView("form")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {view === "form" && (
            <QuotationForm onSubmit={handleSubmit} isLoading={false} />
          )}
          {view === "loading" && <QuotationResultsSkeleton />}
          {view === "results" && quotationData && (
            <QuotationResults data={quotationData} onBack={handleBack} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
