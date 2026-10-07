"use client"

import { useEffect, useState } from "react"
import { CalendarRange, Megaphone, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  markPromotionsModalSeen,
  shouldShowPromotionsModal,
} from "@/lib/promotions-modal"
import { useAuth } from "@/lib/auth-context"
import {
  getCompanyInitial,
  getCompanyLogo,
} from "@/lib/company-logo"
import {
  formatPromotionDate,
  listPromotions,
} from "@/lib/services/promotions.service"
import type { PromotionResponse } from "@/lib/services/types"

const OPEN_DELAY_MS = 1200

function DiagonalPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.35) 10px,
            rgba(255,255,255,0.35) 11px
          )
        `,
      }}
    />
  )
}

function AbstractSquares() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-6 -top-8 h-28 w-28 rotate-12 border border-white/20 bg-white/5" />
      <div className="absolute right-4 top-10 h-16 w-16 -rotate-6 border border-accent/40 bg-accent/10" />
      <div className="absolute -right-8 bottom-8 h-24 w-24 rotate-[20deg] border border-white/15 bg-white/[0.04]" />
    </div>
  )
}

type PromotionsModalProps = {
  onNavigateToPromotions?: () => void
}

export function PromotionsModal({ onNavigateToPromotions }: PromotionsModalProps) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [promos, setPromos] = useState<PromotionResponse[]>([])

  useEffect(() => {
    if (!shouldShowPromotionsModal(token)) return

    let cancelled = false
    let timer: number | undefined

    void (async () => {
      try {
        const res = await listPromotions({ status: "current", include_inactive: false })
        if (cancelled) return
        const items = res.items ?? []
        if (items.length === 0) return
        setPromos(items)
        timer = window.setTimeout(() => {
          if (!cancelled) setOpen(true)
        }, OPEN_DELAY_MS)
      } catch {
        // Sin promos o error de red: no molestar al usuario
      }
    })()

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [token])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      markPromotionsModalSeen(token)
    }
  }

  const preview = promos.slice(0, 4)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-xl overflow-hidden border-0 bg-transparent p-0 shadow-none sm:w-full"
        aria-describedby="promotions-modal-description"
      >
        <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-2xl ring-1 ring-white/10">
          <DiagonalPattern />
          <AbstractSquares />

          <div className="relative z-10 p-5 sm:p-7">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-4 sm:top-4"
              aria-label="Cerrar promociones"
            >
              <X className="h-4 w-4" />
            </button>

            <DialogHeader className="space-y-2 text-left">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30">
                  <Megaphone className="h-4 w-4 text-accent" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
                  Vigentes
                </span>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Promociones del mes
              </DialogTitle>
              <DialogDescription
                id="promotions-modal-description"
                className="text-sm leading-relaxed text-white/70"
              >
                {promos.length} promoción{promos.length === 1 ? "" : "es"} vigente
                {promos.length === 1 ? "" : "s"} para tu agencia.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 max-h-[40vh] space-y-3 overflow-y-auto sm:mt-6">
              {preview.map((promo) => {
                const logo =
                  getCompanyLogo(promo.company_name) ??
                  getCompanyLogo(promo.company_slug)

                return (
                  <div
                    key={promo.id}
                    className="rounded-xl border border-white/15 bg-white/[0.07] p-3.5 backdrop-blur-[2px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-white/20">
                        {logo ? (
                          <img
                            src={logo}
                            alt={promo.company_name}
                            className="h-7 w-auto max-w-[34px] object-contain"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {getCompanyInitial(promo.company_name)}
                          </span>
                        )}
                      </div>
                      <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-accent">
                        {promo.company_name}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-snug text-white">
                      {promo.description}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/60">
                      <CalendarRange className="h-3.5 w-3.5" />
                      {formatPromotionDate(promo.starts_on)} —{" "}
                      {formatPromotionDate(promo.ends_on)}
                    </p>
                    {promo.plans.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {promo.plans.slice(0, 4).map((plan) => (
                          <Badge
                            key={plan.id}
                            variant="secondary"
                            className="bg-white/15 text-[10px] font-normal text-white hover:bg-white/20"
                          >
                            {plan.name}
                          </Badge>
                        ))}
                        {promo.plans.length > 4 && (
                          <Badge
                            variant="secondary"
                            className="bg-white/10 text-[10px] font-normal text-white/70"
                          >
                            +{promo.plans.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
              {onNavigateToPromotions && (
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => {
                    handleOpenChange(false)
                    onNavigateToPromotions()
                  }}
                >
                  Ver todas
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
