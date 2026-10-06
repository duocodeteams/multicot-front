/** Número de soporte WhatsApp (mismo para ayuda y cotizaciones grupales). */
export function getSupportPhone(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "")
}

export function getSupportWhatsAppUrl(message: string): string {
  const phone = getSupportPhone()
  const text = encodeURIComponent(message)
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
}
