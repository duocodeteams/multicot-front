"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuotationData } from "@/components/quotation-form"
import { EmissionWizard } from "@/components/issuance/emission-wizard"
import { OmintEmissionFlow } from "@/components/issuance/omint-emission-flow"
import { InterAssistEmissionFlow } from "@/components/issuance/inter-assist-emission-flow"
import { PlanSummarySidebar } from "@/components/issuance/plan-summary-sidebar"
import { normalizeCompanyCode } from "@/lib/issuance/schema-utils"
import { isOmintCompany } from "@/lib/issuance/omint-session"
import { isInterAssistCompany } from "@/lib/issuance/inter-assist-session"
import type { SalePaymentReturnStatus } from "@/lib/issuance/sales-types"
import type { SelectedPlan } from "@/lib/issuance/types"

export type { SelectedPlan }

type PlanEmissionViewProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  onBack: () => void
  onBackToForm?: () => void
  /** Omint: quotationId|productId. Inter Assist: plan_id. */
  quoteId?: string
  initialSaleId?: string | null
  paymentReturn?: SalePaymentReturnStatus | null
}

/** Fallback portal mientras no haya API de emisión para esa compañía */
const portalUrls: Record<string, string> = {
  cardinalassistance: "https://evoucher.cardinalassistance.com/bo/login",
  universalassistance: "https://ar.ec.universal-assistance.com/Emision/Login",
  newtravelassistance: "https://newtravelassistance.page/app/pages/login.php",
  goassistance: "https://back.goassistance.com/v3/Ingresar?ReturnUrl=%2Fv3%2F",
  interassist: "https://interassist.com/auth/login",
  interassistance: "https://interassist.com/auth/login",
  inter: "https://interassist.com/auth/login",
  omint: "https://core.omintassistance.com.ar/Account/Login",
  omintassistance: "https://core.omintassistance.com.ar/Account/Login",
  omintassist: "https://core.omintassistance.com.ar/Account/Login",
  terrawind: "https://emision.terrawind.us/",
  terrawindglobalprotection: "https://emision.terrawind.us/",
}

export function PlanEmissionView({
  plan,
  quotationData,
  onBack,
  onBackToForm,
  quoteId,
  initialSaleId,
  paymentReturn,
}: PlanEmissionViewProps) {
  const companyKey = normalizeCompanyCode(plan.empresaCotizacion)
  const portalUrl = portalUrls[companyKey]
  const omint = isOmintCompany(plan.empresaCotizacion)
  const interAssist = isInterAssistCompany(plan.empresaCotizacion)
  const hasApiEmission = omint || interAssist
  const resolvedQuoteId = quoteId || String(plan.id)

  const [saleAmount, setSaleAmount] = useState<number | null>(null)
  const [saleCurrency, setSaleCurrency] = useState<string | undefined>(undefined)

  const subtitle = omint
    ? `${plan.empresaCotizacion} · Completá los datos para emitir`
    : interAssist
      ? `${plan.empresaCotizacion} · Pasajeros, pago simulado y voucher`
      : "Completá el formulario para emitir la asistencia seleccionada"

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground leading-tight truncate">
            {plan.name}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <PlanSummarySidebar
        plan={plan}
        quotationData={quotationData}
        portalUrl={hasApiEmission ? undefined : portalUrl}
        saleAmount={hasApiEmission ? saleAmount : null}
        saleCurrency={saleCurrency}
        variant="compact"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <div className="min-w-0 flex flex-col gap-4">
          {omint ? (
            <OmintEmissionFlow
              quoteId={resolvedQuoteId}
              plan={plan}
              quotationData={quotationData}
              initialSaleId={initialSaleId}
              paymentReturn={paymentReturn}
              onSaleAmountChange={(amount, currency) => {
                setSaleAmount(amount)
                setSaleCurrency(currency)
              }}
              onBack={onBack}
            />
          ) : interAssist ? (
            <InterAssistEmissionFlow
              plan={plan}
              quotationData={quotationData}
              initialSaleId={initialSaleId}
              paymentReturn={paymentReturn}
              onSaleAmountChange={(amount, currency) => {
                setSaleAmount(amount)
                setSaleCurrency(currency)
              }}
              onBack={onBack}
            />
          ) : (
            <EmissionWizard plan={plan} quotationData={quotationData} quotationId={quoteId} />
          )}

          <div className="flex justify-center pb-2 lg:justify-start">
            <Button
              variant="ghost"
              onClick={onBackToForm || onBack}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <PlanSummarySidebar
            plan={plan}
            quotationData={quotationData}
            portalUrl={hasApiEmission ? undefined : portalUrl}
            saleAmount={hasApiEmission ? saleAmount : null}
            saleCurrency={saleCurrency}
            variant="sidebar"
          />
        </div>
      </div>
    </div>
  )
}
