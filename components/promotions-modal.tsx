"use client"

import { useEffect, useState } from "react"
import { Megaphone, Percent, Plane, Sparkles, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  markPromotionsModalSeen,
  shouldShowPromotionsModal,
} from "@/lib/promotions-modal"

const OPEN_DELAY_MS = 1200

const PLACEHOLDER_PROMOS = [
  {
    icon: Percent,
    title: "Promo del mes",
    description: "Aquí vas a ver descuentos y beneficios destacados para tu agencia.",
  },
  {
    icon: Plane,
    title: "Destinos en oferta",
    description: "Próximamente: campañas especiales por región y tipo de viaje.",
  },
  {
    icon: Sparkles,
    title: "Beneficios exclusivos",
    description: "Novedades y condiciones preferenciales, actualizadas cada mes.",
  },
] as const

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
      <div className="absolute bottom-16 left-10 h-12 w-12 rotate-45 border border-white/25 bg-white/[0.06]" />
      <div className="absolute left-1/2 top-1/3 h-20 w-20 -translate-x-1/2 rotate-[8deg] border border-white/10 bg-primary/20" />
    </div>
  )
}

export function PromotionsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!shouldShowPromotionsModal()) return

    const timer = window.setTimeout(() => {
      setOpen(true)
    }, OPEN_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      markPromotionsModalSeen()
    }
  }

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
                  Próximamente
                </span>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Promociones del mes
              </DialogTitle>
              <DialogDescription
                id="promotions-modal-description"
                className="text-sm leading-relaxed text-white/70"
              >
                Próximamente visualizarás aquí las promociones del mes. Este aviso
                vuelve a aparecer cada 7 días.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3">
              {PLACEHOLDER_PROMOS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/15 bg-white/[0.07] p-3.5 backdrop-blur-[2px] sm:p-4"
                >
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-md bg-accent/15">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => handleOpenChange(false)}
              >
                Ver más tarde
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
