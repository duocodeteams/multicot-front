"use client"

import { Megaphone, Percent, Plane, Sparkles, Tag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const PROMOS = [
  {
    icon: Percent,
    title: "Promo del mes",
    description: "Aquí vas a ver descuentos y beneficios destacados para tu agencia.",
    badge: "Próximamente",
  },
  {
    icon: Plane,
    title: "Destinos en oferta",
    description: "Campañas especiales por región y tipo de viaje, actualizadas periódicamente.",
    badge: "Próximamente",
  },
  {
    icon: Sparkles,
    title: "Beneficios exclusivos",
    description: "Novedades y condiciones preferenciales pensadas para tu operación comercial.",
    badge: "Próximamente",
  },
] as const

export function PromotionsView() {
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
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rotate-12 border border-white/20 bg-white/5" />
        <div aria-hidden className="pointer-events-none absolute bottom-4 right-10 h-14 w-14 -rotate-6 border border-accent/40 bg-accent/10" />

        <div className="relative z-10 flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/30">
            <Megaphone className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
              Promociones
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Promociones del mes
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/70">
              Próximamente visualizarás aquí las promociones del mes. Ofertas y
              beneficios exclusivos para tu agencia, en un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROMOS.map(({ icon: Icon, title, description, badge }) => (
          <Card key={title} className="border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
            <CardHeader className="pb-2 pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  {badge}
                </span>
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <p className="text-xs text-muted-foreground">
                El detalle de esta promo estará disponible pronto.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
