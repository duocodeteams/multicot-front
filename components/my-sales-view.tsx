"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMySales } from "@/hooks/use-my-sales"
import {
  downloadVoucherPdf,
  type MySaleListItem,
} from "@/lib/services"
import type { Sale, SaleCompanySlug } from "@/lib/issuance/sales-types"
import { getOpenSaleBySaleId } from "@/lib/issuance/sale-persistence"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const EMISSION_LABELS: Record<string, string> = {
  product_selected: "Producto seleccionado",
  passengers_complete: "Pasajeros cargados",
  emitting: "Emitiendo",
  issued: "Emitida",
  emission_failed: "Emisión fallida",
  cancelled: "Cancelada",
}

const PAYMENT_LABELS: Record<string, string> = {
  not_started: "Sin cobro",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
}

export type ResumeSaleRequest = {
  saleId: string
  company: SaleCompanySlug | null
}

type MySalesViewProps = {
  onContinueSale: (req: ResumeSaleRequest) => void
}

function companyLabel(sale: Sale): string {
  if (sale.company_name) return sale.company_name
  const raw = String(sale.company || "").toLowerCase()
  if (raw.includes("inter")) return "Inter Assist"
  if (raw.includes("omint")) return "Omint"
  return sale.company || "—"
}

function planLabel(sale: Sale): string {
  return sale.plan_name || (sale.plan_id != null ? `Plan ${sale.plan_id}` : "—")
}

function formatAmount(amount: number | string | null | undefined, currency?: string) {
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n)) return "—"
  const cur = (currency || "USD").toUpperCase()
  return `${cur} ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`
}

function formatTripDates(sale: Sale): string {
  const from = sale.departure_date
  const to = sale.return_date
  if (!from && !to) return "—"
  const fmt = (iso: string) => {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }
  if (from && to) return `${fmt(from)} → ${fmt(String(to))}`
  if (from) return fmt(from)
  return fmt(String(to))
}

function emissionBadgeClass(status: string): string {
  switch (status) {
    case "issued":
      return "bg-emerald-600 text-white hover:bg-emerald-600 border-transparent"
    case "emitting":
      return "bg-sky-600 text-white hover:bg-sky-600 border-transparent"
    case "passengers_complete":
      return "bg-amber-500 text-white hover:bg-amber-500 border-transparent"
    case "emission_failed":
      return "bg-destructive text-destructive-foreground hover:bg-destructive border-transparent"
    case "cancelled":
      return "bg-muted text-muted-foreground hover:bg-muted"
    case "product_selected":
    default:
      return "bg-muted text-muted-foreground hover:bg-muted"
  }
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-emerald-600/15 text-emerald-700 border-emerald-600/30"
    case "pending":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30"
    case "rejected":
      return "bg-destructive/15 text-destructive border-destructive/30"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function resolveCompany(sale: Sale, saleId: string): SaleCompanySlug | null {
  const fromStore = getOpenSaleBySaleId(saleId)?.company
  if (fromStore) return fromStore
  const raw = String(sale.company || "").toLowerCase()
  if (raw.includes("inter")) return "inter_assist"
  if (raw.includes("omint")) return "omint"
  return null
}

function continueLabel(sale: Sale): string | null {
  const emission = String(sale.emission_status || "")
  const payment = String(sale.payment_status || "")

  if (emission === "issued") return null
  if (emission === "cancelled") return null
  if (emission === "emission_failed") return "Reintentar"
  if (emission === "product_selected") return "Continuar · Pasajeros"
  if (emission === "passengers_complete" || payment === "pending" || payment === "not_started") {
    return "Continuar · Pago"
  }
  if (emission === "emitting") return "Ver estado"
  return "Continuar"
}

function canShowVoucher(sale: Sale): boolean {
  return (
    String(sale.emission_status) === "issued" &&
    Boolean(sale.voucher_number || sale.voucher_url || sale.id)
  )
}

export function MySalesView({ onContinueSale }: MySalesViewProps) {
  const { items, loading, error, reload } = useMySales()
  const [openingPdfId, setOpeningPdfId] = useState<string | null>(null)

  const handleOpenPdf = async (saleId: string) => {
    setOpeningPdfId(saleId)
    try {
      await downloadVoucherPdf(saleId, "es")
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo abrir el PDF"
      toast.error("Error al abrir voucher", { description: message })
    } finally {
      setOpeningPdfId(null)
    }
  }

  const handleContinue = (sale: Sale, saleId: string) => {
    const company = resolveCompany(sale, saleId)
    // Preferir plan/quotation guardados para retomar con sidebar completo
    const binding = getOpenSaleBySaleId(saleId)
    onContinueSale({
      saleId,
      company: company || binding?.company || null,
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">Mis ventas</h2>
            <p className="text-xs text-muted-foreground">
              Emisiones Inter Assist y Omint iniciadas desde este panel.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 w-fit"
          onClick={() => void reload()}
          disabled={loading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
          <CardTitle className="text-base">Listado</CardTitle>
          <CardDescription className="text-xs">
            Mientras no exista el listado del backend, se muestran las ventas guardadas en este
            dispositivo.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tus ventas…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-center">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground px-4">
              <ShoppingBag className="h-5 w-5" />
              <p className="font-medium text-foreground">Todavía no tenés ventas</p>
              <p className="text-center text-xs max-w-sm">
                Cuando cotices e inicies una emisión de Inter Assist u Omint, van a aparecer acá
                para retomar o ver el voucher.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="flex flex-col gap-2 px-4 pb-4 sm:hidden">
                {items.map((item) => (
                  <SaleMobileCard
                    key={item.saleId}
                    item={item}
                    openingPdfId={openingPdfId}
                    onOpenPdf={handleOpenPdf}
                    onContinue={handleContinue}
                  />
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compañía</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <SaleTableRow
                        key={item.saleId}
                        item={item}
                        openingPdfId={openingPdfId}
                        onOpenPdf={handleOpenPdf}
                        onContinue={handleContinue}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {items.length} venta{items.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

function SaleActions({
  item,
  openingPdfId,
  onOpenPdf,
  onContinue,
  compact,
}: {
  item: Extract<MySaleListItem, { status: "ok" }>
  openingPdfId: string | null
  onOpenPdf: (id: string) => void
  onContinue: (sale: Sale, saleId: string) => void
  compact?: boolean
}) {
  const { sale, saleId } = item
  const voucher = canShowVoucher(sale)
  const label = continueLabel(sale)
  const busy = openingPdfId === saleId

  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "justify-end" : "")}>
      {voucher && (
        <Button
          type="button"
          size="sm"
          className="gap-1.5 h-8"
          disabled={busy}
          onClick={() => onOpenPdf(saleId)}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          Ver PDF
        </Button>
      )}
      {label && (
        <Button
          type="button"
          size="sm"
          variant={voucher ? "outline" : "default"}
          className="gap-1.5 h-8"
          onClick={() => onContinue(sale, saleId)}
        >
          {label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
      {String(sale.emission_status) === "emission_failed" && (
        <p className="w-full text-[11px] text-destructive">
          La emisión falló. Podés reintentar la confirmación si el pago ya está aprobado.
        </p>
      )}
    </div>
  )
}

function SaleMobileCard({
  item,
  openingPdfId,
  onOpenPdf,
  onContinue,
}: {
  item: MySaleListItem
  openingPdfId: string | null
  onOpenPdf: (id: string) => void
  onContinue: (sale: Sale, saleId: string) => void
}) {
  if (item.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col gap-1">
        <p className="text-sm font-medium">Venta {item.saleId}</p>
        <p className="text-[11px] text-destructive">{item.error}</p>
      </div>
    )
  }

  const { sale } = item
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{companyLabel(sale)}</p>
          <p className="text-[11px] text-muted-foreground truncate">{planLabel(sale)}</p>
        </div>
        <Badge className={cn("shrink-0 text-[10px]", emissionBadgeClass(String(sale.emission_status)))}>
          {EMISSION_LABELS[String(sale.emission_status)] || sale.emission_status}
        </Badge>
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{formatTripDates(sale)}</span>
        <span className="font-medium text-foreground">
          {formatAmount(sale.amount, sale.currency)}
        </span>
      </div>
      <Badge
        variant="outline"
        className={cn("w-fit text-[10px]", paymentBadgeClass(String(sale.payment_status)))}
      >
        Pago: {PAYMENT_LABELS[String(sale.payment_status)] || sale.payment_status}
      </Badge>
      <SaleActions
        item={item}
        openingPdfId={openingPdfId}
        onOpenPdf={onOpenPdf}
        onContinue={onContinue}
      />
    </div>
  )
}

function SaleTableRow({
  item,
  openingPdfId,
  onOpenPdf,
  onContinue,
}: {
  item: MySaleListItem
  openingPdfId: string | null
  onOpenPdf: (id: string) => void
  onContinue: (sale: Sale, saleId: string) => void
}) {
  if (item.status === "error") {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-xs text-destructive">
          Venta {item.saleId}: {item.error}
        </TableCell>
      </TableRow>
    )
  }

  const { sale } = item
  return (
    <TableRow>
      <TableCell className="text-sm font-medium whitespace-nowrap">
        {companyLabel(sale)}
      </TableCell>
      <TableCell className="text-xs max-w-[180px] truncate">{planLabel(sale)}</TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTripDates(sale)}
      </TableCell>
      <TableCell className="text-right text-sm font-medium whitespace-nowrap">
        {formatAmount(sale.amount, sale.currency)}
      </TableCell>
      <TableCell>
        <Badge className={cn("text-[10px]", emissionBadgeClass(String(sale.emission_status)))}>
          {EMISSION_LABELS[String(sale.emission_status)] || sale.emission_status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("text-[10px]", paymentBadgeClass(String(sale.payment_status)))}
        >
          {PAYMENT_LABELS[String(sale.payment_status)] || sale.payment_status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <SaleActions
          item={item}
          openingPdfId={openingPdfId}
          onOpenPdf={onOpenPdf}
          onContinue={onContinue}
          compact
        />
      </TableCell>
    </TableRow>
  )
}
