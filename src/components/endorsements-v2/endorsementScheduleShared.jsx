import { CheckCircle2, Clock, Download, FileDown, Loader2 } from 'lucide-react'
import { formatInr } from '../../lib/currencyFormat'
import {
  historyRowResultCsvSummary,
  formatDoneBySummary,
  deriveRunModeLabel,
  deriveActionCategory,
  resolveEndorsementDisplayStatus,
  hasSuccessfulEndorsementRecords,
  endorsementDisplayStatusSortRank,
  resolveOutcomeCounts,
} from './endorsementLogTableCells'

export const SCHEDULE_PER_PAGE = 10

/** Demo master policies for generated schedule rows and filters. */
export const MASTER_POLICY_OPTIONS = [
  {
    id: 'ACK-GHI-2024-9912',
    label: 'ACK-GHI-2024-9912',
    product: 'Group Health Insurance',
  },
  {
    id: 'ACK-GHI-2023-7741',
    label: 'ACK-GHI-2023-7741',
    product: 'Group Health Insurance (2023)',
  },
  {
    id: 'ACK-GPA-2024-5520',
    label: 'ACK-GPA-2024-5520',
    product: 'Group Personal Accident',
  },
]

/** Default when a row has no explicit master policy. */
export const MASTER_POLICY_NUMBER = MASTER_POLICY_OPTIONS[0].id

export function masterPolicyNumber(row) {
  return row.masterPolicyNumber ?? MASTER_POLICY_NUMBER
}

export function batchRowMatchesMasterPolicyFilter(batchRow, selectedPolicyIds) {
  if (!selectedPolicyIds?.length) return true
  return selectedPolicyIds.includes(masterPolicyNumber(batchRow))
}

export const TYPE_OPTIONS = [
  { id: 'all', label: 'All types' },
  { id: 'quick', label: 'Quick' },
  { id: 'bulk', label: 'Bulk' },
  { id: 'sync', label: 'HRMS sync' },
  { id: 'enrollment', label: 'App enrolment' },
]

export const HISTORY_DOWNLOAD_ICON_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-0 shadow-none bg-[#f3f4f6] text-[#4b5563] hover:bg-gray-200 hover:text-gray-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 focus-visible:ring-offset-1'

/** Compact icon-only control for schedule view/download in history tables (h-7, matches row CTAs). */
export const HISTORY_SCHEDULE_ICON_BTN = `${HISTORY_DOWNLOAD_ICON_BTN.replace('h-8 w-8', 'h-7 w-7').replace('rounded-lg', 'rounded-md')} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#f3f4f6] disabled:hover:text-[#4b5563]`

export const SCHEDULE_FILE_ICON_BTN = `${HISTORY_DOWNLOAD_ICON_BTN} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#f3f4f6] disabled:hover:text-[#4b5563]`

export const FILTER_SELECT_CLASS =
  'min-h-[2.25rem] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export function escapeCsvCell(v) {
  const s = String(v ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename, headerRow, dataRows) {
  const lines = [
    headerRow.map(escapeCsvCell).join(','),
    ...dataRows.map((row) => row.map(escapeCsvCell).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function escapeHtmlCell(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function downloadExcelHtmlTable(filename, headerRow, dataRows) {
  const headerTr = `<tr>${headerRow.map((h) => `<th>${escapeHtmlCell(h)}</th>`).join('')}</tr>`
  const bodyTrs = dataRows
    .map((row) => `<tr>${row.map((c) => `<td>${escapeHtmlCell(c)}</td>`).join('')}</tr>`)
    .join('')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${headerTr}${bodyTrs}</table></body></html>`
  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function endorsementDetailsExcelHeaders() {
  return [
    'endorsement_no',
    'internal_id',
    'schedule_reference',
    'schedule_generated_at_iso',
    'recorded_at_iso',
    'calendar_date',
    'endorsement_status',
    'run_type',
    'action_category',
    'activity',
    'activity_detail',
    'entry_mode',
    'done_by',
    'member_count',
    'success_count',
    'failed_count',
    'amount_inr_estimate',
    'premium_total_incl_gst',
    'premium_breakdown_json',
    'result_summary',
    'document_generation_status',
    'raw_payload_json',
  ]
}

export function serializeEndorsementRawPayload(row) {
  try {
    const payload = {
      details: row.details ?? null,
      changeSummary: row.changeSummary ?? null,
      premiumSummary: row.premiumSummary ?? null,
    }
    if (!payload.details && !payload.changeSummary && !payload.premiumSummary) return ''
    return JSON.stringify(payload)
  } catch {
    return ''
  }
}

const ENDORSEMENT_NO_BASE = 789123100

export function parseEndorsementNoNumeric(endorsementNo) {
  if (!endorsementNo) return null
  const match = String(endorsementNo).match(/^GPA(\d+)$/)
  return match ? Number(match[1]) : null
}

/** Insurer endorsement number — assigned only when a schedule is generated. */
export function endorsementNumber(row) {
  if (row.endorsementNo) return row.endorsementNo
  return '—'
}

export function allocateEndorsementNumbers(history, count) {
  let max = ENDORSEMENT_NO_BASE
  for (const row of history) {
    const n = parseEndorsementNoNumeric(row.endorsementNo)
    if (n != null && n > max) max = n
  }
  return Array.from({ length: count }, (_, i) => `GPA${max + 1 + i}`)
}

export function endorsementNoSortKey(row) {
  return parseEndorsementNoNumeric(row.endorsementNo) ?? 0
}

export function endorsementDetailsExcelRow(row) {
  const ps = row.premiumSummary
  const premiumTotal = typeof ps?.totalInclGst === 'number' && Number.isFinite(ps.totalInclGst) ? String(ps.totalInclGst) : ''
  const premiumLines = Array.isArray(ps?.lines) ? JSON.stringify(ps.lines) : ''
  return [
    endorsementNumber(row),
    String(row.id),
    row.scheduleRef ?? '',
    row.scheduleGeneratedAt ?? '',
    row.recordedAt ?? '',
    row.date ?? '',
    resolveEndorsementDisplayStatus(row),
    row.type ?? '',
    row.actionCategory ?? deriveActionCategory(row.action),
    row.action ?? '',
    row.activityDetail ?? '',
    deriveRunModeLabel(row),
    formatDoneBySummary(row),
    String(row.count ?? ''),
    row.successCount != null ? String(row.successCount) : '',
    row.failedCount != null ? String(row.failedCount) : '',
    String(entryCdImpactSignedInr(row)),
    premiumTotal,
    premiumLines,
    historyRowResultCsvSummary(row),
    row.schedulePdfStatus ?? '',
    serializeEndorsementRawPayload(row),
  ]
}

export function downloadEndorsementDetailsExcel(row) {
  const fileKey = row.endorsementNo ? endorsementNumber(row) : `internal-${row.id}`
  downloadExcelHtmlTable(
    `endorsement-details-${fileKey}.xls`,
    endorsementDetailsExcelHeaders(),
    [endorsementDetailsExcelRow(row)],
  )
}

/** Excel export for a combined schedule batch (one row per underlying endorsement). */
export function downloadScheduleBatchDetailsExcel(batchRow) {
  const members = batchRow.scheduleBatchMembers ?? []
  const fileKey = batchRow.scheduleRef ?? batchRow.endorsementNo ?? batchRow.id
  if (members.length === 0) {
    downloadEndorsementDetailsExcel(batchRow)
    return
  }
  downloadExcelHtmlTable(
    `endorsement-schedule-${fileKey}.xls`,
    endorsementDetailsExcelHeaders(),
    members.map(endorsementDetailsExcelRow),
  )
}

export function formatShortDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function entryCdImpactInr(entry) {
  const direct = entry.premiumSummary?.totalInclGst
  if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) return direct
  return Math.round(Number(entry.count) || 0) * 12500
}

/** True when endorsement credits CD (e.g. deletions, refund premium lines). */
export function isCdCreditEntry(entry) {
  const cat = entry.actionCategory ?? deriveActionCategory(entry.action)
  if (cat === 'Deletion') return true
  const lines = entry.premiumSummary?.lines
  if (Array.isArray(lines) && lines.some((line) => /refund/i.test(String(line?.label || '')))) {
    return true
  }
  return false
}

/** Signed INR impact on CD wallet — negative = credit back, positive = debit/consumption. */
export function entryCdImpactSignedInr(entry) {
  if (typeof entry._batchCdImpactSigned === 'number') return entry._batchCdImpactSigned
  const magnitude = entryCdImpactInr(entry)
  return isCdCreditEntry(entry) ? -magnitude : magnitude
}

export function cdImpactDirectionLabel(entry) {
  if (typeof entry._batchCdImpactSigned === 'number') {
    return entry._batchCdImpactSigned < 0 ? 'CD credit' : 'CD debit'
  }
  return isCdCreditEntry(entry) ? 'CD credit' : 'CD debit'
}

/** Display amount with explicit +/-; credits show +₹ (money returned to CD). */
export function formatCdImpactDisplayAmount(entry) {
  const signed = entryCdImpactSignedInr(entry)
  const formatted = formatInr(Math.abs(signed))
  return signed < 0 ? `+${formatted}` : `−${formatted}`
}

/** Compact display for modals/summaries. */
export function formatCdImpactDisplayCompact(entry) {
  const signed = entryCdImpactSignedInr(entry)
  const magnitude = Math.abs(signed)
  if (Math.abs(magnitude) >= 10000000) {
    const v = `₹${(magnitude / 10000000).toFixed(1)}Cr`
    return signed < 0 ? `+${v}` : `−${v}`
  }
  if (Math.abs(magnitude) >= 100000) {
    const v = `₹${(magnitude / 100000).toFixed(1)}L`
    return signed < 0 ? `+${v}` : `−${v}`
  }
  if (Math.abs(magnitude) >= 1000) {
    const v = `₹${Math.round(magnitude / 1000)}k`
    return signed < 0 ? `+${v}` : `−${v}`
  }
  const v = formatInr(magnitude)
  return signed < 0 ? `+${v}` : `−${v}`
}

export function EndorsementCdImpactCell({ row }) {
  const signed = entryCdImpactSignedInr(row)
  const credit = signed < 0
  return (
    <div className="text-right">
      <span
        className={`text-[12px] font-semibold tabular-nums ${credit ? 'text-emerald-700' : 'text-gray-900'}`}
      >
        {formatCdImpactDisplayAmount(row)}
      </span>
      <p className="mt-0.5 text-[10px] font-medium text-gray-500">{cdImpactDirectionLabel(row)}</p>
    </div>
  )
}

/** Portal reference ID (matches CD ledger patterns e.g. QA-9921, BU-4410). */
export function formatEndorsementReferenceId(row) {
  if (row.referenceId) return String(row.referenceId)
  const prefix = { quick: 'QA', bulk: 'BU', sync: 'HR', enrollment: 'AE' }[row.type] ?? 'END'
  return `${prefix}-${row.id}`
}

export function endorsementReferenceSortKey(row) {
  return Number(row.id) || 0
}

export function endorsementTypeLabel(row) {
  return row.actionCategory ?? deriveActionCategory(row.action)
}

/** Successful lives when split counts exist; otherwise batch count. */
export function memberLivesAffected(row) {
  const { ok, total } = resolveOutcomeCounts(row)
  if (row.status === 'Processing' || row.status === 'In Progress') return total
  if (ok != null && ok > 0) return ok
  return Number(row.count) || 0
}

export function entryPremiumImpactInr(entry) {
  const direct = entry.premiumSummary?.totalInclGst
  if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) return direct
  return entryCdImpactInr(entry)
}

export function entryPremiumImpactSignedInr(entry) {
  if (typeof entry._batchPremiumImpactSigned === 'number') return entry._batchPremiumImpactSigned
  const magnitude = entryPremiumImpactInr(entry)
  return isCdCreditEntry(entry) ? -magnitude : magnitude
}

export function formatPremiumImpactDisplayAmount(entry) {
  const signed = entryPremiumImpactSignedInr(entry)
  const formatted = formatInr(Math.abs(signed))
  return signed < 0 ? `+${formatted}` : `−${formatted}`
}

export function EndorsementPremiumImpactCell({ row }) {
  const signed = entryPremiumImpactSignedInr(row)
  const credit = signed < 0
  return (
    <div className="text-right">
      <span
        className={`text-[12px] font-semibold tabular-nums ${credit ? 'text-emerald-700' : 'text-gray-900'}`}
      >
        {formatPremiumImpactDisplayAmount(row)}
      </span>
      <p className="mt-0.5 text-[10px] font-medium text-gray-500">{credit ? 'Premium credit' : 'Premium debit'}</p>
    </div>
  )
}

export function EndorsementTypeCell({ row }) {
  const label = endorsementTypeLabel(row)
  return (
    <span className="text-[12px] font-normal text-gray-800" title={label}>
      {label}
    </span>
  )
}

export function createBatchScheduleRefs(count) {
  const batch = Date.now()
  return Array.from({ length: count }, (_, i) => `SCH-BATCH-${batch}-${i + 1}`)
}

export function eligibleForSchedule(e) {
  if (e.scheduleRef) return false
  if (e.status === 'Processing' || e.status === 'In Progress') return false
  return hasSuccessfulEndorsementRecords(e)
}

export function isScheduleEligibleEndorsement(row) {
  if (row.status === 'Processing' || row.status === 'In Progress') return false
  return hasSuccessfulEndorsementRecords(row)
}

/** Batch aggregate rows or standard endorsement rows eligible for schedule UI. */
export function isScheduleTableRow(row) {
  if (row?.isScheduleBatchRow) return true
  return isScheduleEligibleEndorsement(row)
}

/** Calendar `entry.date` (YYYY-MM-DD) must fall within range when bounds are set */
export function entryMatchesDateRange(entry, dateFrom, dateTo) {
  const d = entry.date
  if (dateFrom && (!d || d < dateFrom)) return false
  if (dateTo && (!d || d > dateTo)) return false
  return true
}

export function rowMatchesSearch(entry, q) {
  if (!q.trim()) return true
  const s = q.trim().toLowerCase()
  const cat = entry.actionCategory ?? deriveActionCategory(entry.action)
  const mode = deriveRunModeLabel(entry)
  const doneByLine = formatDoneBySummary(entry)
  const blob = [
    entry.action,
    entry.activityDetail,
    entry.doneBy,
    cat,
    mode,
    doneByLine,
    entry.status,
    resolveEndorsementDisplayStatus(entry),
    entry.type,
    entry.scheduleRef,
    String(entry.count),
    endorsementNumber(entry),
    formatEndorsementReferenceId(entry),
    endorsementTypeLabel(entry),
    String(entry.id),
    formatShortDate(entry.recordedAt || entry.date),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return blob.includes(s)
}

export {
  ENDORSEMENT_THEAD_TR_CLASS,
  ENDORSEMENT_TABLE_EDGE_PL,
  ENDORSEMENT_TABLE_EDGE_PR,
  ENDORSEMENT_TABLE_HEAD_EDGE_PL,
  ENDORSEMENT_TABLE_HEAD_EDGE_PR,
  ENDORSEMENT_TABLE_CELL_INNER,
  ENDORSEMENT_TABLE_CELL_EDGE_PL,
  ENDORSEMENT_TABLE_CELL_EDGE_PR,
  PORTAL_TABLE_THEAD_TR_CLASS,
  PORTAL_TABLE_SECTION_GUTTER,
  PORTAL_TABLE_EDGE_PL,
  PORTAL_TABLE_EDGE_PR,
  PORTAL_TABLE_HEAD_EDGE_PL,
  PORTAL_TABLE_HEAD_EDGE_PR,
  PORTAL_TABLE_CELL_INNER,
  PORTAL_TABLE_CELL_EDGE_PL,
  PORTAL_TABLE_CELL_EDGE_PR,
  PORTAL_TABLE_SCROLL_CLASS,
  PORTAL_TABLE_CLASS,
  PORTAL_TABLE_TH_CLASS,
} from '../../lib/dataTableLayout'

export function scheduleRowRecordedSortKey(row) {
  return String(row.recordedAt || row.date || '')
}

export function scheduleRowGeneratedSortKey(row) {
  return String(row.scheduleGeneratedAt || '')
}

export function compareScheduleRowsPending(a, b, sortKey, sortDir) {
  const m = sortDir === 'asc' ? 1 : -1
  switch (sortKey) {
    case 'referenceId':
      return m * (endorsementReferenceSortKey(a) - endorsementReferenceSortKey(b))
    case 'date':
    case 'recordedAt':
      return m * scheduleRowRecordedSortKey(a).localeCompare(scheduleRowRecordedSortKey(b))
    case 'endorsementType':
      return m * endorsementTypeLabel(a).localeCompare(endorsementTypeLabel(b))
    case 'memberCount':
      return m * (memberLivesAffected(a) - memberLivesAffected(b))
    case 'premiumImpact':
      return m * (entryPremiumImpactSignedInr(a) - entryPremiumImpactSignedInr(b))
    case 'endorsementStatus':
      return (
        m *
        (endorsementDisplayStatusSortRank(resolveEndorsementDisplayStatus(a)) -
          endorsementDisplayStatusSortRank(resolveEndorsementDisplayStatus(b)))
      )
    case 'status':
    case 'scheduleStatus':
      return m * (scheduleStatusSortRank(a) - scheduleStatusSortRank(b))
    default:
      return 0
  }
}

export function compareScheduleRowsGenerated(a, b, sortKey, sortDir) {
  const m = sortDir === 'asc' ? 1 : -1
  switch (sortKey) {
    case 'masterPolicy':
      return m * masterPolicyNumber(a).localeCompare(masterPolicyNumber(b))
    case 'scheduleNo':
    case 'endorsementNo':
      return m * (endorsementNoSortKey(a) - endorsementNoSortKey(b))
    case 'scheduleDate':
    case 'generatedOn':
      return m * scheduleRowGeneratedSortKey(a).localeCompare(scheduleRowGeneratedSortKey(b))
    case 'premiumImpact':
      return m * (entryPremiumImpactSignedInr(a) - entryPremiumImpactSignedInr(b))
    case 'status':
    case 'scheduleStatus':
      return m * (scheduleStatusSortRank(a) - scheduleStatusSortRank(b))
    default:
      return 0
  }
}

export const SCHEDULE_PDF_STEPS = 25
export const SCHEDULE_PDF_STEP_MS = 200
export const SCHEDULE_GENERATION_MIN_MS = 5000

export function isScheduleDocumentReady(row) {
  if (!row.scheduleRef || !isScheduleTableRow(row)) return false
  if (row.schedulePdfStatus === 'generating') return false
  return row.schedulePdfStatus === 'ready' || row.schedulePdfStatus == null
}

/** @returns {'pending' | 'processing' | 'generated' | null} */
export function getEndorsementScheduleStatus(row) {
  if (!isScheduleTableRow(row)) return null
  if (row.schedulePdfStatus === 'generating') return 'processing'
  if (row.scheduleRef && isScheduleDocumentReady(row)) return 'generated'
  if (!row.scheduleRef) return 'pending'
  return 'processing'
}

export function canViewEndorsementSchedule(row) {
  return isScheduleTableRow(row) && !!row.scheduleRef && row.schedulePdfStatus !== 'generating'
}

export function scheduleStatusSortRank(row) {
  const s = getEndorsementScheduleStatus(row)
  if (s === 'pending') return 0
  if (s === 'processing') return 1
  if (s === 'generated') return 2
  return -1
}

/** Rows shown under the "Schedules generated" chip (includes in-flight generation). */
export function isGeneratedScheduleChipRow(row) {
  const s = getEndorsementScheduleStatus(row)
  return s === 'generated' || s === 'processing'
}

/** Derive combined endorsement status for a schedule batch. */
export function deriveBatchDisplayStatus(members) {
  let hasPartial = false
  let hasFailed = false
  let hasSuccess = false
  for (const m of members) {
    const status = resolveEndorsementDisplayStatus(m)
    if (status === 'Partial success') hasPartial = true
    else if (status === 'Failed') hasFailed = true
    else if (status === 'Success') hasSuccess = true
  }
  if (hasPartial) return 'Partial success'
  if (hasFailed && hasSuccess) return 'Partial success'
  if (hasFailed) return 'Failed'
  return 'Success'
}

/** One display row per generated schedule batch (grouped by scheduleRef). */
export function aggregateScheduleBatchRows(rows) {
  const batches = new Map()
  for (const row of rows) {
    const ref = row.scheduleRef
    if (!ref) continue
    const list = batches.get(ref) ?? []
    list.push(row)
    batches.set(ref, list)
  }
  return Array.from(batches.entries()).map(([scheduleRef, members]) => {
    const sorted = [...members].sort((a, b) =>
      String(b.recordedAt || b.date).localeCompare(String(a.recordedAt || a.date)),
    )
    const lead = sorted[0]
    const batchCdSigned = sorted.reduce((sum, m) => sum + entryCdImpactSignedInr(m), 0)
    const batchPremiumSigned = sorted.reduce((sum, m) => sum + entryPremiumImpactSignedInr(m), 0)
    const totalLives = sorted.reduce((sum, m) => sum + (Number(m.count) || 0), 0)
    const generating = sorted.some((m) => m.schedulePdfStatus === 'generating')
    const progressValues = sorted.map((m) =>
      typeof m.schedulePdfProgress === 'number' ? m.schedulePdfProgress : generating ? 0 : 100,
    )
    const batchProgress = generating ? Math.min(...progressValues) : 100
    const allReady = sorted.every((m) => isScheduleDocumentReady(m))

    return {
      id: `schedule-batch-${scheduleRef}`,
      isScheduleBatchRow: true,
      scheduleBatchMembers: sorted,
      scheduleRef,
      endorsementNo: lead.endorsementNo,
      scheduleGeneratedAt: lead.scheduleGeneratedAt,
      schedulePdfStatus: generating ? 'generating' : allReady ? 'ready' : lead.schedulePdfStatus,
      schedulePdfProgress: batchProgress,
      action: 'Combined endorsement schedule',
      activityDetail: `${sorted.length} endorsement${sorted.length === 1 ? '' : 's'} · ${totalLives} lives`,
      actionCategory: 'Combined',
      count: totalLives,
      type: sorted.length > 1 ? 'batch' : lead.type,
      doneBy: sorted.length > 1 ? 'Multiple users' : lead.doneBy,
      actorType: sorted.length > 1 ? undefined : lead.actorType,
      recordedAt: lead.recordedAt,
      date: lead.date,
      _batchDisplayStatus: deriveBatchDisplayStatus(sorted),
      _batchCdImpactSigned: batchCdSigned,
      _batchPremiumImpactSigned: batchPremiumSigned,
      masterPolicyNumber: lead.masterPolicyNumber ?? MASTER_POLICY_NUMBER,
    }
  })
}

export function countGeneratedScheduleBatches(rows) {
  return aggregateScheduleBatchRows(rows.filter((r) => isGeneratedScheduleChipRow(r))).length
}

export function batchRowMatchesTypeFilter(batchRow, typeFilter) {
  if (typeFilter === 'all') return true
  return batchRow.scheduleBatchMembers?.some((m) => m.type === typeFilter) ?? batchRow.type === typeFilter
}

export function batchRowMatchesDateRange(batchRow, dateFrom, dateTo) {
  const iso = batchRow.scheduleGeneratedAt || batchRow.recordedAt || batchRow.date
  if (!iso) return true
  const d = String(iso).slice(0, 10)
  if (dateFrom && d < dateFrom) return false
  if (dateTo && d > dateTo) return false
  return true
}

export function batchRowMatchesSearch(batchRow, q) {
  if (!q.trim()) return true
  const members = batchRow.scheduleBatchMembers ?? []
  const blob = [
    batchRow.action,
    batchRow.activityDetail,
    batchRow.scheduleRef,
    batchRow.endorsementNo,
    masterPolicyNumber(batchRow),
    batchRow.doneBy,
    ...members.flatMap((m) => [m.action, m.activityDetail, m.doneBy, String(m.id)]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return blob.includes(q.trim().toLowerCase())
}

/** All portfolio rows eligible for schedule generation (no schedule yet). */
export function getPendingScheduleRowIds(history) {
  return history.filter((e) => eligibleForSchedule(e)).map((e) => e.id)
}

/**
 * Club all pending endorsements into one batch schedule; one endorsement number for the batch.
 */
export function generateClubbedPendingSchedules(history, updateEntry, timersRef, { onBatchComplete } = {}) {
  const ids = getPendingScheduleRowIds(history)
  if (ids.length === 0) return null
  return generateScheduleForRows(ids, history, updateEntry, timersRef, onBatchComplete)
}

export function generateScheduleForRows(ids, history, updateEntry, timersRef, onBatchComplete) {
  if (ids.length === 0) return null
  const batchRef = `SCH-BATCH-${Date.now()}`
  const ts = new Date().toISOString()
  const [batchEndorsementNo] = allocateEndorsementNumbers(history, 1)
  ids.forEach((id) => {
    updateEntry(id, {
      endorsementNo: batchEndorsementNo,
      scheduleRef: batchRef,
      scheduleGeneratedAt: ts,
      schedulePdfStatus: 'generating',
      schedulePdfProgress: 0,
    })
  })
  runSchedulePdfProgressDemo(ids, updateEntry, timersRef, onBatchComplete)
  return batchRef
}

export function EndorsementScheduleStatusCell({
  row,
  showPendingCoachmark = false,
  onGoToSchedules,
}) {
  const scheduleStatus = getEndorsementScheduleStatus(row)
  const pillBase = 'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize'

  if (!scheduleStatus) {
    return <span className="text-[12px] text-gray-400">—</span>
  }
  if (scheduleStatus === 'pending') {
    const pill = (
      <span
        className={`${pillBase} bg-amber-50 text-amber-800${showPendingCoachmark && onGoToSchedules ? ' cursor-help' : ''}`}
        tabIndex={showPendingCoachmark && onGoToSchedules ? 0 : undefined}
      >
        <Clock size={12} className="shrink-0" aria-hidden />
        Pending
      </span>
    )

    if (!showPendingCoachmark || !onGoToSchedules) {
      return pill
    }

    return (
      <div className="group/pending-coach relative inline-flex max-w-full">
        {pill}
        <div
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-[200] mt-2 w-[min(16rem,calc(100vw-3rem))] rounded-lg border border-gray-200 bg-white p-3 text-left opacity-0 shadow-lg ring-1 ring-black/5 transition-[opacity,transform] duration-200 translate-y-1 group-hover/pending-coach:pointer-events-auto group-hover/pending-coach:translate-y-0 group-hover/pending-coach:opacity-100 group-focus-within/pending-coach:pointer-events-auto group-focus-within/pending-coach:translate-y-0 group-focus-within/pending-coach:opacity-100 motion-reduce:transition-none"
        >
          <p className="text-[11px] leading-snug text-gray-600">
            This endorsement is waiting for an insurer schedule. You can generate it from the
            Endorsement schedules tab.
          </p>
          <button
            type="button"
            className="pointer-events-auto mt-2 cursor-pointer text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onGoToSchedules()
            }}
          >
            Go to schedules
          </button>
        </div>
      </div>
    )
  }
  if (scheduleStatus === 'processing') {
    const pct =
      typeof row.schedulePdfProgress === 'number'
        ? row.schedulePdfProgress
        : row.schedulePdfStatus === 'generating'
          ? 0
          : undefined
    return (
      <span className={`${pillBase} bg-indigo-50 text-indigo-700`} role="status">
        <Loader2 size={12} className="shrink-0 animate-spin text-indigo-600" aria-hidden />
        Processing
        {typeof pct === 'number' ? <span className="tabular-nums text-indigo-600/90">{pct}%</span> : null}
      </span>
    )
  }
  return (
    <span className={`${pillBase} bg-emerald-50 text-emerald-700`}>
      <CheckCircle2 size={12} className="shrink-0" aria-hidden />
      Generated
    </span>
  )
}

export function ScheduleDocumentStatusCell({ row }) {
  const ready = isScheduleDocumentReady(row)
  const generating = row.schedulePdfStatus === 'generating'
  const pct = typeof row.schedulePdfProgress === 'number' ? row.schedulePdfProgress : generating ? 0 : 100
  const pillBase = 'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'

  if (generating) {
    return (
      <span
        className={`${pillBase} bg-indigo-50 text-indigo-700`}
        role="status"
        aria-live="polite"
        aria-label={`Generating document, ${pct} percent`}
      >
        <Loader2 size={12} className="shrink-0 animate-spin text-indigo-600" aria-hidden />
        <span className="truncate">Generating</span>
        <span className="tabular-nums text-indigo-600/90">{pct}%</span>
      </span>
    )
  }
  if (ready) {
    return (
      <span className={`${pillBase} bg-emerald-50 text-emerald-700`}>
        <CheckCircle2 size={12} className="shrink-0" aria-hidden />
        <span className="truncate">Success</span>
      </span>
    )
  }
  return <span className="text-[12px] text-gray-400">—</span>
}

export function runSchedulePdfProgressDemo(ids, updateEntry, timersRef, onBatchComplete) {
  const completedIds = new Set()
  const maybeFinishBatch = (id) => {
    completedIds.add(id)
    if (completedIds.size === ids.length && typeof onBatchComplete === 'function') {
      timersRef.current.push(window.setTimeout(onBatchComplete, 0))
    }
  }

  ids.forEach((id, idx) => {
    let step = 0
    const tick = () => {
      step += 1
      const pct = Math.min(100, Math.round((step / SCHEDULE_PDF_STEPS) * 100))
      if (step < SCHEDULE_PDF_STEPS) {
        updateEntry(id, { schedulePdfProgress: pct })
        timersRef.current.push(window.setTimeout(tick, SCHEDULE_PDF_STEP_MS))
      } else {
        updateEntry(id, { schedulePdfStatus: 'ready', schedulePdfProgress: 100 })
        maybeFinishBatch(id)
      }
    }
    timersRef.current.push(window.setTimeout(tick, 140 + idx * 48))
  })
}
