import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import {
  deriveActionCategory,
  deriveActorType,
  deriveRunModeLabel,
  formatDoneBySummary,
} from '../../lib/endorsementRowDisplay'

export { formatDoneBySummary, deriveRunModeLabel, deriveActionCategory }

/** For Result column: explicit split or inferred from status + count */
export function resolveOutcomeCounts(row) {
  const total = Number(row.count) || 0
  if (typeof row.successCount === 'number' && typeof row.failedCount === 'number') {
    const sum = row.successCount + row.failedCount
    return {
      ok: row.successCount,
      fail: row.failedCount,
      total: sum > 0 ? sum : total,
    }
  }
  if (row.status === 'Success') return { ok: total, fail: 0, total }
  if (row.status === 'Failed') return { ok: 0, fail: total, total }
  return { ok: null, fail: null, total }
}

/** User-facing endorsement outcome — derives Partial success from success/fail counts. */
export function resolveEndorsementDisplayStatus(row) {
  if (row._batchDisplayStatus) return row._batchDisplayStatus
  if (row.status === 'Processing' || row.status === 'In Progress') return row.status
  const { ok, fail } = resolveOutcomeCounts(row)
  if (ok != null && fail != null) {
    if (ok > 0 && fail > 0) return 'Partial success'
    if (ok === 0 && fail > 0) return 'Failed'
    if (ok > 0 && fail === 0) return 'Success'
  }
  return row.status ?? 'Failed'
}

/** True when at least one record succeeded (schedule generation allowed). */
export function hasSuccessfulEndorsementRecords(row) {
  const { ok } = resolveOutcomeCounts(row)
  if (ok != null) return ok > 0
  return row.status === 'Success'
}

export function endorsementDisplayStatusSortRank(status) {
  const order = {
    Processing: 0,
    'In Progress': 1,
    Success: 2,
    'Partial success': 3,
    Failed: 4,
  }
  return order[status] ?? 5
}

export function ResultCountCell({ row }) {
  const { ok, fail, total } = resolveOutcomeCounts(row)
  if (row.status === 'Processing' || row.status === 'In Progress') {
    return (
      <span className="text-[12px] font-normal text-gray-500 tabular-nums">
        {total > 0 ? `${total} in batch` : '—'}
      </span>
    )
  }
  if (ok === null) return <span className="text-[12px] font-normal text-gray-400">—</span>
  return (
    <span className="text-[12px] font-normal tabular-nums leading-snug text-gray-600">
      <span className="text-emerald-600">{ok}</span>
      <span>/{total}</span>
      {fail > 0 && <span className="text-red-500"> ({fail} failed)</span>}
    </span>
  )
}

export function formatHistoryTableDateTime(row) {
  const iso = row.recordedAt || `${row.date}T12:00:00`
  const d = new Date(iso)
  return {
    dateLine: d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    timeLine: d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

export function EndorsementLogDateCell({ row }) {
  const { dateLine, timeLine } = formatHistoryTableDateTime(row)
  return (
    <div>
      <div className="text-[12px] font-normal leading-tight text-gray-800">{dateLine}</div>
      <div className="mt-0.5 text-[10px] font-normal tabular-nums leading-tight text-gray-400">{timeLine}</div>
    </div>
  )
}

function modificationSecondaryLine(row, cat) {
  const explicit = typeof row.activityDetail === 'string' ? row.activityDetail.trim() : ''
  if (explicit) return explicit
  if (cat === 'Modification') return 'Updated employee or coverage details'
  return ''
}

/** Plain-text category; modification rows get an optional secondary hint line. */
export function EndorsementActivityCell({ row, singleLineSubtext = false }) {
  const cat = row.actionCategory ?? deriveActionCategory(row.action)
  const secondary = modificationSecondaryLine(row, cat)
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-normal leading-snug text-gray-900">{cat}</p>
      {secondary ? (
        <p
          className={`mt-0.5 text-[10px] font-normal text-gray-500 ${
            singleLineSubtext ? 'truncate leading-tight' : 'leading-snug'
          }`}
          title={secondary}
        >
          {secondary}
        </p>
      ) : null}
    </div>
  )
}

const MODE_BADGE = {
  Quick: 'border-gray-200 bg-gray-50 text-gray-800',
  Bulk: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  HRMS: 'border-violet-200 bg-violet-50 text-violet-900',
  'App enrolment': 'border-teal-200 bg-teal-50 text-teal-900',
}

export function EndorsementRunModeCell({ row }) {
  if (row.isScheduleBatchRow) {
    return (
      <span
        className="inline-flex max-w-full rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-900"
        title="Combined schedule"
      >
        Combined
      </span>
    )
  }
  const mode = deriveRunModeLabel(row)
  const cls = MODE_BADGE[mode] || MODE_BADGE.Quick
  return (
    <span className={`inline-flex max-w-full rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cls}`} title={mode}>
      {mode}
    </span>
  )
}

export function EndorsementDoneByCell({ row }) {
  if (deriveActorType(row) === 'system') {
    return (
      <span className="block truncate text-[12px] font-normal text-gray-800" title="System">
        System
      </span>
    )
  }
  return (
    <span className="block truncate text-[12px] font-normal text-gray-800" title={row.doneBy}>
      {row.doneBy}
    </span>
  )
}

/** Plain-text result summary for CSV export */
export function historyRowResultCsvSummary(row) {
  const { ok, fail, total } = resolveOutcomeCounts(row)
  if (row.status === 'Processing' || row.status === 'In Progress') {
    return total > 0 ? `${total} in batch` : '—'
  }
  if (ok === null) return '—'
  return fail > 0 ? `${ok}/${total} (${fail} failed)` : `${ok}/${total}`
}

/** Matches endorsement history table status pills */
export function EndorsementLogStatusBadge({ status, compact = false }) {
  const textCls = compact ? 'text-[10px]' : 'text-xs'
  const iconSize = compact ? 10 : 12
  const base = `inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 ${textCls} font-medium`

  if (status === 'Processing') {
    return (
      <span className={`${base} bg-indigo-50 text-indigo-700`}>
        <Loader2 size={iconSize} className="shrink-0 animate-spin text-indigo-600" aria-hidden />
        <span className="truncate">Processing</span>
      </span>
    )
  }
  if (status === 'In Progress') {
    return (
      <span className={`${base} bg-amber-50 text-amber-800`}>
        <Clock size={iconSize} className="shrink-0 animate-spin text-amber-700" aria-hidden />
        <span className="truncate">In progress</span>
      </span>
    )
  }
  if (status === 'Success') {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        <CheckCircle2 size={iconSize} className="shrink-0" aria-hidden />
        <span className="truncate">Success</span>
      </span>
    )
  }
  if (status === 'Partial success') {
    return (
      <span className={`${base} bg-amber-50 text-amber-800`}>
        <AlertCircle size={iconSize} className="shrink-0" aria-hidden />
        <span className="truncate">Partial success</span>
      </span>
    )
  }
  return (
    <span className={`${base} bg-red-50 text-red-700`}>
      <AlertCircle size={iconSize} className="shrink-0" aria-hidden />
      <span className="truncate">Failed</span>
    </span>
  )
}
