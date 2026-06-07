import { useState, useEffect, useMemo, useRef } from 'react'
import { Eye, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, X, Loader2, FileText, Check, Heart, Shield, ChevronDown, ChevronUp, Plus, Trash2, Upload, CheckCircle, Wallet, Wrench, FileDown } from 'lucide-react'
import { useEndorsements } from '../../store/EndorsementStore'
import { basePlans, gpaBasePlans, dependentRelations } from '../../data/mockData'
import {
  formSectionTitleClass,
  formSectionBadgeClass,
  formFieldLabelClass,
  formControlClass,
  formControlErrorClass,
  updateFormSectionShell,
} from '../../lib/formUi'
import {
  validateBasicFields,
  validateDependentFields,
} from '../../lib/quickAddValidation'
import { formatInrSigned } from '../../lib/currencyFormat'
import PlanSelection from '../PlanSelection'
import DependentForm from '../DependentForm'
import EndorsementHistoryScheduleV2 from './EndorsementHistoryScheduleV2'
import EndorsementScheduleActionsMenu from './EndorsementScheduleActionsMenu'
import EndorsementSortTh from './EndorsementSortTh'
import {
  ENDORSEMENT_THEAD_TR_CLASS,
  ENDORSEMENT_TABLE_HEAD_EDGE_PL,
  ENDORSEMENT_TABLE_HEAD_EDGE_PR,
  ENDORSEMENT_TABLE_CELL_INNER,
  ENDORSEMENT_TABLE_CELL_EDGE_PL,
  ENDORSEMENT_TABLE_CELL_EDGE_PR,
  ENDORSEMENT_TABLE_EDGE_PL,
  ENDORSEMENT_TABLE_EDGE_PR,
  entryMatchesDateRange,
  EndorsementScheduleStatusCell,
  getEndorsementScheduleStatus,
  isScheduleDocumentReady,
  canViewEndorsementSchedule,
  downloadEndorsementDetailsExcel,
  eligibleForSchedule,
  isScheduleEligibleEndorsement,
  getPendingScheduleRowIds,
  generateScheduleForRows,
  scheduleStatusSortRank,
  entryCdImpactSignedInr,
  endorsementNumber,
} from './endorsementScheduleShared'
import {
  ScheduleDocumentViewerModal,
  SchedulePreviewGenerateModal,
  ENDORSEMENT_TABLE_TH_CLASS,
  ENDORSEMENT_TABLE_ICON_BTN,
  ENDORSEMENT_SCHEDULE_GENERATE_BTN,
  ENDORSEMENT_SCHEDULE_VIEW_BTN,
  ENDORSEMENT_TABLE_FIX_BTN,
  ENDORSEMENT_TABLE_TRACK_BTN,
} from './ScheduleDocumentModals'
import {
  generateEndorsementSchedulePdf,
  downloadSchedulePdfBytes,
  schedulePdfFilename,
} from '../../lib/generateEndorsementSchedulePdf'
import {
  ResultCountCell,
  formatHistoryTableDateTime,
  historyRowResultCsvSummary,
  EndorsementLogDateCell as HistoryTableDateCell,
  EndorsementLogStatusBadge as HistoryStatusMetadata,
  resolveEndorsementDisplayStatus,
  hasSuccessfulEndorsementRecords,
  endorsementDisplayStatusSortRank,
  EndorsementActivityCell,
  EndorsementRunModeCell,
  EndorsementDoneByCell,
  formatDoneBySummary,
  deriveRunModeLabel,
  deriveActionCategory,
} from './endorsementLogTableCells'

/** More than this many employees/rows with errors → default to download + re-upload; ≤ threshold → inline fix. */
const ERROR_LIST_THRESHOLD = 5

function escapeCsvCell(v) {
  const s = String(v ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename, headerRow, dataRows) {
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

function bulkRowHasValidationGap(r) {
  return !String(r.empId || '').trim() || !String(r.name || '').trim() || !String(r.email || '').trim()
    || !String(r.dob || '').trim()
}

/** Sum of listed errors per row; if row is invalid but errors[] empty, count missing mandatory fields (min 1). */
function countBulkListedErrors(rows) {
  return rows.reduce((sum, r) => {
    if (Array.isArray(r.errors) && r.errors.length > 0) return sum + r.errors.length
    if (bulkRowHasValidationGap(r)) {
      let c = 0
      if (!String(r.empId || '').trim()) c++
      if (!String(r.name || '').trim()) c++
      if (!String(r.email || '').trim()) c++
      if (!String(r.dob || '').trim()) c++
      return sum + Math.max(c, 1)
    }
    return sum
  }, 0)
}

function bulkRowHasListedErrors(r) {
  return countBulkListedErrors([r]) > 0
}

/** Rows that still have validation issues (same basis as error counts). */
function countBulkRowsWithErrors(rows) {
  return (rows || []).filter(bulkRowHasListedErrors).length
}

const MOCK_BULK_ERROR_ROWS = [
  { id: 1, empId: 'EMP101', name: 'Raj Verma', email: '', dob: '1990-05-12', mobile: '9876540001', gender: 'Male', doj: '2025-06-01', gmcBase: '', gpaBase: '', dependents: [{ name: 'Meera Verma', relation: 'Spouse', dob: '1992-03-10' }], errors: ['Missing email address'] },
  { id: 2, empId: 'EMP102', name: 'Sneha Das', email: 'sneha.d@acko.com', dob: '', mobile: '9876540002', gender: 'Female', doj: '2025-04-15', gmcBase: '', gpaBase: '', dependents: [], errors: ['Missing date of birth'] },
  { id: 3, empId: '', name: 'Kiran Rao', email: 'kiran.r@acko.com', dob: '1995-08-20', mobile: '9876540003', gender: 'Male', doj: '2025-08-10', gmcBase: '', gpaBase: '', dependents: [{ name: 'Sunita Rao', relation: 'Mother', dob: '1965-11-05' }], errors: ['Missing employee ID', 'GMC plan not mapped'] },
  { id: 4, empId: 'EMP104', name: 'Amit Shah', email: 'bad-email', dob: '1988-01-01', mobile: '9876540004', gender: 'Male', doj: '2024-01-01', gmcBase: '', gpaBase: '', dependents: [], errors: ['Invalid email format', 'GMC plan not mapped'] },
  { id: 5, empId: 'EMP105', name: 'Priya Nair', email: 'priya.n@acko.com', dob: '1993-07-22', mobile: '', gender: 'Female', doj: '2023-11-01', gmcBase: '', gpaBase: '', dependents: [], errors: ['Mobile required for GPA'] },
  /** Sixth failing row → bulk modal defaults to file workflow (>5 employees with errors). */
  { id: 6, empId: 'EMP106', name: 'Rohit Kulkarni', email: '', dob: '1992-01-10', mobile: '9876500106', gender: 'Male', doj: '2024-02-01', gmcBase: '', gpaBase: '', dependents: [], errors: ['Missing email address'] },
]

/** Shorter list for history row id 14 — few rows with errors (inline-first). */
const MOCK_BULK_ERROR_ROWS_FEW = [
  { id: 1, empId: 'EMP201', name: 'Vikram Iyer', email: '', dob: '1991-03-15', mobile: '9876500201', gender: 'Male', doj: '2024-06-01', gmcBase: '', gpaBase: '', dependents: [], errors: ['Missing email address'] },
  { id: 2, empId: 'EMP202', name: 'Neha Gupta', email: 'neha.g@acko.com', dob: '1994-11-20', mobile: '9876500202', gender: 'Female', doj: '2025-01-10', gmcBase: '', gpaBase: '', dependents: [], errors: ['GMC plan not mapped'] },
]

function getBulkMockRowsForEntry(entry) {
  return entry?.id === 14 ? MOCK_BULK_ERROR_ROWS_FEW : MOCK_BULK_ERROR_ROWS
}

function planScopeFromDetailRow(d) {
  if (!d || typeof d !== 'object') return { gmc: true, gpa: true }
  const p = d.plans && typeof d.plans === 'object' ? d.plans : {}
  const gmc =
    Object.prototype.hasOwnProperty.call(d, 'gmcBase') ||
    Object.prototype.hasOwnProperty.call(p, 'gmcBasePlan') ||
    Object.prototype.hasOwnProperty.call(p, 'gmcSecondaryPlan')
  const gpa =
    Object.prototype.hasOwnProperty.call(d, 'gpaBase') || Object.prototype.hasOwnProperty.call(p, 'gpaBasePlan')
  if (!gmc && !gpa) {
    const detailKeys = Object.keys(d).filter((k) => !['name', 'id', 'empId', 'email', 'dob', 'department', 'designation', 'mobile', 'gender', 'doj', 'dependents', 'plans'].includes(k))
    if (detailKeys.length === 0 && Object.keys(p).length === 0) return { gmc: true, gpa: true }
  }
  return { gmc, gpa }
}

function planOptionFlagsFromPlans(plans) {
  const p = plans || {}
  return {
    topup: !!(p.gmcTopup && p.gmcTopup !== 'none'),
    addons: (p.gmcAddons || []).length > 0,
    secondary: !!(p.gmcSecondaryPlan && p.gmcSecondaryPlan !== 'none'),
  }
}

function normalizeDetailToQuickErrorEmp(d, idx) {
  const scope = planScopeFromDetailRow(d)
  const gmc = d.gmcBase || d.plans?.gmcBasePlan
  const gpa = d.gpaBase || d.plans?.gpaBasePlan
  const plans = { ...(typeof d.plans === 'object' && d.plans ? d.plans : {}) }
  if (gmc && !plans.gmcBasePlan) plans.gmcBasePlan = gmc
  if (gpa && !plans.gpaBasePlan) plans.gpaBasePlan = gpa
  if (!scope.gmc) {
    delete plans.gmcBasePlan
    delete plans.gmcSecondaryPlan
    delete plans.gmcTopup
    delete plans.gmcAddons
  }
  if (!scope.gpa) {
    delete plans.gpaBasePlan
    delete plans.gpaSiType
    delete plans.gpaCtc
    delete plans.gpaManualSi
  }
  const planOptionFlags = planOptionFlagsFromPlans(plans)
  const isEmptyDetailObject = d && typeof d === 'object' && Object.keys(d).length === 0
  const maxDependents = isEmptyDetailObject ? null : (d.dependents || []).length
  return {
    name: d.name || '',
    empId: d.id || d.empId || '',
    email: d.email || '',
    dob: d.dob || '',
    gender: d.gender || '',
    doj: d.doj || '',
    mobile: d.mobile || '',
    plans,
    dependents: (d.dependents || []).map((dep, di) => ({
      id: dep.id || `dep-${idx}-${di}`,
      name: dep.name || '',
      relation: dep.relation || '',
      dob: dep.dob || '',
      gender: dep.gender || '',
      samePlansAsEmployee: dep.samePlansAsEmployee !== false,
      plans: dep.plans && typeof dep.plans === 'object' ? { ...dep.plans } : {},
    })),
    _planScope: scope,
    _planOptionFlags: planOptionFlags,
    _maxDependents: maxDependents,
  }
}

function validatePlanFieldsQuickError(emp) {
  const scope = emp._planScope || { gmc: true, gpa: true }
  const hasGmc = !!(emp.plans?.gmcBasePlan)
  const hasGpa = !!(emp.plans?.gpaBasePlan)
  if (!scope.gmc && !scope.gpa) return {}
  if (scope.gmc && scope.gpa) {
    if (!hasGmc && !hasGpa) return { plans: 'Select at least one of the plan types included in this endorsement.' }
    return {}
  }
  if (scope.gmc && !hasGmc) return { plans: 'Select a GMC base plan — this endorsement included GMC.' }
  if (scope.gpa && !hasGpa) return { plans: 'Select a GPA base plan — this endorsement included GPA.' }
  return {}
}

function validateEmployeeSectionsQuickError(emp) {
  const basic = validateBasicFields(emp)
  const plans = validatePlanFieldsQuickError(emp)
  const dependents = validateDependentFields(emp)
  return { basic, plans, dependents }
}

function employeeHasAnyValidationIssueQuickError(emp) {
  const v = validateEmployeeSectionsQuickError(emp)
  return (
    Object.keys(v.basic).length + Object.keys(v.plans).length + Object.keys(v.dependents).length > 0
  )
}

function countQuickErrorIssues(emp) {
  const b = validateBasicFields(emp)
  const p = validatePlanFieldsQuickError(emp)
  const d = validateDependentFields(emp)
  let n = Object.keys(b).length + Object.keys(p).length + Object.keys(d).length
  return n
}

function quickErrorEmpIsValid(emp) {
  return !employeeHasAnyValidationIssueQuickError(emp)
}

/** Employees that still fail validation (drives file vs inline threshold). */
function countQuickEmployeesWithErrors(employees) {
  return (employees || []).filter((emp) => !quickErrorEmpIsValid(emp)).length
}

function quickErrorValidationMessages(emp) {
  const b = validateBasicFields(emp)
  const p = validatePlanFieldsQuickError(emp)
  const d = validateDependentFields(emp)
  const parts = [...Object.values(b), ...Object.values(p), ...Object.values(d)]
  return parts
}

function historyRowSortKey(row) {
  return row.recordedAt || `${row.date}T12:00:00`
}

function downloadHistoryRowCsv(row) {
  const { dateLine, timeLine } = formatHistoryTableDateTime(row)
  const cat = row.actionCategory ?? deriveActionCategory(row.action)
  const mode = deriveRunModeLabel(row)
  const doneBy = formatDoneBySummary(row)
  downloadCsv(
    `endorsement-history-${row.id}.csv`,
    ['Date', 'Time', 'Action category', 'Activity', 'Entry mode', 'Done by', 'Status', 'Result summary', 'Count'],
    [[dateLine, timeLine, cat, row.action, mode, doneBy, row.status, historyRowResultCsvSummary(row), String(row.count ?? '')]],
  )
}

const HISTORY_CTA_VIEW = ENDORSEMENT_SCHEDULE_VIEW_BTN
const HISTORY_CTA_FIX = ENDORSEMENT_TABLE_FIX_BTN
const HISTORY_CTA_TRACK = ENDORSEMENT_TABLE_TRACK_BTN
const HISTORY_ROW_ICON_BTN = ENDORSEMENT_TABLE_ICON_BTN

function StatusBadge({ status }) {
  return <HistoryStatusMetadata status={status} />
}

/**
 * @param {{ scheduleExperienceVersion?: 'v1' | 'v2' | 'v3' | 'v4' }} props — V2/V4: single panel; V3: Endorsements + schedules tabs.
 */
export default function EndorsementHistory({ scheduleExperienceVersion = 'v3' }) {
  const { history, updateEntry } = useEndorsements()
  const isV1 = scheduleExperienceVersion === 'v1'
  const isV2 = scheduleExperienceVersion === 'v2'
  const isV3 = scheduleExperienceVersion === 'v3'
  const isV4 = scheduleExperienceVersion === 'v4'
  const isV2Like = isV2 || isV4
  const isV2StyleEndorsements = isV2Like || isV3
  const showEndorsementsScheduleChips = isV2Like
  const [v3MainTab, setV3MainTab] = useState('endorsements')
  const [currentPage, setCurrentPage] = useState(1)
  const [errorPanel, setErrorPanel] = useState(null)
  const [progressPanel, setProgressPanel] = useState(null)
  const [viewPanel, setViewPanel] = useState(null)
  const [schedulePreviewRow, setSchedulePreviewRow] = useState(null)
  const [scheduleViewer, setScheduleViewer] = useState(null)
  const [scheduleViewerUrl, setScheduleViewerUrl] = useState(null)
  const [scheduleViewerLoading, setScheduleViewerLoading] = useState(false)
  const schedulePdfCache = useRef(new Map())
  const scheduleViewerUrlRef = useRef(null)
  const genTimersRef = useRef([])

  const [statusFilter, setStatusFilter] = useState('All')
  const [scheduleChipFilter, setScheduleChipFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [historySort, setHistorySort] = useState(() => ({ key: 'date', dir: 'desc' }))

  useEffect(() => {
    return () => {
      genTimersRef.current.forEach((tid) => window.clearTimeout(tid))
      if (scheduleViewerUrlRef.current) URL.revokeObjectURL(scheduleViewerUrlRef.current)
    }
  }, [])

  const closeScheduleViewer = () => {
    if (scheduleViewerUrlRef.current) {
      URL.revokeObjectURL(scheduleViewerUrlRef.current)
      scheduleViewerUrlRef.current = null
    }
    setScheduleViewerUrl(null)
    setScheduleViewer(null)
    setScheduleViewerLoading(false)
  }

  const buildSchedulePdfBytes = async (row) => {
    const cached = schedulePdfCache.current.get(row.id)
    if (cached) return cached
    const bytes = await generateEndorsementSchedulePdf({
      scheduleRef: row.scheduleRef,
      endorsementNo: endorsementNumber(row),
      activity: row.action ?? '',
      amountInr: Math.abs(entryCdImpactSignedInr(row)),
      generatedAt: new Date(row.scheduleGeneratedAt || row.recordedAt || row.date),
    })
    schedulePdfCache.current.set(row.id, bytes)
    return bytes
  }

  const downloadSchedulePdfForRow = async (row) => {
    if (!isScheduleDocumentReady(row)) return
    const bytes = await buildSchedulePdfBytes(row)
    downloadSchedulePdfBytes(bytes, schedulePdfFilename(row.scheduleRef))
  }

  const openScheduleViewer = async (row) => {
    if (!row?.scheduleRef || row.schedulePdfStatus === 'generating') return
    closeScheduleViewer()
    setScheduleViewer(row)
    setScheduleViewerLoading(true)
    try {
      const bytes = await buildSchedulePdfBytes(row)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      scheduleViewerUrlRef.current = url
      setScheduleViewerUrl(url)
    } catch {
      closeScheduleViewer()
      window.alert('Could not open the schedule PDF. Try downloading instead.')
    } finally {
      setScheduleViewerLoading(false)
    }
  }

  const runGenerateForRow = (row, { closePreview = false } = {}) => {
    if (!eligibleForSchedule(row)) return
    if (closePreview) {
      setSchedulePreviewRow(null)
      window.setTimeout(() => {
        generateScheduleForRows([row.id], history, updateEntry, genTimersRef)
      }, 200)
      return
    }
    generateScheduleForRows([row.id], history, updateEntry, genTimersRef)
  }

  function handleHistorySort(columnKey) {
    setHistorySort((prev) => {
      if (prev.key === columnKey) return { key: columnKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      const preferDesc = columnKey === 'date' || columnKey === 'result' || columnKey === 'scheduleStatus'
      return { key: columnKey, dir: preferDesc ? 'desc' : 'asc' }
    })
    setCurrentPage(1)
  }

  const scheduleChipCounts = useMemo(
    () => ({
      pending: history.filter((r) => getEndorsementScheduleStatus(r) === 'pending').length,
      generated: history.filter((r) => getEndorsementScheduleStatus(r) === 'generated').length,
    }),
    [history],
  )

  const pendingSchedulePortfolioCount = useMemo(
    () => getPendingScheduleRowIds(history).length,
    [history],
  )

  function openV3SchedulesTab() {
    setV3MainTab('schedules')
  }

  const filteredHistory = useMemo(() => {
    let items = [...history]
    if (statusFilter !== 'All') {
      items = items.filter((r) => resolveEndorsementDisplayStatus(r) === statusFilter)
    }
    if (dateFrom || dateTo) {
      items = items.filter((r) => entryMatchesDateRange(r, dateFrom, dateTo))
    }
    if (showEndorsementsScheduleChips && scheduleChipFilter !== 'all') {
      items = items.filter((r) => getEndorsementScheduleStatus(r) === scheduleChipFilter)
    }
    const { key: sortKey, dir: sortDir } = historySort
    const m = sortDir === 'asc' ? 1 : -1
    items.sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return m * historyRowSortKey(a).localeCompare(historyRowSortKey(b))
        case 'activity':
          return m * String(a.action || '').localeCompare(String(b.action || ''))
        case 'entryMode':
          return m * deriveRunModeLabel(a).localeCompare(deriveRunModeLabel(b))
        case 'doneBy':
          return m * formatDoneBySummary(a).localeCompare(formatDoneBySummary(b))
        case 'status':
          return (
            m *
            (endorsementDisplayStatusSortRank(resolveEndorsementDisplayStatus(a)) -
              endorsementDisplayStatusSortRank(resolveEndorsementDisplayStatus(b)))
          )
        case 'result':
          return m * ((Number(a.count) || 0) - (Number(b.count) || 0))
        case 'scheduleStatus':
          return m * (scheduleStatusSortRank(a) - scheduleStatusSortRank(b))
        case 'scheduleRef':
          return m * String(a.scheduleRef || '').localeCompare(String(b.scheduleRef || ''))
        default:
          return 0
      }
    })
    return items
  }, [history, statusFilter, dateFrom, dateTo, historySort, scheduleChipFilter, showEndorsementsScheduleChips])

  const perPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filteredHistory.slice((safePage - 1) * perPage, safePage * perPage)

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const hasFilters = statusFilter !== 'All' || dateFrom || dateTo
  const hasFiltersAllEndorsementsTab =
    hasFilters || (showEndorsementsScheduleChips && scheduleChipFilter !== 'all')
  const clearFilters = () => {
    setStatusFilter('All')
    setScheduleChipFilter('all')
    setDateFrom('')
    setDateTo('')
    setHistorySort({ key: 'date', dir: 'desc' })
    setCurrentPage(1)
  }

  const endorsementDateStatusSortFilters = (
    <>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
        className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 cursor-pointer min-w-[120px]"
        title="From date"
        aria-label="Filter from date"
      />
      <span className="text-xs text-gray-400" aria-hidden>–</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
        className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 cursor-pointer min-w-[120px]"
        title="To date"
        aria-label="Filter to date"
      />

      <div className="w-px h-5 bg-gray-200" />

      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
        className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 cursor-pointer"
        aria-label="Filter by endorsement status"
      >
        <option value="All">All endorsement statuses</option>
        <option value="Success">Success</option>
        <option value="Partial success">Partial success</option>
        <option value="Failed">Failed</option>
        <option value="In Progress">In Progress</option>
        <option value="Processing">Processing</option>
      </select>
    </>
  )

  const historyFiltersRow = (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {endorsementDateStatusSortFilters}
      {hasFilters && (
        <button type="button" onClick={clearFilters} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer whitespace-nowrap">
          Clear
        </button>
      )}
    </div>
  )

  const endorsementsScheduleChips = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Schedule status">
      {[
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending schedules', count: scheduleChipCounts.pending },
        { id: 'generated', label: 'Generated', count: scheduleChipCounts.generated },
      ].map((chip) => {
        const active = scheduleChipFilter === chip.id
        const label =
          chip.id !== 'all' && chip.count != null ? `${chip.label} (${chip.count})` : chip.label
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              setScheduleChipFilter(chip.id)
              setCurrentPage(1)
            }}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              active
                ? 'border-indigo-300 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  const endorsementsToolbarFilters = (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      {endorsementDateStatusSortFilters}
      {hasFiltersAllEndorsementsTab ? (
        <button
          type="button"
          onClick={clearFilters}
          className="shrink-0 cursor-pointer whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Clear
        </button>
      ) : null}
    </div>
  )

  const v2StyleToolbar = (
    <div className="shrink-0 border-b border-gray-100 px-6 py-3 lg:px-8">
      <h2 className="text-[15px] font-medium text-gray-900">Endorsement history</h2>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {endorsementsScheduleChips}
          {endorsementsToolbarFilters}
        </div>
      </div>
    </div>
  )

  const v3EndorsementsToolbar = (
    <div className="shrink-0 border-b border-gray-100 px-6 py-3 lg:px-8">
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {endorsementsToolbarFilters}
      </div>
    </div>
  )

  const showEndorsementsTable = !isV3 || v3MainTab === 'endorsements'

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        {isV1 ? (
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <h2 className="text-[15px] font-medium text-gray-900">Endorsement History</h2>
                <p className="text-[11px] font-normal text-gray-400 mt-0.5">Track all endorsement activities and their status</p>
              </div>
              {historyFiltersRow}
            </div>
          </div>
        ) : null}
        {isV2Like ? v2StyleToolbar : null}
        {isV3 ? (
          <>
            <div
              className="relative flex shrink-0 flex-wrap gap-8 border-b border-gray-200 px-6 pt-4 lg:px-8"
              role="tablist"
              aria-label="Endorsement history views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={v3MainTab === 'endorsements'}
                id="eh-v3-tab-endorsements"
                className={`-mb-px inline-flex cursor-pointer items-center border-b-2 pb-2.5 pt-0.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                  v3MainTab === 'endorsements'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-800'
                }`}
                onClick={() => setV3MainTab('endorsements')}
              >
                Endorsements
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={v3MainTab === 'schedules'}
                id="eh-v3-tab-schedules"
                className={`-mb-px inline-flex cursor-pointer items-center border-b-2 pb-2.5 pt-0.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                  v3MainTab === 'schedules'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-800'
                }`}
                onClick={openV3SchedulesTab}
              >
                Endorsement schedules
                {pendingSchedulePortfolioCount > 0 && v3MainTab === 'endorsements' ? (
                  <span
                    className="schedules-tab-badge ml-2 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold tabular-nums leading-none text-white"
                    aria-label={`${pendingSchedulePortfolioCount} pending schedule${pendingSchedulePortfolioCount === 1 ? '' : 's'}`}
                  >
                    {pendingSchedulePortfolioCount}
                  </span>
                ) : null}
              </button>
            </div>
            {v3MainTab === 'endorsements' ? v3EndorsementsToolbar : null}
          </>
        ) : null}

        {showEndorsementsTable ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [min-height:max(16rem,28dvh)]">
          <table className="w-full min-w-0 table-fixed border-collapse">
            {isV3 ? (
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[24%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[20%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
              </colgroup>
            )}
            <thead className="sticky top-0 z-[1]">
              <tr className={ENDORSEMENT_THEAD_TR_CLASS}>
                <EndorsementSortTh columnKey="date" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort} className={ENDORSEMENT_TABLE_HEAD_EDGE_PL}>
                  Date
                </EndorsementSortTh>
                <EndorsementSortTh columnKey="activity" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort} className="min-w-0">
                  Activity
                </EndorsementSortTh>
                <EndorsementSortTh columnKey="entryMode" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort}>
                  Entry mode
                </EndorsementSortTh>
                <EndorsementSortTh columnKey="doneBy" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort} className="min-w-0">
                  Done by
                </EndorsementSortTh>
                <EndorsementSortTh columnKey="status" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort}>
                  Endorsement status
                </EndorsementSortTh>
                <EndorsementSortTh columnKey="result" sortKey={historySort.key} sortDir={historySort.dir} onSort={handleHistorySort}>
                  Result
                </EndorsementSortTh>
                <th scope="col" className={ENDORSEMENT_TABLE_TH_CLASS}>
                  Actions
                </th>
                <EndorsementSortTh
                  columnKey="scheduleStatus"
                  sortKey={historySort.key}
                  sortDir={historySort.dir}
                  onSort={handleHistorySort}
                  className={isV3 ? ENDORSEMENT_TABLE_HEAD_EDGE_PR : undefined}
                >
                  Schedule status
                </EndorsementSortTh>
                {!isV3 ? (
                  <EndorsementSortTh
                    columnKey="scheduleRef"
                    sortKey={historySort.key}
                    sortDir={historySort.dir}
                    onSort={handleHistorySort}
                    className={ENDORSEMENT_TABLE_HEAD_EDGE_PR}
                  >
                    Endorsement schedule
                  </EndorsementSortTh>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isV3 ? 8 : 9} className={`${ENDORSEMENT_TABLE_EDGE_PL} ${ENDORSEMENT_TABLE_EDGE_PR} py-14 text-center align-middle`}>
                    {history.length === 0 ? (
                      <p className="text-sm font-normal text-gray-500">No endorsement activity yet.</p>
                    ) : (
                      <p className="text-sm font-normal text-gray-500">
                        No endorsements match your filters.{' '}
                        <button type="button" onClick={clearFilters} className="text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
                          Clear filters
                        </button>{' '}
                        to see all.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
              paginated.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${row.isNew ? 'bg-indigo-50/25' : ''} hover:bg-gray-50/60`}
                >
                  <td className={`min-w-0 align-middle ${ENDORSEMENT_TABLE_CELL_EDGE_PL}`}>
                    <HistoryTableDateCell row={row} />
                  </td>
                  <td className={`min-w-0 align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <EndorsementActivityCell row={row} />
                  </td>
                  <td className={`min-w-0 align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <EndorsementRunModeCell row={row} />
                  </td>
                  <td className={`min-w-0 truncate align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <EndorsementDoneByCell row={row} />
                  </td>
                  <td className={`align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <StatusBadge status={resolveEndorsementDisplayStatus(row)} />
                  </td>
                  <td className={`align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <ResultCountCell row={row} />
                  </td>
                  <td className={`align-middle ${ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <div className="flex flex-wrap items-center gap-1">
                      {(resolveEndorsementDisplayStatus(row) === 'Failed' ||
                        resolveEndorsementDisplayStatus(row) === 'Partial success') && (
                        <button
                          type="button"
                          onClick={() => setErrorPanel(row)}
                          className={HISTORY_CTA_FIX}
                          title="Fix errors"
                        >
                          <Wrench size={11} strokeWidth={2} className="shrink-0" aria-hidden />
                          Fix
                        </button>
                      )}
                      {resolveEndorsementDisplayStatus(row) === 'Success' && (
                        <button
                          type="button"
                          onClick={() => setViewPanel(row)}
                          className={HISTORY_CTA_VIEW}
                        >
                          <Eye size={11} className="shrink-0" aria-hidden />
                          View
                        </button>
                      )}
                      {row.status === 'Processing' && (
                        <button
                          type="button"
                          onClick={() => setViewPanel(row)}
                          className={HISTORY_CTA_VIEW}
                        >
                          <Eye size={11} className="shrink-0" aria-hidden />
                          View
                        </button>
                      )}
                      {row.status === 'In Progress' && (
                        <button
                          type="button"
                          onClick={() => setProgressPanel(row)}
                          className={HISTORY_CTA_TRACK}
                        >
                          <Clock size={11} className="shrink-0" aria-hidden />
                          Track
                        </button>
                      )}
                      <button
                        type="button"
                        className={HISTORY_ROW_ICON_BTN}
                        title="Download row as CSV"
                        aria-label="Download this row as CSV"
                        onClick={() => downloadHistoryRowCsv(row)}
                      >
                        <Download size={12} strokeWidth={2} className="shrink-0" aria-hidden />
                      </button>
                    </div>
                  </td>
                  <td className={`relative overflow-visible align-middle ${isV3 ? ENDORSEMENT_TABLE_CELL_EDGE_PR : ENDORSEMENT_TABLE_CELL_INNER}`}>
                    <EndorsementScheduleStatusCell
                      row={row}
                      showPendingCoachmark={isV3 && v3MainTab === 'endorsements'}
                      onGoToSchedules={isV3 ? openV3SchedulesTab : undefined}
                    />
                  </td>
                  {!isV3 ? (
                    <td className={`align-middle ${ENDORSEMENT_TABLE_CELL_EDGE_PR}`}>
                      {isV4 ? (
                        <EndorsementScheduleActionsMenu
                          row={row}
                          onGenerateSchedule={(r) => setSchedulePreviewRow(r)}
                          onViewSchedule={(r) => void openScheduleViewer(r)}
                          onDownloadPdf={(r) => void downloadSchedulePdfForRow(r)}
                        />
                      ) : isScheduleEligibleEndorsement(row) ? (() => {
                        const scheduleStatus = getEndorsementScheduleStatus(row)
                        if (scheduleStatus === 'pending') {
                          return (
                            <button
                              type="button"
                              className={ENDORSEMENT_SCHEDULE_GENERATE_BTN}
                              onClick={() => setSchedulePreviewRow(row)}
                            >
                              Generate
                            </button>
                          )
                        }
                        if (scheduleStatus === 'processing') {
                          return (
                            <div className="inline-flex items-center gap-1 text-indigo-600">
                              <Loader2 size={14} className="animate-spin" aria-hidden />
                              <span className="text-[11px] font-medium">Generating…</span>
                            </div>
                          )
                        }
                        if (scheduleStatus === 'generated') {
                          const viewReady = canViewEndorsementSchedule(row)
                          const pdfReady = isScheduleDocumentReady(row)
                          return (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!viewReady}
                                className={ENDORSEMENT_SCHEDULE_VIEW_BTN}
                                title={viewReady ? `View schedule ${row.scheduleRef}` : 'View unavailable'}
                                aria-label={viewReady ? `View schedule ${row.scheduleRef}` : 'View unavailable'}
                                onClick={() => void openScheduleViewer(row)}
                              >
                                <Eye size={11} strokeWidth={2} className="shrink-0" aria-hidden />
                                View
                              </button>
                              <button
                                type="button"
                                disabled={!pdfReady}
                                className={HISTORY_ROW_ICON_BTN}
                                title={pdfReady ? 'Download Excel details' : 'Available when generation completes'}
                                aria-label={pdfReady ? 'Download Excel details' : 'Excel download unavailable'}
                                onClick={() => downloadEndorsementDetailsExcel(row)}
                              >
                                <Download size={12} strokeWidth={2} className="shrink-0" aria-hidden />
                              </button>
                              <button
                                type="button"
                                disabled={!pdfReady}
                                className={HISTORY_ROW_ICON_BTN}
                                title={pdfReady ? 'Download schedule PDF' : 'Available when generation completes'}
                                aria-label={pdfReady ? 'Download schedule PDF' : 'PDF download unavailable'}
                                onClick={() => void downloadSchedulePdfForRow(row)}
                              >
                                <FileDown size={12} strokeWidth={2} className="shrink-0" aria-hidden />
                              </button>
                            </div>
                          )
                        }
                        return <span className="text-[12px] text-gray-400">—</span>
                      })() : (
                        <span className="text-[12px] text-gray-400">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))
              )}
            </tbody>
          </table>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-white px-6 py-3 lg:px-8">
          <p className="text-xs font-normal text-gray-400">
            {filteredHistory.length > 0
              ? `Showing ${(safePage - 1) * perPage + 1}–${Math.min(safePage * perPage, filteredHistory.length)} of ${filteredHistory.length}`
              : 'No results'}
          </p>
          <div className="flex items-center gap-1" role="navigation" aria-label="Table pagination">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1 || filteredHistory.length === 0}
              aria-label="Previous page"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                type="button"
                key={page}
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === safePage ? 'page' : undefined}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ${
                  page === safePage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages || filteredHistory.length === 0}
              aria-label="Next page"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
            </div>
          </div>
        ) : null}

        {isV3 && v3MainTab === 'schedules' ? (
          <EndorsementHistoryScheduleV2
            hideTitle
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={(v) => setDateFrom(v)}
            onDateToChange={(v) => setDateTo(v)}
            onViewSchedule={(row) => void openScheduleViewer(row)}
            onDownloadPdf={(row) => void downloadSchedulePdfForRow(row)}
          />
        ) : null}
      </div>

      {/* Error detail panel – different UX for bulk vs quick */}
      {errorPanel && errorPanel.type === 'quick' && (
        <QuickErrorModal key={errorPanel.id} entry={errorPanel} onClose={() => setErrorPanel(null)} />
      )}
      {errorPanel && errorPanel.type !== 'quick' && (
        <BulkErrorModal key={errorPanel.id} entry={errorPanel} onClose={() => setErrorPanel(null)} />
      )}

      {/* In Progress detail panel */}
      {progressPanel && (
        <ProgressModal entry={progressPanel} onClose={() => setProgressPanel(null)} />
      )}

      {/* View detail modal */}
      {viewPanel && (
        <ViewDetailModal entry={viewPanel} onClose={() => setViewPanel(null)} />
      )}

      <SchedulePreviewGenerateModal
        open={schedulePreviewRow != null}
        row={schedulePreviewRow}
        onClose={() => setSchedulePreviewRow(null)}
        onGenerate={() => {
          if (schedulePreviewRow) runGenerateForRow(schedulePreviewRow, { closePreview: true })
        }}
      />

      <ScheduleDocumentViewerModal
        open={scheduleViewer != null}
        scheduleRef={scheduleViewer?.scheduleRef ?? ''}
        pdfUrl={scheduleViewerUrl}
        loading={scheduleViewerLoading}
        onClose={closeScheduleViewer}
        onDownload={() => {
          if (scheduleViewer) void downloadSchedulePdfForRow(scheduleViewer)
        }}
      />
    </>
  )
}

function ProgressModal({ entry, onClose }) {
  const { updateEntry } = useEndorsements()
  const [progress, setProgress] = useState(15)
  const [steps, setSteps] = useState([
    { label: 'File uploaded', done: true },
    { label: 'Validating records', done: false },
    { label: 'Processing changes', done: false },
    { label: 'Finalizing', done: false },
  ])

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45)
      setSteps(s => s.map((st, i) => i <= 1 ? { ...st, done: true } : st))
    }, 1500)
    const t2 = setTimeout(() => {
      setProgress(75)
      setSteps(s => s.map((st, i) => i <= 2 ? { ...st, done: true } : st))
    }, 3000)
    const t3 = setTimeout(() => {
      setProgress(100)
      setSteps(s => s.map(st => ({ ...st, done: true })))
      updateEntry(entry.id, { status: 'Success' })
    }, 4500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [entry.id, updateEntry])

  const isDone = progress === 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {isDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Loader2 size={18} className="text-amber-600 animate-spin" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{isDone ? 'Processing Complete' : 'Processing Upload'}</h3>
              <p className="text-xs text-gray-500">{formatDate(entry.date)} &middot; {entry.action}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Progress</span>
              <span className="text-xs font-bold text-gray-900">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-200 rounded-full flex-shrink-0" />
                )}
                <span className={`text-sm ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${isDone ? 'text-white bg-emerald-600 hover:bg-emerald-700' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}>
            {isDone ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ErrorModalFormField({ label, type = 'text', required, optional, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className={formFieldLabelClass}>
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-gray-400 font-normal text-xs"> (optional)</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${formControlClass} ${error ? formControlErrorClass : ''}`}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

function ErrorModalSelectField({ label, required, value, onChange, options, placeholder, error }) {
  return (
    <div>
      <label className={formFieldLabelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${formControlClass} ${error ? formControlErrorClass : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

function QuickErrorModal({ entry, onClose }) {
  const { updateEntry } = useEndorsements()
  const fileInputRef = useRef(null)

  const initialList = useMemo(() => {
    const d = entry.details || []
    const raw = d.length ? d : [{}]
    return raw.map((row, i) => normalizeDetailToQuickErrorEmp(row, i))
  }, [entry.details])

  const initialEmployeesWithErrors = useMemo(
    () => countQuickEmployeesWithErrors(initialList),
    [initialList],
  )
  const preferFileWorkflow = initialEmployeesWithErrors > ERROR_LIST_THRESHOLD

  const [employees, setEmployees] = useState(initialList)
  const [uiMode, setUiMode] = useState(preferFileWorkflow ? 'filefix' : 'inline')
  const [submitting, setSubmitting] = useState(false)
  const [uploadParsing, setUploadParsing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [editingIdx, setEditingIdx] = useState(0)

  const updateField = (idx, field, value) => {
    setEmployees((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)))
  }

  const updatePlans = (idx, plans) => {
    setEmployees((prev) => prev.map((e, i) => (i === idx ? { ...e, plans } : e)))
  }

  const updateDependents = (idx, dependents) => {
    setEmployees((prev) => prev.map((e, i) => (i === idx ? { ...e, dependents } : e)))
  }

  const allValid = employees.every((emp) => quickErrorEmpIsValid(emp))
  const currentErrorTotal = employees.reduce((sum, emp) => sum + countQuickErrorIssues(emp), 0)
  const currentEmployeesWithErrors = countQuickEmployeesWithErrors(employees)

  const downloadQuickErrorFile = () => {
    const header = ['employee_id', 'full_name', 'email', 'dob', 'gender', 'doj', 'mobile', 'validation_errors']
    const dataRows = employees.map((emp) => {
      const msg = quickErrorValidationMessages(emp).join(' | ')
      return [emp.empId, emp.name, emp.email, emp.dob, emp.gender, emp.doj, emp.mobile, msg]
    })
    downloadCsv(`endorsement-errors-${entry.id}.csv`, header, dataRows)
  }

  const handleResubmit = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      updateEntry(entry.id, { status: 'Success' })
    }, 1200)
  }

  const handleCorrectedFile = (file) => {
    if (!file) return
    setUploadParsing(true)
    setTimeout(() => {
      setUploadParsing(false)
      setSubmitted(true)
      updateEntry(entry.id, { status: 'Success' })
    }, 1400)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Corrections Submitted</h3>
            <p className="text-sm text-gray-500">The employee details have been corrected and resubmitted successfully.</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer">Done</button>
          </div>
        </div>
      </div>
    )
  }

  const emp = employees[editingIdx] || employees[0]
  const basicErrors = validateBasicFields(emp)
  const planFieldErrors = validatePlanFieldsQuickError(emp)
  const pScope = emp._planScope || { gmc: true, gpa: true }
  const pOpt = emp._planOptionFlags || { topup: true, addons: true, secondary: true }
  const showDependentsSection =
    (emp.dependents || []).length > 0 || emp._maxDependents == null || emp._maxDependents > 0
  const errorCount = countQuickErrorIssues(emp)
  const basicSectionDirty = Object.keys(basicErrors).length > 0

  const fileFixBody = (
    <>
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 mb-5">
        <p className="text-sm font-medium text-amber-900">
          {currentEmployeesWithErrors} employee{currentEmployeesWithErrors !== 1 ? 's' : ''} with errors
          {currentErrorTotal > 0 && (
            <span className="font-normal text-amber-800/95">
              {' '}
              · {currentErrorTotal} validation issue{currentErrorTotal !== 1 ? 's' : ''} total
            </span>
          )}
        </p>
        <p className="text-xs text-amber-800/90 mt-1.5 leading-relaxed">
          When more than {ERROR_LIST_THRESHOLD} employees have errors, use the CSV: download, correct offline, then upload here for reprocessing.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Step 1 — Download</p>
          <button
            type="button"
            onClick={downloadQuickErrorFile}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
          >
            <Download size={16} />
            Download error report (CSV)
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Step 2 — Re-upload corrected file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCorrectedFile(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={uploadParsing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 px-4 flex flex-col items-center justify-center gap-2 text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadParsing ? (
              <>
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <span className="font-medium text-gray-700">Validating file…</span>
              </>
            ) : (
              <>
                <Upload size={28} className="text-gray-400" />
                <span className="font-medium text-gray-800">Drop CSV here or click to browse</span>
                <span className="text-xs text-gray-500">Same columns as the download; mock flow accepts any non-empty CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-5">
        Prefer fixing in the app?{' '}
        <button type="button" onClick={() => setUiMode('inline')} className="text-indigo-600 font-medium hover:underline cursor-pointer">
          Switch to inline editor
        </button>
      </p>
    </>
  )

  const inlineBody = (
    <>
      {employees.length > 1 && (
        <div className="pb-4 flex-shrink-0 -mt-1">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {employees.map((e, idx) => {
              const hasErrors = countQuickErrorIssues(e) > 0
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditingIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    idx === editingIdx
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : hasErrors
                        ? 'bg-red-50/50 border-red-200 text-red-700 hover:bg-red-50'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {hasErrors ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                  {e.name || e.empId || `Employee ${idx + 1}`}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {errorCount} issue{errorCount > 1 ? 's' : ''} on this employee — basic info, plans, or dependents
            </p>
            <p className="text-xs text-red-700 mt-0.5">Same layout as Quick Add. Fix highlighted sections and resubmit.</p>
          </div>
        </div>
      )}

      <section className={`${updateFormSectionShell.basic} mb-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${formSectionTitleClass} flex items-center gap-2`}>
            <span className={`${formSectionBadgeClass} ${basicSectionDirty ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {basicSectionDirty ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            </span>
            Basic Information
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          <ErrorModalFormField label="Full Name" required value={emp.name} error={basicErrors.name}
            onChange={(v) => updateField(editingIdx, 'name', v)} placeholder="e.g. Rahul Sharma" />
          <ErrorModalFormField label="Employee ID" required value={emp.empId} error={basicErrors.empId}
            onChange={(v) => updateField(editingIdx, 'empId', v)} placeholder="e.g. EMP001" />
          <ErrorModalFormField label="Email" required type="email" value={emp.email} error={basicErrors.email}
            onChange={(v) => updateField(editingIdx, 'email', v)} placeholder="e.g. rahul@acko.com" />
          <ErrorModalFormField label="Date of Birth" required type="date" value={emp.dob} error={basicErrors.dob}
            onChange={(v) => updateField(editingIdx, 'dob', v)} />
          <ErrorModalSelectField label="Gender" required value={emp.gender} error={basicErrors.gender}
            onChange={(v) => updateField(editingIdx, 'gender', v)} placeholder="Select gender"
            options={['Male', 'Female', 'Other']} />
          <ErrorModalFormField label="Date of Joining" required type="date" value={emp.doj} error={basicErrors.doj}
            onChange={(v) => updateField(editingIdx, 'doj', v)} />
          <ErrorModalFormField label="Mobile number" optional type="tel" value={emp.mobile} error={basicErrors.mobile}
            onChange={(v) => updateField(editingIdx, 'mobile', v)} placeholder="e.g. 9876543210" />
        </div>
      </section>

      {(pScope.gmc || pScope.gpa) && (
      <section className={`${updateFormSectionShell.plans} mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`${formSectionTitleClass} flex items-center gap-2`}>
            <span className={`${formSectionBadgeClass} ${planFieldErrors.plans ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'}`}>
              {planFieldErrors.plans ? <AlertCircle size={14} /> : '2'}
            </span>
            Insurance Plans
          </h3>
        </div>
        <p className="text-[11px] text-gray-500 mb-3 leading-snug">
          Only plan types and options that were part of this endorsement are shown. You cannot add new cover types here.
        </p>
        {planFieldErrors.plans && (
          <p className="text-xs text-red-600 mb-3 flex items-center gap-1"><AlertCircle size={12} /> {planFieldErrors.plans}</p>
        )}
        <PlanSelection
          plans={emp.plans || {}}
          onChange={(p) => updatePlans(editingIdx, p)}
          hideInsuranceHeader
          showGmcBlock={pScope.gmc}
          showGpaBlock={pScope.gpa}
          disableGmcToggleOff={pScope.gmc && !!(emp.plans?.gmcBasePlan)}
          disableGpaToggleOff={pScope.gpa && !!(emp.plans?.gpaBasePlan)}
          allowGmcTopup={pOpt.topup}
          allowGmcAddons={pOpt.addons}
          allowGmcSecondary={pOpt.secondary}
        />
      </section>
      )}

      {showDependentsSection && (
      <section className={updateFormSectionShell.dependents}>
        <h3 className={`${formSectionTitleClass} flex items-center gap-2 mb-4`}>
          <span className={`${formSectionBadgeClass} bg-violet-100 text-violet-600`}>3</span>
          Dependents
        </h3>
        <DependentForm
          dependents={emp.dependents || []}
          onChange={(deps) => updateDependents(editingIdx, deps)}
          employeePlans={emp.plans || {}}
          maxDependentsAllowed={emp._maxDependents != null ? emp._maxDependents : undefined}
        />
      </section>
      )}

      {currentEmployeesWithErrors > ERROR_LIST_THRESHOLD && (
        <p className="text-xs text-gray-500 mt-5">
          More than {ERROR_LIST_THRESHOLD} employees with errors?{' '}
          <button type="button" onClick={() => setUiMode('filefix')} className="text-indigo-600 font-medium hover:underline cursor-pointer">
            Use download &amp; re-upload
          </button>
        </p>
      )}
    </>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {uiMode === 'filefix' ? 'Fix via file & resubmit' : 'Fix & resubmit'}
              </h3>
              <p className="text-xs text-gray-500">{entry.action} &middot; {formatDate(entry.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {uiMode === 'filefix' ? fileFixBody : inlineBody}
        </div>

        {uiMode === 'inline' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-gray-500">
              {allValid
                ? <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> All errors resolved – ready to resubmit</span>
                : <span className="text-gray-500">Fix all highlighted fields to resubmit</span>}
            </p>
            <button
              onClick={handleResubmit}
              disabled={!allValid || submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? 'Resubmitting...' : 'Fix & resubmit'}
            </button>
          </div>
        )}

        {uiMode === 'filefix' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickField({ label, type = 'text', required, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white transition-all ${
          error
            ? 'border-red-300 bg-red-50/30 ring-1 ring-red-200'
            : value
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-gray-200'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
    </div>
  )
}

function BulkErrorModal({ entry, onClose }) {
  const { updateEntry } = useEndorsements()
  const bulkFileInputRef = useRef(null)

  const [rows, setRows] = useState(() => [...getBulkMockRowsForEntry(entry)])
  const [mode, setMode] = useState(() => {
    const seed = getBulkMockRowsForEntry(entry)
    return countBulkRowsWithErrors(seed) > ERROR_LIST_THRESHOLD ? 'filefix' : 'fix'
  })
  const [expandedRow, setExpandedRow] = useState(() => {
    const seed = getBulkMockRowsForEntry(entry)
    return seed.find((r) => bulkRowHasValidationGap(r))?.id ?? seed[0]?.id
  })
  const [resubmitting, setResubmitting] = useState(false)
  const [uploadParsing, setUploadParsing] = useState(false)
  const [resubmitted, setResubmitted] = useState(false)

  const listedErrorTotal = useMemo(() => countBulkListedErrors(rows), [rows])
  const rowsWithErrorsCount = useMemo(() => countBulkRowsWithErrors(rows), [rows])
  const rowHasErrors = bulkRowHasValidationGap
  const allFixed = rows.every((r) => !rowHasErrors(r))

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const updateDependent = (rowId, depIdx, field, value) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r
      const deps = [...(r.dependents || [])]
      deps[depIdx] = { ...deps[depIdx], [field]: value }
      return { ...r, dependents: deps }
    }))
  }

  const addDependentToRow = (rowId) => {
    setRows((prev) => prev.map((r) => (r.id !== rowId ? r : { ...r, dependents: [...(r.dependents || []), { name: '', relation: '', dob: '' }] })))
  }

  const removeDependentFromRow = (rowId, depIdx) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r
      const deps = (r.dependents || []).filter((_, i) => i !== depIdx)
      return { ...r, dependents: deps }
    }))
  }

  const downloadBulkErrorFile = () => {
    const header = ['employee_id', 'full_name', 'email', 'dob', 'mobile', 'date_of_joining', 'dependent_count', 'validation_errors']
    const dataRows = rows.map((r) => {
      const errMsg = Array.isArray(r.errors) && r.errors.length > 0
        ? r.errors.join(' | ')
        : rowHasErrors(r)
          ? 'See missing mandatory fields in row'
          : ''
      return [r.empId, r.name, r.email, r.dob, r.mobile, r.doj, (r.dependents || []).length, errMsg]
    })
    downloadCsv(`bulk-endorsement-errors-${entry.id}.csv`, header, dataRows)
  }

  const handleCorrectedBulkFile = (file) => {
    if (!file) return
    setUploadParsing(true)
    setTimeout(() => {
      setUploadParsing(false)
      setResubmitted(true)
      updateEntry(entry.id, { status: 'Success' })
    }, 1500)
  }

  const handleResubmit = () => {
    setResubmitting(true)
    setTimeout(() => {
      setResubmitting(false)
      setResubmitted(true)
      updateEntry(entry.id, { status: 'Success' })
    }, 1500)
  }

  const switchToInlineFix = () => {
    setMode('fix')
    const id = rows.find((r) => bulkRowHasListedErrors(r))?.id ?? rows[0]?.id
    setExpandedRow(id)
  }

  if (resubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Corrections Submitted</h3>
            <p className="text-sm text-gray-500">The corrected records have been reprocessed successfully.</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer">Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {mode === 'filefix' ? 'Fix via file & resubmit' : 'Endorsement failed'}
              </h3>
              <p className="text-xs text-gray-500">{formatDate(entry.date)} &middot; {entry.action}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {mode === 'filefix' && (
            <>
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-900">
                  {rowsWithErrorsCount} row{rowsWithErrorsCount !== 1 ? 's' : ''} with errors
                  {listedErrorTotal > 0 && (
                    <span className="font-normal text-amber-800/95">
                      {' '}
                      · {listedErrorTotal} validation issue{listedErrorTotal !== 1 ? 's' : ''} total
                    </span>
                  )}
                </p>
                <p className="text-xs text-amber-800/90 mt-1.5 leading-relaxed">
                  When more than {ERROR_LIST_THRESHOLD} employees (rows) have errors, use the CSV: download, correct offline, then upload here for reprocessing.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Step 1 — Download</p>
                <button
                  type="button"
                  onClick={downloadBulkErrorFile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                >
                  <Download size={16} />
                  Download error report (CSV)
                </button>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Step 2 — Re-upload corrected file</p>
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCorrectedBulkFile(f)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  disabled={uploadParsing}
                  onClick={() => bulkFileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 px-4 flex flex-col items-center justify-center gap-2 text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploadParsing ? (
                    <>
                      <Loader2 size={28} className="text-indigo-500 animate-spin" />
                      <span className="font-medium text-gray-700">Reprocessing file…</span>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-gray-400" />
                      <span className="font-medium text-gray-800">Drop CSV here or click to browse</span>
                      <span className="text-xs text-gray-500">Mock flow accepts any CSV and marks the endorsement successful</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Prefer fixing in the app?{' '}
                <button type="button" onClick={switchToInlineFix} className="text-indigo-600 font-medium hover:underline cursor-pointer">
                  Switch to inline editor
                </button>
              </p>
            </>
          )}

          {mode === 'fix' && (
            <>
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-red-800">
                  <span className="font-semibold">{listedErrorTotal}</span> issue{listedErrorTotal !== 1 ? 's' : ''} to clear &middot;{' '}
                  <span className="font-semibold">{rowsWithErrorsCount}</span> row{rowsWithErrorsCount !== 1 ? 's' : ''} with errors
                </p>
                {rowsWithErrorsCount > ERROR_LIST_THRESHOLD && (
                  <button
                    type="button"
                    onClick={() => setMode('filefix')}
                    className="text-xs font-medium text-indigo-700 hover:text-indigo-900 whitespace-nowrap cursor-pointer"
                  >
                    Use download &amp; re-upload instead
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{rows.length} employees &middot; click a row to expand</p>
              </div>

              <div className="space-y-3">
                {rows.map(row => {
                  const isOpen = expandedRow === row.id
                  const hasErr = bulkRowHasListedErrors(row)
                  const rowListedErrors = countBulkListedErrors([row])
                  return (
                    <div key={row.id} className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-indigo-300 ring-1 ring-indigo-100' : hasErr ? 'border-red-200' : 'border-emerald-200'}`}>
                      <button
                        onClick={() => setExpandedRow(isOpen ? null : row.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasErr ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            {hasErr ? <AlertCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{row.name || 'Unnamed'} <span className="text-xs text-gray-400 font-normal">{row.empId}</span></p>
                            <p className="text-xs text-gray-500">{row.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(row.dependents || []).length > 0 && (
                            <span className="text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">{(row.dependents || []).length} dep{(row.dependents || []).length > 1 ? 's' : ''}</span>
                          )}
                          {hasErr && rowListedErrors > 0 && (
                            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{rowListedErrors} error{rowListedErrors > 1 ? 's' : ''}</span>
                          )}
                          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                          <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100/60">
                            <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider mb-3">Basic Information</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                              <BulkField label="Full Name" required value={row.name} error={!row.name} onChange={v => updateRow(row.id, 'name', v)} placeholder="Full name" />
                              <BulkField label="Employee ID" required value={row.empId} error={!row.empId} onChange={v => updateRow(row.id, 'empId', v)} placeholder="EMP..." />
                              <BulkField label="Email" required value={row.email} error={!row.email} onChange={v => updateRow(row.id, 'email', v)} placeholder="email@acko.com" />
                              <BulkField label="Date of Birth" required type="date" value={row.dob} error={!row.dob} onChange={v => updateRow(row.id, 'dob', v)} />
                              <BulkField label="Mobile" value={row.mobile} onChange={v => updateRow(row.id, 'mobile', v)} placeholder="9876543210" />
                              <BulkField label="Gender" value={row.gender} onChange={v => updateRow(row.id, 'gender', v)} placeholder="Male / Female" />
                              <BulkField label="Date of Joining" type="date" value={row.doj} onChange={v => updateRow(row.id, 'doj', v)} />
                            </div>
                          </div>

                          <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100/60">
                            <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider mb-3">Insurance Plans</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Heart size={13} className="text-blue-600" />
                                  <span className="text-xs font-semibold text-gray-900">GMC</span>
                                </div>
                                <select value={row.gmcBase} onChange={e => updateRow(row.id, 'gmcBase', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
                                  <option value="">Select GMC plan</option>
                                  {basePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield size={13} className="text-violet-600" />
                                  <span className="text-xs font-semibold text-gray-900">GPA</span>
                                </div>
                                <select value={row.gpaBase} onChange={e => updateRow(row.id, 'gpaBase', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
                                  <option value="">Select GPA plan</option>
                                  {gpaBasePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100/60">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider">Dependents ({(row.dependents || []).length})</p>
                              <button type="button" onClick={() => addDependentToRow(row.id)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer">
                                <Plus size={12} /> Add dependent
                              </button>
                            </div>
                            {(row.dependents || []).length === 0 ? (
                              <p className="text-xs text-gray-500 py-2">No dependents. Click &quot;Add dependent&quot; to add one.</p>
                            ) : (
                              <div className="space-y-3">
                                {(row.dependents || []).map((dep, di) => (
                                  <div key={di} className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[11px] font-semibold text-gray-500">Dependent {di + 1}</span>
                                      <button type="button" onClick={() => removeDependentFromRow(row.id, di)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <BulkField label="Name" value={dep.name} onChange={v => updateDependent(row.id, di, 'name', v)} placeholder="Dependent name" />
                                      <div>
                                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Relation</label>
                                        <select value={dep.relation || ''} onChange={e => updateDependent(row.id, di, 'relation', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
                                          <option value="">Select relation</option>
                                          {dependentRelations.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                                        </select>
                                      </div>
                                      <BulkField label="Date of Birth" type="date" value={dep.dob} onChange={v => updateDependent(row.id, di, 'dob', v)} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          {mode === 'filefix' ? (
            <div className="flex w-full justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={downloadBulkErrorFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Download size={15} /> Download error report
                </button>
                <p className="text-xs text-gray-500">
                  {allFixed
                    ? <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> All errors resolved</span>
                    : `${rows.filter((r) => !rowHasErrors(r)).length}/${rows.length} employees fixed`}
                </p>
              </div>
              <button
                onClick={handleResubmit}
                disabled={!allFixed || resubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0"
              >
                {resubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {resubmitting ? 'Resubmitting...' : 'Resubmit corrections'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BulkField({ label, type = 'text', required, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white transition-all ${error ? 'border-red-300 bg-red-50/30 ring-1 ring-red-200' : value ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200'}`} />
    </div>
  )
}

function ViewDetailModal({ entry, onClose }) {
  const hasDetails = entry.details && Array.isArray(entry.details) && entry.details.length > 0
  const showEmailCol = hasDetails && entry.details.some((d) => d.email)
  const ps = entry.premiumSummary
  const displayStatus = resolveEndorsementDisplayStatus(entry)
  const showSuccessContent = hasSuccessfulEndorsementRecords(entry)

  const recordsTable = hasDetails ? (
    <>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {hasSuccessfulEndorsementRecords(entry) ? 'Added / updated / affected records' : 'Affected employees / records'}
      </p>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[360px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              {showEmailCol && (
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              )}
              {entry.details[0]?.reason && (
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
              )}
              {entry.details[0]?.dateOfLeaving && (
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entry.details.map((d, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{d.id ?? d.empId ?? '—'}</td>
                {showEmailCol && <td className="px-4 py-2.5 text-gray-600">{d.email || '—'}</td>}
                {d.reason && <td className="px-4 py-2.5 text-gray-600">{d.reason}</td>}
                {d.dateOfLeaving && <td className="px-4 py-2.5 text-gray-600">{formatDate(d.dateOfLeaving)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <FileText size={20} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">Detailed breakdown is not available for this entry.</p>
      <p className="text-xs text-gray-400 mt-1">Download the report to view the full data.</p>
    </div>
  )

  const premiumBlock = hasSuccessfulEndorsementRecords(entry) && ps && (
    <div className="rounded-lg border border-gray-200/90 bg-gray-50/60 p-3.5">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-gray-200/80 flex items-center justify-center flex-shrink-0">
          <Wallet size={14} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Premium (reference)</p>
          <p className="text-base font-semibold text-gray-800 tabular-nums">
            {formatInrSigned(ps.totalInclGst ?? 0)}
          </p>
          {ps.gstRatePercent != null && (
            <p className="text-[10px] text-gray-500 mt-0.5">Incl. GST at {ps.gstRatePercent}%</p>
          )}
        </div>
      </div>
      {Array.isArray(ps.lines) && ps.lines.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-gray-200/80 space-y-1.5">
          {ps.lines.map((row, i) => (
            <div key={i} className="flex justify-between gap-3 text-[11px]">
              <span className="text-gray-500 leading-snug">{row.label}</span>
              <span className="font-medium text-gray-700 tabular-nums shrink-0">{formatInrSigned(row.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye size={18} className="text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
              <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-0.5">
                <span>{formatDate(entry.date)} · {entry.doneBy}</span>
                {showSuccessContent && (
                  <>
                    <span className="text-gray-300">·</span>
                    <HistoryStatusMetadata status={displayStatus} compact />
                    <span className="text-gray-300">·</span>
                    <span>{entry.count} record(s)</span>
                    <span className="text-gray-400 capitalize">· {entry.type || 'quick'}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {showSuccessContent ? (
            <div className="space-y-5">
              {recordsTable}
              {premiumBlock}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <HistoryStatusMetadata status={displayStatus} />
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Employee Count</p>
                  <p className="text-lg font-bold text-gray-900">{entry.count}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{entry.type || 'Quick'}</p>
                </div>
              </div>
              {recordsTable}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Download size={15} /> Download Report
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
