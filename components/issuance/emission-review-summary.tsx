"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import type {
  FormFieldSchema,
  FormSectionSchema,
  IssuanceFormSchema,
  IssuanceFormValues,
} from "@/lib/issuance/types"
import { isFieldVisible } from "@/lib/issuance/schema-utils"

type EmissionReviewSummaryProps = {
  schema: IssuanceFormSchema
  values: IssuanceFormValues
  onEditSection: (sectionId: string) => void
}

function formatFieldValue(field: FormFieldSchema, raw: unknown): string {
  if (raw == null || raw === "") return "—"

  if (field.type === "select" && field.options) {
    const match = field.options.find((o) => o.value === String(raw))
    return match?.label ?? String(raw)
  }

  return String(raw)
}

export function EmissionReviewSummary({
  schema,
  values,
  onEditSection,
}: EmissionReviewSummaryProps) {
  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-base">Revisión</CardTitle>
        <CardDescription className="text-xs">
          Confirmá los datos antes de emitir. Podés volver a cualquier paso para editar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {schema.sections.map((section) => (
          <SectionReview
            key={section.id}
            section={section}
            values={values}
            onEdit={() => onEditSection(section.id)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function SectionReview({
  section,
  values,
  onEdit,
}: {
  section: FormSectionSchema
  values: IssuanceFormValues
  onEdit: () => void
}) {
  const visibleFields = section.fields.filter((f) => isFieldVisible(f, values))
  if (visibleFields.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section.title}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
          Editar
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {visibleFields.map((field) => {
          if (field.type === "array") {
            const items = Array.isArray(values[field.name])
              ? (values[field.name] as Record<string, unknown>[])
              : []
            return (
              <div key={field.name} className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                      {(field.itemLabel ?? "Ítem")} {index + 1}
                    </p>
                    <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {(field.itemFields ?? []).map((child) => (
                        <div key={child.name} className="flex justify-between gap-2 text-xs">
                          <dt className="text-muted-foreground shrink-0">{child.label}</dt>
                          <dd className="font-medium text-right truncate">
                            {formatFieldValue(child, item[child.name])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div key={field.name} className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground shrink-0">{field.label}</span>
              <span className="font-medium text-right break-words">
                {formatFieldValue(field, values[field.name])}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
