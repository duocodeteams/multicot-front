"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarRange, Megaphone, RefreshCw, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  COMPANY_LOGO_COMPACT_CLASS,
  getCompanyInitial,
  getCompanyLogo,
} from "@/lib/company-logo"
import {
  formatPromotionDate,
  groupPromotionsByCompany,
  listPromotions,
} from "@/lib/services/promotions.service"
import type { PromotionResponse } from "@/lib/services/types"
import { toast } from "sonner"

export function PromotionsView() {
  const [items, setItems] = useState<PromotionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const res = await listPromotions({ status: "current", include_inactive: false })
      setItems(res.items ?? [])
    } catch (error: unknown) {
      console.error(error)
      toast.error("Error al cargar promociones", {
        description: error instanceof Error ? error.message : "No se pudo listar promociones",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const groups = groupPromotionsByCompany(items)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:px-7 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.4) 10px,
                rgba(255,255,255,0.4) 11px
              )
            `,
          }}
        />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/30">
              <Megaphone className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
                Promociones
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Promociones vigentes
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/70">
                Beneficios y condiciones especiales por compañía, en un solo lugar.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 self-start bg-white text-primary hover:bg-white/90 sm:self-center"
            onClick={() => void load(true)}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No hay promociones vigentes
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando haya campañas activas, las vas a ver acá agrupadas por compañía.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const logo = getCompanyLogo(group.company_name) ?? getCompanyLogo(group.company_slug)
            return (
              <section
                key={group.company_id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
                  {logo ? (
                    <img
                      src={logo}
                      alt={group.company_name}
                      className={COMPANY_LOGO_COMPACT_CLASS}
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {getCompanyInitial(group.company_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {group.company_name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {group.promotions.length}{" "}
                      {group.promotions.length === 1 ? "promoción" : "promociones"}
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-border">
                  {group.promotions.map((promo) => (
                    <li key={promo.id} className="px-4 py-4 sm:px-5">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {promo.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarRange className="h-3.5 w-3.5" />
                          {formatPromotionDate(promo.starts_on)} —{" "}
                          {formatPromotionDate(promo.ends_on)}
                        </span>
                      </div>
                      {promo.plans.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {promo.plans.map((plan) => (
                            <Badge
                              key={plan.id}
                              variant="secondary"
                              className="gap-1 font-normal"
                            >
                              <Tag className="h-3 w-3" />
                              {plan.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
