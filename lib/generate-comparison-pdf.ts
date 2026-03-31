import type { Plan } from "@/components/quotation-results"
import { getCompanyTheme, formatNumber } from "@/components/quotation-results"
import type { QuotationData } from "@/components/quotation-form"

const DESTINATION_LABELS: Record<string, string> = {
  "1001": "Europa",
  "1004": "Norteamérica",
  "1000": "Latinoamérica",
  "1003": "Resto del Mundo",
  "1002": "Nacional",
}

function uniqueCoverages(plan: Plan): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of plan.coverage) {
    const norm = item.toLowerCase().trim()
    if (!seen.has(norm)) { seen.add(norm); result.push(item) }
  }
  return result
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
}

// ── Convierte una imagen local a base64 para embeber en el HTML ───────────
async function toBase64(path: string): Promise<string | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── Función principal ─────────────────────────────────────────────────────
export async function downloadComparisonPDF(
  selected: Plan[],
  quotationData: QuotationData,
): Promise<void> {
  const fromDate  = new Date(quotationData.desde)
  const toDate    = new Date(quotationData.hasta)
  const days      = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
  const today     = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  const destLabel = DESTINATION_LABELS[quotationData.destino] || quotationData.destino

  const themes         = selected.map((p) => getCompanyTheme(p.empresaCotizacion))
  const coverages      = selected.map((p) => uniqueCoverages(p))
  const maxRows        = Math.max(...coverages.map((c) => c.length), 0)
  const origin         = typeof window !== "undefined" ? window.location.origin : ""

  // Precargar logos en base64 para que funcionen en la ventana nueva
  const logos = await Promise.all(
    themes.map((t) => (t.logo ? toBase64(`${origin}${t.logo}`) : Promise.resolve(null)))
  )

  // ── Plan header cards ──────────────────────────────────────────────────
  const planCols = selected.map((p, i) => {
    const t   = themes[i]
    const cov = coverages[i]
    const logoHtml = logos[i]
      ? `<img src="${logos[i]}" alt="${p.empresaCotizacion}"
              style="height:28px;max-width:110px;object-fit:contain;display:block;margin-bottom:6px;"/>`
      : ""
    return `
      <td style="
        width:${Math.floor(820 / selected.length)}px;
        padding:0; vertical-align:top;
        border-left:1px solid #1e293b;
      ">
        <!-- Barra gradiente compañía -->
        <div style="height:6px;background:linear-gradient(to right,${t.barFrom},${t.barTo});"></div>

        <!-- Identidad -->
        <div style="padding:14px 16px 12px;background:${t.priceBg};border-bottom:1px solid rgba(0,0,0,.06);">
          ${logoHtml}
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:7px;height:7px;border-radius:50%;background:${t.dotColor};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${t.labelColor};">${p.empresaCotizacion}</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;line-height:1.25;margin-bottom:10px;">${p.name}</div>

          <!-- Precio destacado -->
          <div style="
            background:${t.barFrom};
            border-radius:8px;
            padding:8px 12px;
            display:inline-block;
          ">
            <div style="font-size:9px;color:rgba(255,255,255,.75);font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px;">Precio total</div>
            <div style="font-size:18px;font-weight:900;color:#ffffff;line-height:1;">USD ${formatNumber(p.price)}</div>
          </div>

          <!-- Datos secundarios -->
          <div style="display:flex;gap:12px;margin-top:10px;">
            <div>
              <div style="font-size:8px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Por día</div>
              <div style="font-size:11px;font-weight:700;color:#1e293b;">USD ${formatNumber(p.pricePerDay)}</div>
            </div>
            <div>
              <div style="font-size:8px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Cob. máx.</div>
              <div style="font-size:11px;font-weight:700;color:#1e293b;">${p.maxCoverage}</div>
            </div>
            <div>
              <div style="font-size:8px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Prestaciones</div>
              <div style="font-size:11px;font-weight:700;color:#1e293b;">${cov.length}</div>
            </div>
          </div>
        </div>
      </td>`
  }).join("")

  // ── Filas de prestaciones ──────────────────────────────────────────────
  const covRows = Array.from({ length: maxRows }).map((_, ri) => {
    const isEven = ri % 2 === 0
    const rowBg  = isEven ? "#ffffff" : "#f1f5f9"
    const numBg  = isEven ? "#f8fafc" : "#e8edf4"

    const cells = selected.map((p, i) => {
      const t    = themes[i]
      const item = coverages[i][ri]
      return `
        <td style="
          padding:6px 14px;
          border-left:1px solid #e2e8f0;
          border-bottom:1px solid #e2e8f0;
          background:${rowBg};
          vertical-align:top;
        ">
          ${item
            ? `<div style="display:flex;align-items:flex-start;gap:6px;">
                 <span style="
                   color:#fff;
                   background:${t.dotColor};
                   font-size:8px;font-weight:900;
                   border-radius:50%;
                   width:14px;height:14px;
                   display:flex;align-items:center;justify-content:center;
                   flex-shrink:0;margin-top:1px;
                 ">✓</span>
                 <span style="font-size:10px;color:#1e293b;line-height:1.4;">${item}</span>
               </div>`
            : `<span style="font-size:14px;color:#cbd5e1;font-weight:300;">—</span>`}
        </td>`
    }).join("")

    return `
      <tr>
        <td style="
          padding:6px 12px;
          background:${numBg};
          border-bottom:1px solid #e2e8f0;
          border-right:1px solid #e2e8f0;
          vertical-align:middle;
          text-align:center;
        ">
          <span style="
            font-size:9px;font-weight:800;color:#94a3b8;
            font-variant-numeric:tabular-nums;
          ">${String(ri + 1).padStart(2, "0")}</span>
        </td>
        ${cells}
      </tr>`
  }).join("")

  // ── Trip info pills ────────────────────────────────────────────────────
  const pillStyle = `
    display:inline-flex;align-items:center;gap:5px;
    background:rgba(255,255,255,.1);
    border:1px solid rgba(255,255,255,.18);
    border-radius:99px;
    padding:4px 10px;
    font-size:9.5px;font-weight:600;color:rgba(255,255,255,.9);
    white-space:nowrap;
  `

  // ── HTML final ────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comparación de Planes · ${destLabel}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
      background:#ffffff;
      color:#0f172a;
    }
    .page{
      width:277mm;
      min-height:190mm;
      display:flex;
      flex-direction:column;
    }
    #scale-wrapper{flex:1;overflow:hidden;}
    #scale-content{transform-origin:top left;}
    @page{size:A4 landscape;margin:0;}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .page{width:297mm;}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ══ CABECERA PREMIUM ══════════════════════════════════════════════ -->
  <div style="
    background:linear-gradient(135deg,#0a0e1a 0%,#0f172a 50%,#1a1040 100%);
    padding:20px 28px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-shrink:0;
    gap:16px;
  ">
    <!-- Título -->
    <div style="flex-shrink:0;">
      <div style="
        font-size:7px;font-weight:700;letter-spacing:.25em;
        text-transform:uppercase;color:rgba(255,255,255,.4);
        margin-bottom:4px;
      ">Documento de cotización</div>
      <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-.5px;line-height:1.05;">
        Comparación
      </div>
      <div style="font-size:22px;font-weight:300;color:rgba(255,255,255,.6);letter-spacing:-.3px;line-height:1.05;">
        de Planes de Asistencia
      </div>
    </div>

    <!-- Pills de viaje -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;flex:1;">
      <span style="${pillStyle}">📍 ${destLabel}</span>
      <span style="${pillStyle}">📅 ${fmtDate(fromDate)} → ${fmtDate(toDate)}</span>
      <span style="${pillStyle}">🕐 ${days} día${days !== 1 ? "s" : ""}</span>
      <span style="${pillStyle}">👤 ${quotationData.edades.length} pax · ${quotationData.edades.join(", ")} años</span>
    </div>

    <!-- Fecha y badge -->
    <div style="text-align:right;flex-shrink:0;">
      <div style="
        display:inline-block;
        background:linear-gradient(to right,#6366f1,#8b5cf6);
        color:#fff;font-size:9px;font-weight:800;
        padding:4px 12px;border-radius:99px;
        text-transform:uppercase;letter-spacing:.07em;
        margin-bottom:6px;
      ">${selected.length} planes comparados</div>
      <div style="font-size:8.5px;color:rgba(255,255,255,.35);">Generado el ${today}</div>
    </div>
  </div>

  <!-- Línea decorativa arco iris de compañías -->
  <div style="display:flex;height:3px;flex-shrink:0;">
    ${themes.map((t) => `<div style="flex:1;background:linear-gradient(to right,${t.barFrom},${t.barTo});"></div>`).join("")}
  </div>

  <!-- ══ CONTENIDO ESCALABLE ══════════════════════════════════════════ -->
  <div id="scale-wrapper" style="flex:1;overflow:hidden;">
    <div id="scale-content">

      <!-- Tarjetas de plan -->
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <tr>
          <!-- Columna de índice -->
          <td style="width:50px;background:#0f172a;vertical-align:bottom;padding:12px 0 10px;">
            <div style="
              font-size:8px;font-weight:800;text-transform:uppercase;
              letter-spacing:.12em;color:#475569;
              text-align:center;
            ">#</div>
          </td>
          ${planCols}
        </tr>
      </table>

      <!-- ── Separador PRESTACIONES ── -->
      <div style="
        background:linear-gradient(to right,#0f172a,#1e3a5f);
        padding:8px 14px;
        display:flex;align-items:center;gap:10px;
      ">
        <div style="flex:0 0 50px;"></div>
        <div style="
          font-size:9px;font-weight:800;text-transform:uppercase;
          letter-spacing:.15em;color:#64748b;
        ">Prestaciones incluidas</div>
        ${selected.map((p, i) => `
          <div style="
            flex:1;text-align:center;
            font-size:8px;font-weight:700;text-transform:uppercase;
            letter-spacing:.06em;color:${themes[i].barTo};
            opacity:.8;
          ">${p.empresaCotizacion}</div>`).join("")}
      </div>

      <!-- ── Tabla de prestaciones ── -->
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        ${covRows}
      </table>

    </div>
  </div>

  <!-- ══ FOOTER ════════════════════════════════════════════════════════ -->
  <div style="
    background:#f8fafc;
    border-top:1px solid #e2e8f0;
    padding:7px 28px;
    display:flex;align-items:center;justify-content:space-between;
    flex-shrink:0;
  ">
    <span style="font-size:8px;color:#94a3b8;font-weight:500;">
      Precios en dólares estadounidenses (USD) · Documento de uso interno · No válido como póliza
    </span>
    <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:.05em;">
      multicotizador
    </span>
  </div>

</div>

<script>
  window.addEventListener('load', function () {
    var wrapper = document.getElementById('scale-wrapper');
    var content = document.getElementById('scale-content');
    if (wrapper && content) {
      var availH = wrapper.clientHeight;
      var contentH = content.scrollHeight;
      if (contentH > availH) {
        var scale = availH / contentH;
        content.style.transform = 'scale(' + scale + ')';
        content.style.width     = (100 / scale) + '%';
        content.style.height    = (availH / scale) + 'px';
      }
    }
    setTimeout(function () { window.print(); }, 400);
  });
<\/script>
</body>
</html>`

  const win = window.open("", "_blank", "width=1200,height=850")
  if (!win) {
    alert("Permitir ventanas emergentes para descargar el PDF.")
    return
  }
  win.document.write(html)
  win.document.close()
}
