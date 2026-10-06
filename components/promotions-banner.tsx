"use client"

import { Megaphone } from "lucide-react"

export function PromotionsBanner() {
  return (
    <div className="mb-4 md:mb-5">
      <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-r from-primary/[0.06] via-white to-accent/[0.08]">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-secondary" />

        <div className="flex items-start gap-3 px-3.5 py-3 pl-4 sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 sm:h-10 sm:w-10">
            <Megaphone className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="mb-0.5 inline-block text-[10px] font-semibold uppercase tracking-wider text-accent sm:text-xs">
              Próximamente
            </span>
            <p className="text-sm font-medium leading-snug text-foreground sm:text-[15px]">
              Próximamente visualizarás aquí las promociones del mes
            </p>
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
              Ofertas y beneficios exclusivos para tu agencia, en un solo lugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
