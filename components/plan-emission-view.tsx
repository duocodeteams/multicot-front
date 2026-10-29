"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuotationData } from "@/components/quotation-form"
import { EmissionWizard } from "@/components/issuance/emission-wizard"
import { PlanSummarySidebar } from "@/components/issuance/plan-summary-sidebar"
import { normalizeCompanyCode } from "@/lib/issuance/schema-utils"
import type { SelectedPlan } from "@/lib/issuance/types"

export type { SelectedPlan }

type PlanEmissionViewProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  onBack: () => void
  onBackToForm?: () => void
  quotationId?: string
}

/** Fallback temporal mientras no todas las compañías tengan API de emisión */
const portalUrls: Record<string, string> = {
  cardinalassistance: "https://evoucher.cardinalassistance.com/bo/login",
  universalassistance: "https://ar.ec.universal-assistance.com/Emision/Login",
  newtravelassistance: "https://newtravelassistance.page/app/pages/login.php",
  goassistance: "https://back.goassistance.com/v3/Ingresar?ReturnUrl=%2Fv3%2F",
}

// ── Componente principal ──────────────────────────────────
export function PlanEmissionView({
  plan,
  quotationData,
  onBack,
  onBackToForm,
  quotationId,
}: PlanEmissionViewProps) {
  const portalUrl = portalUrls[normalizeCompanyCode(plan.empresaCotizacion)]

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground leading-tight">Emitir plan</h2>
          <p className="text-xs text-muted-foreground">
            Completá el formulario para emitir la asistencia seleccionada
          </p>
        </div>
      </div>

      {/* Resumen compacto solo en mobile */}
      <PlanSummarySidebar
        plan={plan}
        quotationData={quotationData}
        portalUrl={portalUrl}
        variant="compact"
      />

      {/* Layout: formulario (foco) + sidebar derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <div className="min-w-0 flex flex-col gap-4">
          <EmissionWizard
            plan={plan}
            quotationData={quotationData}
            quotationId={quotationId}
          />

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

        {/* Banner lateral — desktop */}
        <div className="hidden lg:block">
          <PlanSummarySidebar
            plan={plan}
            quotationData={quotationData}
            portalUrl={portalUrl}
            variant="sidebar"
          />
        </div>
      </div>
    </div>
  )
}
