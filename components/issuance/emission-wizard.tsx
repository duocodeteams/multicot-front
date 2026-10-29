"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Loader2,
  FileCheck2,
  AlertCircle,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { DynamicFormRenderer } from "@/components/issuance/dynamic-form-renderer"
import { EmissionReviewSummary } from "@/components/issuance/emission-review-summary"
import { createIssuance, getIssuanceSchema } from "@/lib/services"
import {
  buildInitialValues,
  isFieldVisible,
  normalizeCompanyCode,
  validateSchemaValues,
  validateSectionValues,
} from "@/lib/issuance/schema-utils"
import { cn } from "@/lib/utils"
import type {
  CreateIssuanceResult,
  IssuanceFormSchema,
  IssuanceFormValues,
} from "@/lib/issuance/types"
import type { QuotationData } from "@/components/quotation-form"
import type { SelectedPlan } from "@/lib/issuance/types"

const REVIEW_STEP_ID = "__review__"

type Phase = "form" | "submitting" | "success" | "error"
type WizardStepItem = { id: string; title: string }

type EmissionWizardProps = {
  plan: SelectedPlan
  quotationData: QuotationData
  quotationId?: string
}

export function EmissionWizard({ plan, quotationData, quotationId }: EmissionWizardProps) {
  const [schema, setSchema] = useState<IssuanceFormSchema | null>(null)
  const [values, setValues] = useState<IssuanceFormValues>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingSchema, setLoadingSchema] = useState(true)
  const [phase, setPhase] = useState<Phase>("form")
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState<CreateIssuanceResult | null>(null)

  const companyCode = normalizeCompanyCode(plan.empresaCotizacion)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingSchema(true)
      setStepIndex(0)
      setPhase("form")
      setErrors({})
      setResult(null)
      try {
        const nextSchema = await getIssuanceSchema({
          companyCode: plan.empresaCotizacion,
          companyName: plan.empresaCotizacion,
          planId: plan.id,
        })
        if (cancelled) return

        const context = {
          quotation: quotationData as unknown as Record<string, unknown>,
          plan: plan as unknown as Record<string, unknown>,
        }
        const initial = buildInitialValues(nextSchema, context)

        if (Array.isArray(initial.passengers) && quotationData.edades.length > 0) {
          const passengerFields =
            nextSchema.sections
              .flatMap((s) => s.fields)
              .find((f) => f.name === "passengers" && f.type === "array")?.itemFields ?? []

          initial.passengers = quotationData.edades.map(() => {
            const blank: Record<string, unknown> = {}
            for (const child of passengerFields) blank[child.name] = ""
            return blank
          })
        }

        setSchema(nextSchema)
        setValues(initial)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el formulario"
        toast.error("Error al cargar esquema", { description: message })
      } finally {
        if (!cancelled) setLoadingSchema(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [plan, quotationData])

  const visibleSections = useMemo(() => {
    if (!schema) return []
    return schema.sections.filter((section) =>
      section.fields.some((field) => isFieldVisible(field, values))
    )
  }, [schema, values])

  const wizardSteps: WizardStepItem[] = useMemo(
    () => [
      ...visibleSections.map((s) => ({ id: s.id, title: s.title })),
      { id: REVIEW_STEP_ID, title: "Revisión" },
    ],
    [visibleSections]
  )

  const currentStep = wizardSteps[stepIndex]
  const currentSection =
    currentStep && currentStep.id !== REVIEW_STEP_ID
      ? visibleSections.find((s) => s.id === currentStep.id)
      : undefined
  const isReviewStep = currentStep?.id === REVIEW_STEP_ID
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === wizardSteps.length - 1
  const totalSteps = wizardSteps.length

  useEffect(() => {
    if (totalSteps > 0 && stepIndex > totalSteps - 1) {
      setStepIndex(totalSteps - 1)
    }
  }, [stepIndex, totalSteps])

  const handleValuesChange = (next: IssuanceFormValues) => {
    setValues(next)
    if (Object.keys(errors).length > 0 && currentSection) {
      setErrors(validateSectionValues(currentSection, next))
    }
  }

  const goNext = () => {
    if (isReviewStep) return
    if (!currentSection) return
    const sectionErrors = validateSectionValues(currentSection, values)
    setErrors(sectionErrors)
    if (Object.keys(sectionErrors).length > 0) {
      toast.error("Completá este paso", {
        description: "Hay campos obligatorios sin completar",
      })
      return
    }
    setErrors({})
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1))
  }

  const goBack = () => {
    setErrors({})
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const goToStep = (index: number) => {
    if (index <= stepIndex) {
      setErrors({})
      setStepIndex(index)
    }
  }

  const editSection = (sectionId: string) => {
    const index = wizardSteps.findIndex((s) => s.id === sectionId)
    if (index >= 0) {
      setErrors({})
      setStepIndex(index)
    }
  }

  const handleSubmit = async () => {
    if (!schema) return

    const allErrors = validateSchemaValues(schema, values)
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) {
      const firstBadIndex = visibleSections.findIndex((section) =>
        Object.keys(allErrors).some((key) =>
          section.fields.some((f) => key === f.name || key.startsWith(`${f.name}.`))
        )
      )
      if (firstBadIndex >= 0) setStepIndex(firstBadIndex)
      toast.error("Revisá el formulario", {
        description: "Hay campos obligatorios sin completar",
      })
      return
    }

    setPhase("submitting")
    try {
      const response = await createIssuance({
        quotationId,
        planId: plan.id,
        companyCode: schema.companyCode || companyCode,
        idempotencyKey: crypto.randomUUID(),
        values,
      })
      setResult(response)
      setPhase(response.status === "error" ? "error" : "success")
      if (response.status !== "error") {
        toast.success("Emisión procesada", {
          description: response.message,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al emitir"
      setResult({
        id: "",
        status: "error",
        message,
      })
      setPhase("error")
      toast.error("Error al emitir", { description: message })
    }
  }

  const resetToForm = () => {
    setPhase("form")
    setStepIndex(0)
    setErrors({})
  }

  if (loadingSchema) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center gap-3 py-10 justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando formulario de emisión…
        </CardContent>
      </Card>
    )
  }

  if (!schema) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          No hay esquema de emisión disponible para esta compañía.
        </CardContent>
      </Card>
    )
  }

  if (phase === "success" && result) {
    return (
      <Card className="border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <CardHeader className="pb-2 pt-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Emisión registrada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{result.message}</p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2">
            {result.id && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">ID interno</span>
                <span className="font-mono text-xs">{result.id}</span>
              </div>
            )}
            {result.externalPolicyId && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Referencia</span>
                <span className="font-mono text-xs">{result.externalPolicyId}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Estado</span>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {result.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" onClick={resetToForm} className="w-fit">
            Volver al formulario
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "error" && result) {
    return (
      <Card className="border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-destructive/80 to-destructive/40" />
        <CardHeader className="pb-2 pt-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">No se pudo emitir</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{result.message}</p>
          <Button variant="outline" onClick={resetToForm} className="w-fit">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const submitting = phase === "submitting"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <FileCheck2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground leading-tight">
              Formulario de emisión
            </h3>
            <p className="text-xs text-muted-foreground">
              {schema.companyName} · paso {stepIndex + 1} de {totalSteps}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          Mock · dinámico
        </Badge>
      </div>

      <StepIndicator
        sections={wizardSteps}
        currentIndex={stepIndex}
        onSelect={goToStep}
      />

      {isReviewStep ? (
        <EmissionReviewSummary
          schema={schema}
          values={values}
          onEditSection={editSection}
        />
      ) : (
        currentSection && (
          <DynamicFormRenderer
            schema={schema}
            sectionId={currentSection.id}
            values={values}
            errors={errors}
            onChange={handleValuesChange}
            disabled={submitting}
          />
        )
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto gap-2"
          onClick={goBack}
          disabled={isFirstStep || submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        {isLastStep ? (
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Emitiendo…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirmar y emitir
              </>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2"
            onClick={goNext}
            disabled={submitting}
          >
            {stepIndex === totalSteps - 2 ? "Ir a revisión" : "Siguiente"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

type StepIndicatorProps = {
  sections: WizardStepItem[]
  currentIndex: number
  onSelect: (index: number) => void
}

function StepIndicator({ sections, currentIndex, onSelect }: StepIndicatorProps) {
  return (
    <nav aria-label="Pasos del formulario" className="w-full">
      {/* Mobile: barra + etiqueta */}
      <div className="sm:hidden flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground truncate pr-2">
            {sections[currentIndex]?.title}
          </span>
          <span>
            {currentIndex + 1}/{sections.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / Math.max(sections.length, 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: pasos clicables */}
      <ol className="hidden sm:grid gap-2" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
        {sections.map((section, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          const clickable = index < currentIndex

          return (
            <li key={section.id} className="relative min-w-0">
              {index < sections.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[calc(50%+18px)] right-[-50%] top-3.5 h-px",
                    done ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onSelect(index)}
                className={cn(
                  "relative z-[1] flex flex-col items-center gap-1.5 w-full min-w-0",
                  clickable && "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border transition-colors bg-background",
                    done && "bg-primary border-primary text-primary-foreground",
                    active && "bg-primary/10 border-primary text-primary",
                    !done && !active && "border-border text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] text-center leading-tight truncate w-full px-1",
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {section.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
