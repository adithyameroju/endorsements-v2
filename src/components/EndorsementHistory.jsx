import { useState, useEffect, useMemo } from 'react'
import { Eye, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, X, Upload, Loader2, FileText, Pencil, Check, ArrowUpRight } from 'lucide-react'
import { useEndorsements } from '../store/EndorsementStore'

export default function EndorsementHistory() {
  const { history } = useEndorsements()
  const [currentPage, setCurrentPage] = useState(1)
  const [errorPanel, setErrorPanel] = useState(null)
  const [progressPanel, setProgressPanel] = useState(null)
  const [viewPanel, setViewPanel] = useState(null)

  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const filteredHistory = useMemo(() => {
    let items = [...history]
    if (statusFilter !== 'All') {
      items = items.filter(r => r.status === statusFilter)
    }
    if (dateFrom) {
      items = items.filter(r => r.date >= dateFrom)
    }
    if (dateTo) {
      items = items.filter(r => r.date <= dateTo)
    }
    items.sort((a, b) => {
      if (sortBy === 'newest') return b.date.localeCompare(a.date)
      if (sortBy === 'oldest') return a.date.localeCompare(b.date)
      if (sortBy === 'count') return b.count - a.count
      return 0
    })
    return items
  }, [history, statusFilter, dateFrom, dateTo, sortBy])

  const perPage = 8
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filteredHistory.slice((safePage - 1) * perPage, safePage * perPage)

  const hasFilters = statusFilter !== 'All' || dateFrom || dateTo
  const clearFilters = () => { setStatusFilter('All'); setDateFrom(''); setDateTo(''); setSortBy('newest'); setCurrentPage(1) }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Endorsement History</h2>
              <p className="text-xs text-gray-500 mt-0.5">Track all endorsement activities and their status</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300"
                title="From date"
              />
              <span className="text-xs text-gray-400">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300"
                title="To date"
              />

              <div className="w-px h-5 bg-gray-200" />

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="In Progress">In Progress</option>
              </select>

              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setCurrentPage(1) }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="count">By count</option>
              </select>

              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer whitespace-nowrap">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full min-w-[700px] table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[22%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-gray-50/95 border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Done By</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((row) => (
                <tr key={row.id} className={`hover:bg-gray-50/50 transition-colors ${row.isNew ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(row.date)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 truncate">{row.action}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 truncate">{row.doneBy}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={row.status}
                      onClickFailed={() => setErrorPanel(row)}
                      onClickProgress={() => setProgressPanel(row)}
                    />
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{row.count}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewPanel(row)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
                        <Download size={13} /> Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-500">
            {filteredHistory.length > 0
              ? `Showing ${(safePage - 1) * perPage + 1}–${Math.min(safePage * perPage, filteredHistory.length)} of ${filteredHistory.length}`
              : 'No results'}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  page === currentPage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error detail panel with inline corrections */}
      {errorPanel && (
        <ErrorCorrectionModal entry={errorPanel} onClose={() => setErrorPanel(null)} />
      )}

      {/* In Progress detail panel */}
      {progressPanel && (
        <ProgressModal entry={progressPanel} onClose={() => setProgressPanel(null)} />
      )}

      {/* View detail modal */}
      {viewPanel && (
        <ViewDetailModal entry={viewPanel} onClose={() => setViewPanel(null)} />
      )}
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
  }, [entry.id])

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

function ErrorCorrectionModal({ entry, onClose }) {
  const { updateEntry } = useEndorsements()
  const [mode, setMode] = useState('summary')
  const [rows, setRows] = useState([
    { id: 1, empId: 'EMP101', name: 'Raj Verma', email: '', dob: '1990-05-12', error: 'Missing email address' },
    { id: 2, empId: 'EMP102', name: 'Sneha Das', email: 'sneha.d@acko.com', dob: '', error: 'Missing date of birth' },
    { id: 3, empId: '', name: 'Kiran Rao', email: 'kiran.r@acko.com', dob: '1995-08-20', error: 'Missing employee ID' },
  ])
  const [resubmitting, setResubmitting] = useState(false)
  const [resubmitted, setResubmitted] = useState(false)

  const errorCount = entry.count > 1 ? Math.ceil(entry.count * 0.15) : 1
  const allFixed = rows.every(r => r.empId && r.name && r.email && r.dob)

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleResubmit = () => {
    setResubmitting(true)
    setTimeout(() => {
      setResubmitting(false)
      setResubmitted(true)
      updateEntry(entry.id, { status: 'Success' })
    }, 1500)
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Endorsement Failed</h3>
              <p className="text-xs text-gray-500">{formatDate(entry.date)} &middot; {entry.action}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {mode === 'summary' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-900 mb-1">
                  {errorCount} of {entry.count || errorCount} rows had errors
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Some records could not be processed due to missing or invalid data. You can fix them directly below or download the error report.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('fix')}
                  className="flex-1 p-4 bg-white border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Pencil size={16} className="text-indigo-600" />
                    <p className="text-sm font-semibold text-gray-900">Fix Inline</p>
                  </div>
                  <p className="text-xs text-gray-500">Correct the errors directly in the table and resubmit</p>
                </button>
                <button className="flex-1 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all cursor-pointer text-left">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Download size={16} className="text-gray-600" />
                    <p className="text-sm font-semibold text-gray-900">Download & Re-upload</p>
                  </div>
                  <p className="text-xs text-gray-500">Download error report, fix offline, and re-upload the file</p>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Common errors found</p>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#8226;</span> Missing mandatory fields (email, DOB)</div>
                  <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#8226;</span> Invalid date format in some rows</div>
                  <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#8226;</span> Missing employee IDs</div>
                </div>
              </div>
            </>
          )}

          {mode === 'fix' && (
            <>
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('summary')} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1">
                  <ChevronLeft size={14} /> Back to summary
                </button>
                <p className="text-xs text-gray-500">{rows.length} rows to fix</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Emp ID</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">DOB</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map(row => (
                        <tr key={row.id}>
                          <td className="px-3 py-2">
                            <input
                              value={row.empId}
                              onChange={e => updateRow(row.id, 'empId', e.target.value)}
                              className={`w-full px-2 py-1 text-sm border rounded-md ${!row.empId ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}
                              placeholder="EMP..."
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={row.name}
                              onChange={e => updateRow(row.id, 'name', e.target.value)}
                              className={`w-full px-2 py-1 text-sm border rounded-md ${!row.name ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={row.email}
                              onChange={e => updateRow(row.id, 'email', e.target.value)}
                              className={`w-full px-2 py-1 text-sm border rounded-md ${!row.email ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}
                              placeholder="email@..."
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={row.dob}
                              onChange={e => updateRow(row.id, 'dob', e.target.value)}
                              className={`w-full px-2 py-1 text-sm border rounded-md ${!row.dob ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-xs text-red-600">{row.error}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          {mode === 'summary' ? (
            <>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Download size={15} /> Download Error Report
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Close</button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                {allFixed
                  ? <span className="text-emerald-600 font-medium">All errors resolved</span>
                  : 'Fix all highlighted fields to resubmit'}
              </p>
              <button
                onClick={handleResubmit}
                disabled={!allFixed || resubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
              >
                {resubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {resubmitting ? 'Resubmitting...' : 'Resubmit Corrections'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ViewDetailModal({ entry, onClose }) {
  const statusColor = entry.status === 'Success'
    ? 'bg-emerald-100 text-emerald-700'
    : entry.status === 'Failed'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'

  const hasDetails = entry.details && Array.isArray(entry.details) && entry.details.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Eye size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
              <p className="text-xs text-gray-500">{formatDate(entry.date)} &middot; {entry.doneBy}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
                {entry.status === 'Success' && <CheckCircle2 size={11} />}
                {entry.status === 'Failed' && <AlertCircle size={11} />}
                {entry.status === 'In Progress' && <Clock size={11} />}
                {entry.status}
              </span>
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

          {/* Employee details if available */}
          {hasDetails ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Employee Details</p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
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
                        <td className="px-4 py-2.5 text-gray-600">{d.id}</td>
                        <td className="px-4 py-2.5 text-gray-600">{d.department}</td>
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Download size={15} /> Download Report
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, onClickFailed, onClickProgress }) {
  if (status === 'In Progress') {
    return (
      <button
        onClick={onClickProgress}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
      >
        <Clock size={12} className="animate-spin" /> Processing
      </button>
    )
  }
  if (status === 'Success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full">
        <CheckCircle2 size={12} /> Success
      </span>
    )
  }
  return (
    <button
      onClick={onClickFailed}
      className="group inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
    >
      <AlertCircle size={12} />
      Failed
      <ArrowUpRight size={11} className="text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
