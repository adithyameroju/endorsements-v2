import { X, Download, Loader2, Zap, Lock } from 'lucide-react'
import {
  endorsementNumber,
  entryCdImpactSignedInr,
  cdImpactDirectionLabel,
  formatCdImpactDisplayCompact,
  formatShortDate,
} from './endorsementScheduleShared'
import { deriveActionCategory } from './endorsementLogTableCells'

const MODAL_SHELL =
  'relative w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-xl'

const MOCK_POLICY_NUMBER = 'GHI-2024-001'

function formatModalEndorsementId(row) {
  return endorsementNumber(row)
}

function actionTypeBadgeLabel(row) {
  const cat = row.actionCategory ?? deriveActionCategory(row.action)
  if (cat === 'Addition') return '+ Addition'
  if (cat === 'Deletion') return '− Deletion'
  return cat
}

function ModalBackdrop({ onClose, closable = true }) {
  if (!closable) {
    return <div className="absolute inset-0 bg-black/40" aria-hidden />
  }
  return <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close modal" onClick={onClose} />
}

/** Generated schedule PDF — iframe preview + download. */
export function ScheduleDocumentViewerModal({
  open,
  scheduleRef,
  pdfUrl,
  loading,
  onClose,
  onDownload,
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <ModalBackdrop onClose={onClose} />
      <div className={MODAL_SHELL} role="dialog" aria-modal="true" aria-labelledby="schedule-viewer-title">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id="schedule-viewer-title" className="text-sm font-bold text-gray-900">
            Schedule {scheduleRef}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {loading || !pdfUrl ? (
          <div className="flex items-center justify-center px-4 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
          </div>
        ) : (
          <iframe title={`Schedule ${scheduleRef}`} src={pdfUrl} className="h-[min(75vh,680px)] w-full border-0" />
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!pdfUrl}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0">
      <dt className="shrink-0 text-xs text-gray-500">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-medium text-gray-900">{children}</dd>
    </div>
  )
}

/** Pending schedule — preview summary before generation. */
export function SchedulePreviewGenerateModal({
  open,
  row,
  onClose,
  onGenerate,
}) {
  if (!open || !row) return null
  const endorsementId = formatModalEndorsementId(row)
  const membersCount = Number(row.count) || 0
  const cdImpactSigned = entryCdImpactSignedInr(row)
  const cdImpactLabel = cdImpactDirectionLabel(row)

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <ModalBackdrop onClose={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-schedule-title"
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <Zap className="h-5 w-5 text-amber-500" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="generate-schedule-title" className="text-base font-bold text-gray-900">
              Generate Schedule
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">Generating schedule for {endorsementId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <dl className="rounded-xl border border-sky-100 bg-sky-50/30 px-4 py-1">
            <SummaryRow label="Endorsement ID">
              <span className="font-mono font-semibold">{endorsementId}</span>
            </SummaryRow>
            <SummaryRow label="Type">
              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {actionTypeBadgeLabel(row)}
              </span>
            </SummaryRow>
            <SummaryRow label="Members affected">
              {membersCount} {membersCount === 1 ? 'life' : 'lives'}
            </SummaryRow>
            <SummaryRow label="Effective date">
              {formatShortDate(row.recordedAt || row.date)}
            </SummaryRow>
            <SummaryRow label="Policy">{MOCK_POLICY_NUMBER}</SummaryRow>
            <SummaryRow label={cdImpactLabel}>
              <span
                className={`text-sm font-bold tabular-nums ${cdImpactSigned < 0 ? 'text-emerald-700' : 'text-indigo-600'}`}
              >
                {formatCdImpactDisplayCompact(row)}
              </span>
            </SummaryRow>
          </dl>

          <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-snug text-gray-500">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>Once generated, this schedule PDF is final and can&apos;t be edited.</span>
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Zap className="h-4 w-4 shrink-0 text-amber-200" aria-hidden />
            Generate Now
          </button>
        </div>
      </div>
    </div>
  )
}

/** Batch confirm — generate one clubbed schedule for all pending endorsements. */
export function ScheduleBatchConfirmModal({
  open,
  pendingCount,
  generating = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null
  const n = Number(pendingCount) || 0
  const lifeWord = n === 1 ? 'endorsement' : 'endorsements'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <ModalBackdrop onClose={generating ? undefined : onClose} closable={!generating} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-generate-schedule-title"
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
            <Zap className="h-5 w-5 text-indigo-600" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="batch-generate-schedule-title" className="text-base font-bold text-gray-900">
              Generate endorsement schedule
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Confirm generation for all pending endorsements in your portfolio.
            </p>
          </div>
          {!generating ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-gray-700">
            Generate endorsement schedule for{' '}
            <span className="font-semibold tabular-nums text-gray-900">{n}</span> pending {lifeWord}?
            All included rows will be clubbed into one insurer schedule batch.
          </p>
          <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-snug text-gray-500">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>Once generated, this schedule PDF is final and can&apos;t be edited.</span>
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            disabled={generating}
            onClick={onClose}
            className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={generating || n === 0}
            onClick={onConfirm}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Zap className="h-4 w-4 shrink-0 text-indigo-200" aria-hidden />
            )}
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { PORTAL_TABLE_TH_CLASS } from '../../lib/dataTableLayout'

export const ENDORSEMENT_TABLE_TH_CLASS = PORTAL_TABLE_TH_CLASS

export const ENDORSEMENT_TABLE_ICON_BTN =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-0 bg-[#f3f4f6] text-[#4b5563] transition-colors cursor-pointer hover:bg-gray-200 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#f3f4f6] disabled:hover:text-[#4b5563]'

/** Shared row-level primary CTA sizing (Generate, View, Fix, Track). */
export const ENDORSEMENT_TABLE_PRIMARY_CTA_BASE =
  'inline-flex h-7 min-w-[4.75rem] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border-0 px-2 text-[11px] font-semibold shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40'

export const ENDORSEMENT_SCHEDULE_GENERATE_BTN =
  `${ENDORSEMENT_TABLE_PRIMARY_CTA_BASE} bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500/30 disabled:hover:bg-indigo-600`

export const ENDORSEMENT_SCHEDULE_VIEW_BTN =
  `${ENDORSEMENT_TABLE_PRIMARY_CTA_BASE} bg-[#f0f2ff] text-[#4c46d9] hover:bg-[#e6eaff] focus-visible:ring-[#4c46d9]/35`

export const ENDORSEMENT_TABLE_FIX_BTN =
  `${ENDORSEMENT_TABLE_PRIMARY_CTA_BASE} bg-red-50 text-red-700 hover:bg-red-100/95 focus-visible:ring-red-300`

export const ENDORSEMENT_TABLE_TRACK_BTN =
  `${ENDORSEMENT_TABLE_PRIMARY_CTA_BASE} bg-amber-50 text-amber-900 hover:bg-amber-100/95 focus-visible:ring-amber-300`
