"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { getCompanyTheme } from "@/components/quotation-results"
import {
  getCompanyInitial,
  getCompanyLogo,
} from "@/lib/company-logo"
import {
  formatPromotionDate,
  listPromotions,
} from "@/lib/services/promotions.service"
import type { PromotionResponse } from "@/lib/services/types"
import { cn } from "@/lib/utils"

type PromotionsBannerProps = {
  onNavigateToPromotions?: () => void
}

const AUTOPLAY_MS = 4000

function PromotionsBannerSkeleton() {
  return (
    <div className="mb-3" aria-hidden>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <Skeleton className="h-[3px] w-full rounded-none" />
        <div className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 px-4 py-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </div>
    </div>
  )
}

function PromoSlide({
  promo,
  onNavigate,
}: {
  promo: PromotionResponse
  onNavigate?: () => void
}) {
  const theme = getCompanyTheme(promo.company_name || promo.company_slug)
  const logo =
    getCompanyLogo(promo.company_name) ?? getCompanyLogo(promo.company_slug)
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="group flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-[box-shadow,transform] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]"
      style={{ borderColor: theme.priceBorder }}
    >
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: `linear-gradient(to right, ${theme.barFrom}, ${theme.barTo})` }}
      />

      <div
        className="flex min-h-[72px] flex-col items-center justify-center gap-1 px-8 py-2.5 text-center sm:min-h-[76px] sm:px-12 sm:py-3"
        style={{ background: theme.priceBg }}
      >
        {logo && !logoFailed ? (
          <img
            src={logo}
            alt={promo.company_name}
            className="h-6 w-auto max-w-[110px] object-contain object-center sm:h-7"
            draggable={false}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: `${theme.dotColor}18`, color: theme.dotColor }}
            >
              {getCompanyInitial(promo.company_name)}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.labelColor }}
            >
              {promo.company_name}
            </span>
          </div>
        )}

        <p className="max-w-2xl text-sm font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
          {promo.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarRange className="h-3 w-3 shrink-0" style={{ color: theme.dotColor }} />
            {formatPromotionDate(promo.starts_on)} — {formatPromotionDate(promo.ends_on)}
          </p>
          {promo.plans.slice(0, 2).map((plan) => (
            <Badge
              key={plan.id}
              variant="secondary"
              className="h-4 border bg-background/80 px-1.5 text-[9px] font-medium"
              style={{
                borderColor: theme.priceBorder,
                color: theme.labelColor,
              }}
            >
              {plan.name}
            </Badge>
          ))}
          {promo.plans.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{promo.plans.length - 2}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function PromotionsBanner({ onNavigateToPromotions }: PromotionsBannerProps) {
  const [promos, setPromos] = useState<PromotionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await listPromotions({ status: "current", include_inactive: false })
        if (!cancelled) setPromos(res.items ?? [])
      } catch {
        if (!cancelled) setPromos([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  // Autoplay: avanza solo; se pausa solo al pasar el mouse
  useEffect(() => {
    if (!api || promos.length <= 1 || isHovered) return

    const id = window.setInterval(() => {
      const next = (api.selectedScrollSnap() + 1) % promos.length
      api.scrollTo(next)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [api, promos.length, isHovered])

  const goTo = useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api]
  )

  if (isLoading) return <PromotionsBannerSkeleton />
  if (promos.length === 0) return null

  const showControls = promos.length > 1
  const activeTheme = getCompanyTheme(
    promos[current]?.company_name || promos[current]?.company_slug || ""
  )

  return (
    <div
      className="mb-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {showControls && (
          <button
            type="button"
            aria-label="Promoción anterior"
            onClick={() => api?.scrollPrev()}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-foreground shadow-sm transition-colors hover:bg-muted/40 sm:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {promos.map((promo) => (
                <CarouselItem key={promo.id} className="basis-full pl-0">
                  <PromoSlide promo={promo} onNavigate={onNavigateToPromotions} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {showControls && (
          <button
            type="button"
            aria-label="Promoción siguiente"
            onClick={() => api?.scrollNext()}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-foreground shadow-sm transition-colors hover:bg-muted/40 sm:flex"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showControls && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {promos.map((promo, index) => (
            <button
              key={promo.id}
              type="button"
              aria-label={`Ir a promo de ${promo.company_name}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === current ? "w-4" : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/45"
              )}
              style={
                index === current
                  ? { background: activeTheme.dotColor }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
