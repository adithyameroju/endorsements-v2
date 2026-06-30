import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type CdProformaPdfInput = {
  invoiceRef: string
  amountInr: number
  requestedAt: Date
  employerName: string
  gstin?: string
}

/** ASCII-safe for pdf-lib StandardFonts (WinAnsi cannot encode ₹). */
function formatInrForPdf(amount: number): string {
  const n = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
  return `Rs. ${n}`
}

function formatInvoiceDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TEMPLATE_PATH = `${import.meta.env.BASE_URL}documents/cd-proforma-template.pdf`

/**
 * Loads the ACKO proforma template and stamps dynamic recharge details.
 * The source PDF is image-based (no AcroForm); overlays keep the branded layout intact.
 */
export async function generateCdProformaPdf(input: CdProformaPdfInput): Promise<Uint8Array> {
  const res = await fetch(TEMPLATE_PATH)
  if (!res.ok) throw new Error('Proforma template unavailable')
  const templateBytes = await res.arrayBuffer()

  const pdfDoc = await PDFDocument.load(templateBytes)
  const page = pdfDoc.getPages()[0]
  const { width, height } = page.getSize()

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const amountStr = formatInrForPdf(input.amountInr)
  const dateStr = formatInvoiceDate(input.requestedAt)

  // Top-right: reference + amount (white backing for readability on template art)
  const badgeW = 168
  const badgeH = 44
  const badgeX = width - badgeW - 28
  const badgeY = height - badgeH - 36
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: rgb(1, 1, 1),
    opacity: 0.94,
    borderColor: rgb(0.82, 0.82, 0.86),
    borderWidth: 0.75,
  })
  page.drawText(input.invoiceRef, {
    x: badgeX + 10,
    y: badgeY + 26,
    size: 10,
    font: bold,
    color: rgb(0.12, 0.12, 0.14),
  })
  page.drawText(amountStr, {
    x: badgeX + 10,
    y: badgeY + 10,
    size: 11,
    font: bold,
    color: rgb(0.22, 0.16, 0.64),
  })

  // Mid-page amount line (typical line-item column)
  const lineY = height * 0.42
  page.drawRectangle({
    x: width - 200,
    y: lineY - 4,
    width: 172,
    height: 18,
    color: rgb(1, 1, 1),
    opacity: 0.92,
  })
  page.drawText(amountStr, {
    x: width - 192,
    y: lineY,
    size: 10,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  })

  // Footer strip: payment + employer context
  const footerH = 88
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: footerH,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.88, 0.9),
    borderWidth: 0.5,
  })
  page.drawRectangle({
    x: 0,
    y: footerH - 3,
    width,
    height: 3,
    color: rgb(0.22, 0.16, 0.64),
  })

  let fy = 62
  page.drawText(`Proforma ref: ${input.invoiceRef}   ·   Date: ${dateStr}`, {
    x: 32,
    y: fy,
    size: 9,
    font: bold,
    color: rgb(0.15, 0.15, 0.18),
  })
  fy -= 14
  page.drawText(`Amount payable: ${amountStr}`, {
    x: 32,
    y: fy,
    size: 10,
    font: bold,
    color: rgb(0.1, 0.1, 0.12),
  })
  fy -= 14
  page.drawText(`Bill to: ${input.employerName}${input.gstin ? `  ·  GSTIN ${input.gstin}` : ''}`, {
    x: 32,
    y: fy,
    size: 8.5,
    font: regular,
    color: rgb(0.25, 0.25, 0.28),
  })
  fy -= 12
  page.drawText(
    'After transfer, share your UTR with ACKO so we can credit your CD wallet. Bank details are on this invoice.',
    { x: 32, y: fy, size: 8, font: regular, color: rgb(0.4, 0.4, 0.45) },
  )

  return pdfDoc.save()
}

export function downloadProformaPdfBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function proformaDownloadFilename(employerName: string, invoiceRef: string): string {
  const safe = employerName.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim()
  return `ACKO-${safe}-Proforma_Invoice-${invoiceRef}.pdf`
}
