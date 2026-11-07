"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  buildCredentialsPayload,
  getCredentialFieldsForItem,
  validateCredentialValues,
  valuesFromCredentials,
} from "@/lib/agency-credentials-fields"
import {
  describeAgencyCredentialsError,
  useAgencyCredentials,
} from "@/hooks/use-agency-credentials"
import { useAuth } from "@/lib/auth-context"
import type { AgencyCredentialItem } from "@/lib/services/types"

function isAdminRole(role: string | null | undefined): boolean {
  const normalized = String(role ?? "").toLowerCase()
  return normalized === "admin" || normalized === "1"
}

type CompanyCredentialsFormProps = {
  agencyId: number
  item: AgencyCredentialItem
  isSaving: boolean
  isDeleting: boolean
  disabled: boolean
  onSave: (companySlug: string, values: Record<string, string>) => Promise<void>
  onDelete: (companySlug: string) => Promise<void>
}

function CompanyCredentialsForm({
  agencyId,
  item,
  isSaving,
  isDeleting,
  disabled,
  onSave,
  onDelete,
}: CompanyCredentialsFormProps) {
  const fields = useMemo(() => getCredentialFieldsForItem(item), [item])
  const [values, setValues] = useState<Record<string, string>>(() =>
    valuesFromCredentials(fields, item.uses_default ? null : item.credentials)
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setValues(valuesFromCredentials(fields, item.uses_default ? null : item.credentials))
    setFieldErrors({})
    setShowSecrets({})
    setConfirmReset(false)
  }, [item, fields])

  const busy = disabled || isSaving || isDeleting
  const usesDefault = item.uses_default

  const handleSave = async () => {
    const errors = validateCredentialValues(fields, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSave(item.company_slug, buildCredentialsPayload(fields, values))
      toast.success(`Credenciales de ${item.company_name} guardadas`, {
        description: "Esta agencia va a cotizar con sus propias credenciales.",
      })
    } catch (saveError) {
      toast.error("No se pudieron guardar", {
        description: describeAgencyCredentialsError(saveError, "save", item.company_name),
      })
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(item.company_slug)
      setConfirmReset(false)
      toast.success("Credenciales del servidor", {
        description: `${item.company_name} volvió a usar las credenciales genéricas.`,
      })
    } catch (deleteError) {
      toast.error("No se pudieron restaurar", {
        description: describeAgencyCredentialsError(deleteError, "delete", item.company_name),
      })
    }
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="font-semibold text-foreground">{item.company_name}</h5>
        {usesDefault ? (
          <Badge variant="secondary">Usando credenciales del servidor</Badge>
        ) : (
          <Badge variant="outline">Credenciales propias</Badge>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todavía no hay formulario definido para <span className="font-medium">{item.company_slug}</span>.
          Cuando el back agregue el schema, va a aparecer acá.
        </p>
      ) : (
        <>
          {usesDefault ? (
            <p className="text-xs text-muted-foreground">
              El formulario está vacío porque el servidor no devuelve las credenciales genéricas.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Esta agencia usa credenciales propias de {item.company_name}.
            </p>
          )}

          {fields.map((field) => {
            const inputId = `${item.company_slug}-${field.key}-${agencyId}`
            const error = fieldErrors[field.key]
            const isSecret = field.type === "password"
            const showSecret = Boolean(showSecrets[field.key])

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={inputId}>{field.label}</Label>
                <div className={isSecret ? "flex gap-2" : undefined}>
                  <Input
                    id={inputId}
                    type={isSecret && !showSecret ? "password" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setValues((current) => ({ ...current, [field.key]: nextValue }))
                      if (fieldErrors[field.key]) {
                        setFieldErrors((current) => {
                          const next = { ...current }
                          delete next[field.key]
                          return next
                        })
                      }
                    }}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    aria-invalid={Boolean(error)}
                  />
                  {isSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setShowSecrets((current) => ({
                          ...current,
                          [field.key]: !current[field.key],
                        }))
                      }
                      disabled={busy}
                      aria-label={showSecret ? `Ocultar ${field.label}` : `Mostrar ${field.label}`}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                {error ? (
                  <p className="text-xs text-destructive">{error}</p>
                ) : field.help ? (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                ) : null}
              </div>
            )
          })}

          {confirmReset && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">¿Usar las credenciales genéricas del servidor?</p>
              <p className="mt-1 text-muted-foreground">
                Se eliminan las credenciales propias de {item.company_name} de esta agencia. La próxima
                cotización va a usar las del servidor.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={() => void handleDelete()} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Usar genéricas
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {!usesDefault && !confirmReset && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(true)}
                disabled={busy}
              >
                Usar genéricas del servidor
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => void handleSave()} disabled={busy}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

type AgencyCredentialsSectionProps = {
  agencyId: number
}

export function AgencyCredentialsSection({ agencyId }: AgencyCredentialsSectionProps) {
  const { user } = useAuth()
  const isAdmin = isAdminRole(user?.role)
  const {
    items,
    isLoading,
    savingSlug,
    deletingSlug,
    error,
    reload,
    saveCredentials,
    deleteCredentials,
  } = useAgencyCredentials(isAdmin ? agencyId : null)

  useEffect(() => {
    if (!error) return
    toast.error("Error al cargar credenciales", { description: error })
  }, [error])

  if (!isAdmin) return null

  const sectionBusy = Boolean(savingSlug || deletingSlug)

  return (
    <section className="rounded-lg border p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Credenciales
        </h4>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Credenciales propias por compañía. Si una compañía usa las del servidor, el formulario queda vacío.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void reload().catch(() => undefined)}
          >
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay compañías con credenciales configurables para esta agencia.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CompanyCredentialsForm
              key={item.company_slug}
              agencyId={agencyId}
              item={item}
              isSaving={savingSlug === item.company_slug}
              isDeleting={deletingSlug === item.company_slug}
              disabled={sectionBusy && savingSlug !== item.company_slug && deletingSlug !== item.company_slug}
              onSave={async (companySlug, values) => {
                await saveCredentials(companySlug, values)
              }}
              onDelete={async (companySlug) => {
                await deleteCredentials(companySlug)
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
