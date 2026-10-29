"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  isFieldRequired,
  isFieldVisible,
} from "@/lib/issuance/schema-utils"
import type {
  FormFieldSchema,
  FormSectionSchema,
  IssuanceFormSchema,
  IssuanceFormValues,
} from "@/lib/issuance/types"

type DynamicFormRendererProps = {
  schema: IssuanceFormSchema
  values: IssuanceFormValues
  errors: Record<string, string>
  onChange: (values: IssuanceFormValues) => void
  disabled?: boolean
  /** Si se pasa, solo renderiza esa sección (wizard step-by-step). */
  sectionId?: string
}

export function DynamicFormRenderer({
  schema,
  values,
  errors,
  onChange,
  disabled,
  sectionId,
}: DynamicFormRendererProps) {
  const setField = (name: string, value: unknown) => {
    onChange({ ...values, [name]: value })
  }

  const sections = sectionId
    ? schema.sections.filter((s) => s.id === sectionId)
    : schema.sections

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={setField}
          compact={Boolean(sectionId)}
        />
      ))}
    </div>
  )
}

type SectionCardProps = {
  section: FormSectionSchema
  values: IssuanceFormValues
  errors: Record<string, string>
  disabled?: boolean
  onChange: (name: string, value: unknown) => void
  compact?: boolean
}

function SectionCard({
  section,
  values,
  errors,
  disabled,
  onChange,
  compact,
}: SectionCardProps) {
  const visibleFields = section.fields.filter((f) => isFieldVisible(f, values))
  if (visibleFields.length === 0) return null

  const scalarFields = visibleFields.filter((f) => f.type !== "array")
  const arrayFields = visibleFields.filter((f) => f.type === "array")

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className={cn("pb-3", compact ? "pt-4" : "pt-4")}>
        <CardTitle className="text-base">{section.title}</CardTitle>
        {section.description && (
          <CardDescription className="text-xs">{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {scalarFields.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scalarFields.map((field) => (
              <FieldControl
                key={field.name}
                field={field}
                values={values}
                errors={errors}
                disabled={disabled}
                onChange={onChange}
              />
            ))}
          </div>
        )}
        {arrayFields.map((field) => (
          <FieldControl
            key={field.name}
            field={field}
            values={values}
            errors={errors}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </CardContent>
    </Card>
  )
}

type FieldControlProps = {
  field: FormFieldSchema
  values: IssuanceFormValues
  errors: Record<string, string>
  disabled?: boolean
  onChange: (name: string, value: unknown) => void
}

function FieldControl({ field, values, errors, disabled, onChange }: FieldControlProps) {
  if (field.type === "array") {
    return (
      <ArrayField
        field={field}
        values={values}
        errors={errors}
        disabled={disabled}
        onChange={onChange}
      />
    )
  }

  const required = isFieldRequired(field, values)
  const error = errors[field.name]
  const rawValue = values[field.name]
  const value = rawValue == null ? "" : String(rawValue)
  const readOnly = field.readOnly || field.type === "readonly" || disabled

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.name} className="text-sm">
        {field.label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {field.type === "select" ? (
        <Select
          value={value || undefined}
          onValueChange={(v) => onChange(field.name, v)}
          disabled={readOnly}
        >
          <SelectTrigger id={field.name} className={cn(error && "border-destructive")}>
            <SelectValue placeholder={field.placeholder || "Seleccionar"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.name}
          type={field.type === "readonly" ? "text" : field.type}
          value={value}
          placeholder={field.placeholder}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            error && "border-destructive",
            readOnly && "bg-muted/50 text-muted-foreground"
          )}
        />
      )}

      {field.helpText && !error && (
        <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

function ArrayField({ field, values, errors, disabled, onChange }: FieldControlProps) {
  const items = Array.isArray(values[field.name])
    ? (values[field.name] as Record<string, unknown>[])
    : []
  const min = field.minItems ?? 1
  const max = field.maxItems ?? 10
  const itemFields = field.itemFields ?? []
  const listError = errors[field.name]

  const updateItem = (index: number, childName: string, childValue: unknown) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [childName]: childValue } : item
    )
    onChange(field.name, next)
  }

  const addItem = () => {
    if (items.length >= max) return
    const blank: Record<string, unknown> = {}
    for (const child of itemFields) blank[child.name] = ""
    onChange(field.name, [...items, blank])
  }

  const removeItem = (index: number) => {
    if (items.length <= min) return
    onChange(
      field.name,
      items.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {listError && <p className="text-[11px] text-destructive">{listError}</p>}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {(field.itemLabel ?? "Ítem")} {index + 1}
            </p>
            {items.length > min && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(index)}
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {itemFields.map((child) => {
              const childKey = `${field.name}.${index}.${child.name}`
              const childError = errors[childKey]
              const childValue = item[child.name] == null ? "" : String(item[child.name])
              const required = isFieldRequired(child, values)

              return (
                <div key={child.name} className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    {child.label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  {child.type === "select" ? (
                    <Select
                      value={childValue || undefined}
                      onValueChange={(v) => updateItem(index, child.name, v)}
                      disabled={disabled}
                    >
                      <SelectTrigger className={cn(childError && "border-destructive")}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {(child.options ?? []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={child.type === "readonly" ? "text" : child.type}
                      value={childValue}
                      placeholder={child.placeholder}
                      disabled={disabled}
                      onChange={(e) => updateItem(index, child.name, e.target.value)}
                      className={cn(childError && "border-destructive")}
                    />
                  )}
                  {childError && (
                    <p className="text-[11px] text-destructive">{childError}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5"
          onClick={addItem}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar {field.itemLabel ?? "ítem"}
        </Button>
      )}
    </div>
  )
}
