import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type EndorsementSchedulePdfInput = {
  scheduleRef: string
  endorsementNo: string
  activity: string
  amountInr: number
  generatedAt: Date
}

function formatInrForPdf(amount: number): string {
  const n = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
  return `Rs. ${n}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Demo invoice schedule PDF (replace with template / API in production). */
export async function generateEndorsementSchedulePdf(input: EndorsementSchedulePdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { height } = page.getSize()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = height - 72
  page.drawText('ACKO — Endorsement invoice schedule', { x: 48, y, size: 16, font: bold, color: rgb(0.15, 0.15, 0.2) })
  y -= 28
  page.drawText(`Schedule ref: ${input.scheduleRef}`, { x: 48, y, size: 11, font: bold })
  y -= 18
  page.drawText(`Endorsement no.: ${input.endorsementNo}`, { x: 48, y, size: 10, font: regular })
  y -= 16
  page.drawText(`Generated: ${formatDate(input.generatedAt)}`, { x: 48, y, size: 10, font: regular })
  y -= 28
  page.drawRectangle({ x: 48, y: y - 80, width: 499, height: 80, borderColor: rgb(0.85, 0.85, 0.88), borderWidth: 1 })
  y -= 20
  page.drawText('Activity', { x: 60, y, size: 9, font: bold, color: rgb(0.4, 0.4, 0.45) })
  y -= 14
  const activity =
    input.activity.length > 90 ? `${input.activity.slice(0, 87)}…` : input.activity
  page.drawText(activity, { x: 60, y, size: 10, font: regular })
  y -= 24
  page.drawText(`CD impact: ${formatInrForPdf(input.amountInr)}`, { x: 60, y, size: 11, font: bold })

  page.drawText('Demo document — for illustration only.', {
    x: 48,
    y: 48,
    size: 8,
    font: regular,
    color: rgb(0.5, 0.5, 0.55),
  })

  return pdfDoc.save()
}

export function downloadSchedulePdfBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function schedulePdfFilename(scheduleRef: string): string {
  return `ACKO-Schedule-${scheduleRef}.pdf`
}
