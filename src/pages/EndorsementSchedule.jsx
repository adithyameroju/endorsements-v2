import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileStack,
  Loader2,
} from 'lucide-react'
import PageHeader from '../components/PageHeaderV2'
import EndorsementSortTh from '../components/endorsements-v2/EndorsementSortTh'
import {
  EndorsementActivityCell,
  EndorsementRunModeCell,
  EndorsementDoneByCell,
  EndorsementLogStatusBadge,
  resolveEndorsementDisplayStatus,
} from '../components/endorsements-v2/endorsementLogTableCells'
import { endorsementsModuleCrumb } from '../lib/breadcrumbPresets'
import { useEndorsements } from '../store/EndorsementStore'
import {
  SCHEDULE_PER_PAGE,
  TYPE_OPTIONS,
  FILTER_SELECT_CLASS,
  SCHEDULE_FILE_ICON_BTN,
  downloadEndorsementDetailsExcel,
  eligibleForSchedule,
  isScheduleEligibleEndorsement,
  endorsementNumber,
  entryCdImpactSignedInr,
  EndorsementCdImpactCell,
  createBatchScheduleRefs,
  formatShortDate,
  isScheduleDocumentReady,
  ScheduleDocumentStatusCell,
  runSchedulePdfProgressDemo,
  SCHEDULE_PDF_STEPS,
  SCHEDULE_PDF_STEP_MS,
  ENDORSEMENT_THEAD_TR_CLASS,
  PORTAL_TABLE_SECTION_GUTTER,
  PORTAL_TABLE_SCROLL_CLASS,
  PORTAL_TABLE_CLASS,
  PORTAL_TABLE_HEAD_EDGE_PL,
  PORTAL_TABLE_HEAD_EDGE_PR,
  PORTAL_TABLE_CELL_INNER,
  PORTAL_TABLE_CELL_EDGE_PL,
  PORTAL_TABLE_CELL_EDGE_PR,
  PORTAL_TABLE_EDGE_PL,
  PORTAL_TABLE_EDGE_PR,
  compareScheduleRowsPending,
  compareScheduleRowsGenerated,
  entryMatchesDateRange,
} from '../components/endorsements-v2/endorsementScheduleShared'

function TabCountBadge({ n, active }) {
  return (
    <span
      className={`ml-2 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums leading-none ${
        active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {n}
    </span>
  )
}

const generateToolbarBtnClass =
  'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:hover:bg-gray-100'

const clearSelectionBtnClass =
  'inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-40'

const SCHEDULE_PAGE_DATE_INPUT_CLASS =
  'min-h-[2.25rem] min-w-[7.5rem] cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function EndorsementSchedule() {
  const { history, updateEntry } = useEndorsements()
  const [tab, setTab] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const headerSelectRef = useRef(null)
  const [tablePage, setTablePage] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const genTimersRef = useRef([])
  const [scheduleSort, setScheduleSort] = useState(() =>
    tab === 'pending' ? { key: 'date', dir: 'desc' } : { key: 'generatedOn', dir: 'desc' },
  )

  useEffect(() => {
    return () => {
      genTimersRef.current.forEach((tid) => window.clearTimeout(tid))
      genTimersRef.current = []
    }
  }, [])
  useEffect(() => {
    setSelectedIds(new Set())
  }, [tab])

  useEffect(() => {
    setScheduleSort(tab === 'pending' ? { key: 'date', dir: 'desc' } : { key: 'generatedOn', dir: 'desc' })
  }, [tab])

  useEffect(() => {
    setTablePage(1)
  }, [tab, typeFilter, dateFrom, dateTo])

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => String(b.recordedAt || b.date).localeCompare(String(a.recordedAt || a.date))),
    [history],
  )

  const portfolioPending = useMemo(
    () => sortedHistory.filter((e) => isScheduleEligibleEndorsement(e) && !e.scheduleRef),
    [sortedHistory],
  )

  const portfolioGenerated = useMemo(
    () => sortedHistory.filter((e) => !!e.scheduleRef && isScheduleEligibleEndorsement(e)),
    [sortedHistory],
  )

  const tabBadgeCounts = useMemo(
    () => ({
      pending: portfolioPending.length,
      generated: portfolioGenerated.length,
    }),
    [portfolioPending.length, portfolioGenerated.length],
  )

  const tabSourceRows = useMemo(() => {
    return tab === 'pending' ? portfolioPending : portfolioGenerated
  }, [tab, portfolioPending, portfolioGenerated])

  const filteredRows = useMemo(() => {
    let list = tabSourceRows
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter)
    if (dateFrom || dateTo) list = list.filter((e) => entryMatchesDateRange(e, dateFrom, dateTo))
    return list
  }, [tabSourceRows, typeFilter, dateFrom, dateTo])

  function handleScheduleSort(columnKey) {
    setScheduleSort((prev) => {
      if (prev.key === columnKey) return { key: columnKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      const preferDesc =
        columnKey === 'date' ||
        columnKey === 'generatedOn' ||
        columnKey === 'amount' ||
        columnKey === 'status' ||
        columnKey === 'endorsementStatus'
      return { key: columnKey, dir: preferDesc ? 'desc' : 'asc' }
    })
    setTablePage(1)
  }

  const sortedFilteredRows = useMemo(() => {
    const list = [...filteredRows]
    const cmp = tab === 'pending' ? compareScheduleRowsPending : compareScheduleRowsGenerated
    list.sort((a, b) => cmp(a, b, scheduleSort.key, scheduleSort.dir))
    return list
  }, [filteredRows, tab, scheduleSort])

  const scheduleTotalPages = Math.max(1, Math.ceil(sortedFilteredRows.length / SCHEDULE_PER_PAGE))
  const scheduleSafePage = Math.min(tablePage, scheduleTotalPages)
  const paginatedRows = sortedFilteredRows.slice((scheduleSafePage - 1) * SCHEDULE_PER_PAGE, scheduleSafePage * SCHEDULE_PER_PAGE)

  useEffect(() => {
    setTablePage((p) => Math.min(Math.max(1, p), scheduleTotalPages))
  }, [scheduleTotalPages])

  const eligibleFiltered = useMemo(() => filteredRows.filter(eligibleForSchedule), [filteredRows])

  const allEligibleSelected =
    eligibleFiltered.length > 0 && eligibleFiltered.every((e) => selectedIds.has(e.id))

  const someEligibleSelected = eligibleFiltered.some((e) => selectedIds.has(e.id))

  useEffect(() => {
    const el = headerSelectRef.current
    if (!el) return
    el.indeterminate = !allEligibleSelected && someEligibleSelected
  }, [allEligibleSelected, someEligibleSelected])

  const showSelectionColumn = tab === 'pending'

  const selectedEligibleCount = sortedHistory.filter((e) => selectedIds.has(e.id) && eligibleForSchedule(e)).length

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllEligible() {
    if (allEligibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        eligibleFiltered.forEach((e) => next.delete(e.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        eligibleFiltered.forEach((e) => next.add(e.id))
        return next
      })
    }
  }

  async function generateForSelection() {
    const eligible = sortedHistory.filter((e) => selectedIds.has(e.id) && eligibleForSchedule(e))
    const ids = eligible.map((e) => e.id)
    if (ids.length === 0) {
      alert('Select at least one completed endorsement that does not have a schedule yet.')
      return
    }
    setGenerating(true)
    genTimersRef.current.forEach((tid) => window.clearTimeout(tid))
    genTimersRef.current = []
    try {
      await new Promise((r) => window.setTimeout(r, 450))
      const refs = createBatchScheduleRefs(ids.length)
      const ts = new Date().toISOString()
      ids.forEach((id, i) => {
        updateEntry(id, {
          scheduleRef: refs[i],
          scheduleGeneratedAt: ts,
          schedulePdfStatus: 'generating',
          schedulePdfProgress: 0,
        })
      })
      setSelectedIds(new Set())
      setTab('generated')
      runSchedulePdfProgressDemo(ids, updateEntry, genTimersRef)

      const staggerMax = ids.length > 0 ? 140 + (ids.length - 1) * 48 : 0
      const progressMs = SCHEDULE_PDF_STEPS * SCHEDULE_PDF_STEP_MS
      const csvDelayMs = staggerMax + progressMs + 120

      genTimersRef.current.push(
        window.setTimeout(() => {
          if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
          setToast({
            message: `Invoice schedules generated for ${ids.length} endorsement(s). Download PDF or details from the table when ready.`,
          })
          toastTimerRef.current = window.setTimeout(() => setToast(null), 5200)
        }, csvDelayMs),
      )
    } finally {
      setGenerating(false)
    }
  }

  function emptyColspan() {
    return tab === 'pending' ? 7 : 10
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-gray-50 px-6 py-6 lg:px-8">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-4 z-[120] flex max-w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-lg backdrop-blur-[2px]"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <span>{toast.message}</span>
        </div>
      ) : null}
      <div className="shrink-0">
        <PageHeader
          title="Endorsement Schedules"
          subtitle={
            tab === 'pending'
              ? 'Select rows to generate.'
              : 'Download PDF and endorsement details for generated schedules.'
          }
          breadcrumbs={[endorsementsModuleCrumb, { label: 'Schedules' }]}
        />
      </div>

      <section className="mb-2 mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`relative flex shrink-0 flex-wrap gap-7 border-b border-gray-200 pt-3.5 sm:gap-10 ${PORTAL_TABLE_SECTION_GUTTER}`}
          role="tablist"
          aria-label="Endorsement schedules"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            id="sched-tab-pending"
            className={`-mb-px inline-flex cursor-pointer items-center border-b-2 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 ${
              tab === 'pending'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
            }`}
            onClick={() => setTab('pending')}
          >
            Pending
            <TabCountBadge n={tabBadgeCounts.pending} active={tab === 'pending'} />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'generated'}
            id="sched-tab-generated"
            className={`-mb-px inline-flex cursor-pointer items-center border-b-2 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 ${
              tab === 'generated'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
            }`}
            onClick={() => setTab('generated')}
          >
            Generated
            <TabCountBadge n={tabBadgeCounts.generated} active={tab === 'generated'} />
          </button>
        </div>

        <div className={`shrink-0 border-b border-gray-100 py-3 ${PORTAL_TABLE_SECTION_GUTTER}`} role="tabpanel" aria-labelledby={`sched-tab-${tab}`}>
          <div className="flex flex-col gap-3">
            {showSelectionColumn && selectedEligibleCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50/90 px-4 py-2.5">
                <p className="text-sm font-medium text-indigo-950">
                  <span className="tabular-nums font-semibold">{selectedEligibleCount}</span> selected — generate invoices for these endorsements.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={generating || selectedEligibleCount === 0}
                    onClick={() => void generateForSelection()}
                    className={generateToolbarBtnClass}
                  >
                    {generating ? (
                      <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <FileStack size={18} aria-hidden />
                    )}
                    {generating ? 'Generating…' : 'Generate'}
                  </button>
                  {selectedIds.size >= 2 ? (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setSelectedIds(new Set())}
                      className={clearSelectionBtnClass}
                      aria-label="Clear selected rows"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`${SCHEDULE_PAGE_DATE_INPUT_CLASS} shrink-0`}
                  title="From date"
                  aria-label="Filter from date"
                />
                <span className="text-sm text-gray-400" aria-hidden>
                  –
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`${SCHEDULE_PAGE_DATE_INPUT_CLASS} shrink-0`}
                  title="To date"
                  aria-label="Filter to date"
                />
              </div>
              <span className="hidden h-6 w-px shrink-0 self-stretch bg-gray-200 lg:block lg:self-center" aria-hidden />
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={FILTER_SELECT_CLASS}
                  aria-label="Filter by run type"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={`${PORTAL_TABLE_SCROLL_CLASS} [-webkit-overflow-scrolling:touch]`}>
            <table className={PORTAL_TABLE_CLASS}>
              <thead className="sticky top-0 z-[1]">
                <tr className={ENDORSEMENT_THEAD_TR_CLASS}>
                  {showSelectionColumn ? (
                    <th className="w-11 px-2 py-2 text-left align-middle" scope="col">
                      <input
                        ref={headerSelectRef}
                        type="checkbox"
                        checked={allEligibleSelected}
                        disabled={eligibleFiltered.length === 0}
                        onChange={toggleSelectAllEligible}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Select all eligible endorsements in view"
                      />
                    </th>
                  ) : null}
                  {tab === 'pending' ? (
                    <>
                      <EndorsementSortTh
                        columnKey="endorsementNo"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className={PORTAL_TABLE_HEAD_EDGE_PL}
                      >
                        Endorsement no.
                      </EndorsementSortTh>
                      <EndorsementSortTh columnKey="date" sortKey={scheduleSort.key} sortDir={scheduleSort.dir} onSort={handleScheduleSort}>
                        Date
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="activity"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Activity
                      </EndorsementSortTh>
                      <EndorsementSortTh columnKey="entryMode" sortKey={scheduleSort.key} sortDir={scheduleSort.dir} onSort={handleScheduleSort}>
                        Entry mode
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="doneBy"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Done by
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="endorsementStatus"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className={`min-w-0 ${PORTAL_TABLE_HEAD_EDGE_PR}`}
                      >
                        Endorsement status
                      </EndorsementSortTh>
                    </>
                  ) : null}
                  {tab === 'generated' ? (
                    <>
                      <EndorsementSortTh
                        columnKey="endorsementNo"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className={PORTAL_TABLE_HEAD_EDGE_PL}
                      >
                        Endorsement no.
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="generatedOn"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                      >
                        Generated on
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="activity"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Activity
                      </EndorsementSortTh>
                      <EndorsementSortTh columnKey="entryMode" sortKey={scheduleSort.key} sortDir={scheduleSort.dir} onSort={handleScheduleSort}>
                        Entry mode
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="doneBy"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Done by
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="amount"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        align="right"
                        title="Amount debited from or credited to your CD balance for this endorsement."
                      >
                        CD wallet impact
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="endorsementStatus"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Endorsement status
                      </EndorsementSortTh>
                      <EndorsementSortTh
                        columnKey="status"
                        sortKey={scheduleSort.key}
                        sortDir={scheduleSort.dir}
                        onSort={handleScheduleSort}
                        className="min-w-0"
                      >
                        Schedule status
                      </EndorsementSortTh>
                      <th
                        scope="col"
                        className={`min-w-0 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#495057]`}
                      >
                        PDF
                      </th>
                      <th
                        scope="col"
                        className={`min-w-0 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#495057] ${PORTAL_TABLE_HEAD_EDGE_PR}`}
                      >
                        Endorsement details
                      </th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedFilteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={emptyColspan()} className={`${PORTAL_TABLE_EDGE_PL} ${PORTAL_TABLE_EDGE_PR} py-14 text-center align-middle`}>
                      <p className="text-sm text-gray-500">No endorsements match your filters.</p>
                    </td>
                  </tr>
                ) : tab === 'pending' ? (
                  paginatedRows.map((row) => {
                    const eligible = eligibleForSchedule(row)
                    return (
                      <tr key={row.id} className="bg-amber-50/30 transition-colors hover:bg-gray-50/70">
                        <td className="px-2 py-1.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            disabled={!eligible}
                            onChange={() => toggleSelected(row.id)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Select ${endorsementNumber(row)}`}
                          />
                        </td>
                        <td className={`whitespace-nowrap align-middle font-mono text-[12px] font-medium text-gray-900 ${PORTAL_TABLE_CELL_EDGE_PL}`}>
                          {endorsementNumber(row)}
                        </td>
                        <td className={`whitespace-nowrap align-middle text-[12px] text-gray-700 ${PORTAL_TABLE_CELL_INNER}`}>
                          {formatShortDate(row.recordedAt || row.date)}
                        </td>
                        <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                          <EndorsementActivityCell row={row} />
                        </td>
                        <td className={`align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                          <EndorsementRunModeCell row={row} />
                        </td>
                        <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                          <EndorsementDoneByCell row={row} />
                        </td>
                        <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_EDGE_PR}`}>
                          <EndorsementLogStatusBadge status={resolveEndorsementDisplayStatus(row)} compact />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                      <td className={`whitespace-nowrap align-middle font-mono text-[12px] font-medium text-gray-900 ${PORTAL_TABLE_CELL_EDGE_PL}`}>
                        {endorsementNumber(row)}
                      </td>
                      <td className={`whitespace-nowrap align-middle text-[12px] text-gray-700 ${PORTAL_TABLE_CELL_INNER}`}>
                        {formatShortDate(row.scheduleGeneratedAt)}
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <EndorsementActivityCell row={row} />
                      </td>
                      <td className={`align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <EndorsementRunModeCell row={row} />
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <EndorsementDoneByCell row={row} />
                      </td>
                      <td className={`whitespace-nowrap align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <EndorsementCdImpactCell row={row} />
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <EndorsementLogStatusBadge status={resolveEndorsementDisplayStatus(row)} compact />
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <ScheduleDocumentStatusCell row={row} />
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_INNER}`}>
                        <button
                          type="button"
                          disabled={!isScheduleDocumentReady(row)}
                          title={
                            isScheduleDocumentReady(row)
                              ? 'Download PDF'
                              : 'Available when document generation completes'
                          }
                          aria-label={
                            isScheduleDocumentReady(row)
                              ? 'Download PDF'
                              : 'PDF download unavailable until generation completes'
                          }
                          onClick={() => alert(`Demo: PDF download for ${row.scheduleRef}`)}
                          className={SCHEDULE_FILE_ICON_BTN}
                        >
                          <FileDown size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                        </button>
                      </td>
                      <td className={`min-w-0 align-middle ${PORTAL_TABLE_CELL_EDGE_PR}`}>
                        <button
                          type="button"
                          disabled={!isScheduleDocumentReady(row)}
                          title={
                            isScheduleDocumentReady(row)
                              ? 'Download endorsement details (Excel)'
                              : 'Available when document generation completes'
                          }
                          aria-label={
                            isScheduleDocumentReady(row)
                              ? 'Download endorsement details as Excel'
                              : 'Excel download unavailable until generation completes'
                          }
                          onClick={() => downloadEndorsementDetailsExcel(row)}
                          className={SCHEDULE_FILE_ICON_BTN}
                        >
                          <Download size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-white py-3 ${PORTAL_TABLE_SECTION_GUTTER}`}>
          <p className="text-xs font-normal text-gray-400">
            {sortedFilteredRows.length > 0
              ? `Showing ${(scheduleSafePage - 1) * SCHEDULE_PER_PAGE + 1}–${Math.min(scheduleSafePage * SCHEDULE_PER_PAGE, sortedFilteredRows.length)} of ${sortedFilteredRows.length}`
              : 'No results'}
          </p>
          <div className="flex items-center gap-1" role="navigation" aria-label="Schedule table pagination">
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={scheduleSafePage === 1 || sortedFilteredRows.length === 0}
              aria-label="Previous page"
              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            {Array.from({ length: scheduleTotalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setTablePage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === scheduleSafePage ? 'page' : undefined}
                className={`h-8 w-8 cursor-pointer rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ${
                  page === scheduleSafePage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.min(scheduleTotalPages, p + 1))}
              disabled={scheduleSafePage === scheduleTotalPages || sortedFilteredRows.length === 0}
              aria-label="Next page"
              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
