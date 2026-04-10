import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle, AlertTriangle, Trash2, CalendarClock, X, ChevronDown, ChevronUp, Lightbulb, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import CdBalanceFormWidget from '../components/CdBalanceFormWidget'
import QuickAddBatchStickyFooter from '../components/QuickAddBatchStickyFooter'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'
import { computeQuickDeleteCdState } from '../lib/updateFlowPremium'

const CD_RAIL_WIDTH_CLASS = 'w-full lg:w-[min(calc(19rem+10px),32vw)] lg:max-w-[calc(21rem+10px)]'

const STEPS = ['Select Employees', 'Date of Leaving', 'Review & Confirm']

export default function QuickDelete() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()

  const [step, setStep] = useState(1)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectionPanelOpen, setSelectionPanelOpen] = useState(true)

  const [globalDate, setGlobalDate] = useState('')
  const [dates, setDates] = useState({})
  const [applyDateAll, setApplyDateAll] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    if (!query.trim()) return mockEmployees
    const q = query.toLowerCase()
    return mockEmployees.filter(
      emp => emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)
    )
  }, [query])

  const selectedEmployees = mockEmployees.filter(e => selectedIds.has(e.id))
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))

  const deleteCdState = useMemo(
    () => computeQuickDeleteCdState(selectedEmployees),
    [selectedEmployees],
  )

  const quickDeleteReviewBatchSummary = useMemo(
    () => ({
      count: selectedEmployees.length,
      basicsComplete:
        selectedEmployees.length > 0 && selectedEmployees.every((e) => dates[e.id])
          ? selectedEmployees.length
          : 0,
      dependentCount: selectedEmployees.reduce((sum, e) => sum + (e.dependents?.length ?? 0), 0),
    }),
    [selectedEmployees, dates],
  )

  const selectionStepBatchSummary = useMemo(
    () => ({
      count: selectedIds.size,
      basicsComplete: selectedIds.size > 0 ? selectedIds.size : 0,
      dependentCount: selectedEmployees.reduce((sum, e) => sum + (e.dependents?.length ?? 0), 0),
    }),
    [selectedIds, selectedEmployees],
  )

  const datesStepBatchSummary = useMemo(
    () => ({
      count: selectedEmployees.length,
      basicsComplete: selectedEmployees.filter((e) => dates[e.id]).length,
      dependentCount: selectedEmployees.reduce((sum, e) => sum + (e.dependents?.length ?? 0), 0),
    }),
    [selectedEmployees, dates],
  )

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setErrors(prev => ({ ...prev, selection: undefined }))
  }

  const toggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filtered.forEach(e => next.delete(e.id))
      } else {
        filtered.forEach(e => next.add(e.id))
      }
      return next
    })
    setErrors(prev => ({ ...prev, selection: undefined }))
  }


  const goToStep2 = () => {
    if (selectedIds.size === 0) {
      setErrors({ selection: 'Select at least one employee' })
      return
    }
    setErrors({})
    setStep(2)
  }

  const goToStep3 = () => {
    const missingDate = selectedEmployees.some(emp => !dates[emp.id])
    if (missingDate) {
      setErrors({ date: 'Please set a date of leaving for every employee' })
      return
    }
    setErrors({})
    setStep(3)
  }

  const allDatesSet =
    selectedEmployees.length > 0 && selectedEmployees.every((emp) => dates[emp.id])

  const CD_PENDING_STEP1 =
    'Proceed with the selected employees, then enter dates of leaving in the next step to see CD impact.'
  const CD_PENDING_STEP2_PARTIAL =
    'Set a date of leaving for every selected employee to update this estimate.'

  const handleSubmit = () => {
    const details = selectedEmployees.map(emp => ({
      name: emp.name,
      id: emp.id,
      dateOfLeaving: dates[emp.id],
    }))
    addEntry({
      action: 'Delete Employee',
      count: selectedEmployees.length,
      status: 'Success',
      type: 'quick',
      details,
      changeSummary: {
        title: 'Employees removed from policy',
        lines: selectedEmployees.map((emp) => `${emp.name} (${emp.id})`),
      },
    })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Employees Deleted</h2>
          <p className="text-sm text-gray-500">{selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} removed. Redirecting...</p>
        </div>
      </div>
    )
  }

  /* ─── STEP 3: REVIEW & CONFIRM ─── */
  if (step === 3) {
    return (
      <div className="h-full flex flex-col min-h-0 px-6 lg:px-8 pt-4 pb-0">
        <PageHeader
          title="Quick Delete"
          subtitle="Review all details before confirming"
          breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
          trailing={<Stepper steps={STEPS} currentStep={3} compact />}
          onBack={() => { setStep(2); setErrors({}) }}
          backLabel="Back"
        />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 min-h-0 flex flex-col order-1 lg:min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pb-2">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Leaving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{emp.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(dates[emp.id])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Confirm Deletion</p>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                      This will remove {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} and all associated dependents from the group policy. This cannot be undone.
                    </p>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="accent-red-600 w-4 h-4" />
                      <span className="text-sm text-red-800">I confirm this deletion</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className={`${CD_RAIL_WIDTH_CLASS} shrink-0 order-2 lg:min-h-0 flex flex-col lg:justify-start`} aria-label="CD balance estimate">
            <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto overscroll-contain pb-2">
              <CdBalanceFormWidget
                cdAfterSubmit={deleteCdState.cdAfterSubmit}
                currentCd={deleteCdState.currentCd}
                estimatedCdDraw={deleteCdState.estimatedCdDraw}
                lines={deleteCdState.cdBreakdownLines}
                primaryBatchCount={selectedEmployees.length}
                estimateReady
                creditMode
              />
            </div>
          </aside>
        </div>

        <QuickAddBatchStickyFooter
          batchSummary={quickDeleteReviewBatchSummary}
          actions={
            <>
              <button
                type="button"
                onClick={() => { setStep(2); setErrors({}) }}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-2 sm:order-2"
              >
                <Pencil size={18} strokeWidth={2.25} aria-hidden /> Back
              </button>
              <button
                type="button"
                disabled={!confirmed}
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/15 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-1 sm:order-3"
              >
                <Trash2 size={18} strokeWidth={2.25} aria-hidden /> Delete {selectedEmployees.length} Employee{selectedEmployees.length > 1 ? 's' : ''}
              </button>
            </>
          }
        />
      </div>
    )
  }

  /* ─── STEP 2: DATE OF LEAVING ─── */
  if (step === 2) {
    return (
      <div className="h-full flex flex-col min-h-0 px-6 lg:px-8 pt-4 pb-0">
        <div className="flex-shrink-0">
          <PageHeader
            title="Quick Delete"
            subtitle={`Assign date of leaving for ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}`}
            breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
            trailing={<Stepper steps={STEPS} currentStep={2} compact />}
            onBack={() => { setStep(1); setErrors({}) }}
            backLabel="Back"
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 min-h-0 flex flex-col order-1 lg:min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2">
              {errors.date && (
                <div className="mb-3">
                  <p className="text-xs text-red-500">{errors.date}</p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[32%]">Employee</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[18%]">ID</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[50%]">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={applyDateAll}
                              onChange={e => {
                                setApplyDateAll(e.target.checked)
                                if (e.target.checked && globalDate) {
                                  const applied = { ...dates }
                                  selectedEmployees.forEach(emp => { applied[emp.id] = globalDate })
                                  setDates(applied)
                                  setErrors(prev => ({ ...prev, date: undefined }))
                                }
                              }}
                              className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                              title="Apply date to all rows"
                            />
                            <span>Date of Leaving <span className="text-red-400">*</span></span>
                          </div>
                        </th>
                      </tr>
                      {applyDateAll && (
                        <tr className="bg-indigo-50/60 border-b border-indigo-200">
                          <td colSpan={2} className="px-4 py-2">
                            <span className="text-xs font-semibold text-indigo-700 inline-flex items-center gap-1.5">
                              <CalendarClock size={13} /> Apply to all {selectedEmployees.length} employees
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={globalDate}
                              onChange={e => {
                                setGlobalDate(e.target.value)
                                if (e.target.value) {
                                  const applied = { ...dates }
                                  selectedEmployees.forEach(emp => { applied[emp.id] = e.target.value })
                                  setDates(applied)
                                  setErrors(prev => ({ ...prev, date: undefined }))
                                }
                              }}
                              className="w-full px-2.5 py-1.5 text-sm border border-indigo-300 rounded-lg bg-white font-medium text-indigo-900"
                            />
                          </td>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{emp.id}</td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={dates[emp.id] || ''}
                              onChange={e => { setDates(prev => ({ ...prev, [emp.id]: e.target.value })); setErrors(prev => ({ ...prev, date: undefined })) }}
                              className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white transition-colors ${!dates[emp.id] && errors.date ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <aside className={`${CD_RAIL_WIDTH_CLASS} shrink-0 order-2 lg:min-h-0 flex flex-col lg:justify-start`} aria-label="CD balance estimate">
            <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto overscroll-contain pb-2">
              <CdBalanceFormWidget
                cdAfterSubmit={deleteCdState.cdAfterSubmit}
                currentCd={deleteCdState.currentCd}
                estimatedCdDraw={deleteCdState.estimatedCdDraw}
                lines={deleteCdState.cdBreakdownLines}
                primaryBatchCount={selectedEmployees.length}
                estimateReady={allDatesSet}
                estimatePendingHint={!allDatesSet ? CD_PENDING_STEP2_PARTIAL : undefined}
                creditMode
              />
            </div>
          </aside>
        </div>

        <QuickAddBatchStickyFooter
          batchSummary={datesStepBatchSummary}
          actions={
            <>
              <button
                type="button"
                onClick={() => { setStep(1); setErrors({}) }}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-2 sm:order-2"
              >
                <Pencil size={18} strokeWidth={2.25} aria-hidden /> Back
              </button>
              <button
                type="button"
                onClick={goToStep3}
                disabled={!allDatesSet}
                title={!allDatesSet ? 'Set date of leaving for every employee first' : undefined}
                className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-1 sm:order-3 ${
                  allDatesSet
                    ? 'text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/15'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed shadow-none'
                }`}
              >
                Review &amp; Confirm
              </button>
            </>
          }
        />
      </div>
    )
  }

  /* ─── STEP 1: SELECT EMPLOYEES ─── */
  return (
    <div className="h-full flex flex-col min-h-0 px-6 lg:px-8 pt-4 pb-0">
      <div className="flex-shrink-0">
        <PageHeader
          title="Quick Delete"
          subtitle="Select employees to remove from the group policy"
          breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
          trailing={<Stepper steps={STEPS} currentStep={1} compact />}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col order-1 lg:min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Filter by name, ID, or email..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white"
            />
          </div>
            {selectedIds.size > 0 && (
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                {selectedIds.size} selected
              </span>
            )}
          </div>

        {/* Selected employees — directly under search */}
        <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden mb-4">
          <button type="button" onClick={() => setSelectionPanelOpen(p => !p)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-700">{selectedIds.size}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">Selected Employees</span>
            </div>
            {selectionPanelOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {selectionPanelOpen && (
            <div className="border-t border-indigo-100 px-5 py-3">
              {selectedIds.size === 0 ? (
                <p className="text-sm text-gray-500">No employees selected yet. Use the table below to add selections.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployees.map(emp => (
                      <span key={emp.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full">
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-indigo-400 text-xs">{emp.id}</span>
                        <button type="button" onClick={() => toggleOne(emp.id)} className="ml-0.5 p-0.5 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"><X size={13} /></button>
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSelectedIds(new Set())} className="mt-2.5 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer">Clear all</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Tip */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Quick Tip:</span> Select multiple employees at once using checkboxes, or use the &quot;Select All&quot; button to select all visible employees. You can customize individual deletion details in the next step.
          </p>
        </div>

        {errors.selection && (
          <div className="mb-3">
            <p className="text-xs text-red-500">{errors.selection}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 px-4 py-2.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Joining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(emp => {
                  const isSelected = selectedIds.has(emp.id)
                  return (
                    <tr key={emp.id} onClick={() => toggleOne(emp.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}>
                      <td className="w-12 px-4 py-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleOne(emp.id)} onClick={e => e.stopPropagation()} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{emp.name}</p><p className="text-xs text-gray-500">{emp.email}</p></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(emp.doj)}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No employees match your search</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        </div>

        <aside className={`${CD_RAIL_WIDTH_CLASS} shrink-0 order-2 lg:min-h-0 flex flex-col lg:justify-start`} aria-label="CD balance estimate">
          <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto overscroll-contain pb-2">
            <CdBalanceFormWidget
              cdAfterSubmit={deleteCdState.cdAfterSubmit}
              currentCd={deleteCdState.currentCd}
              estimatedCdDraw={deleteCdState.estimatedCdDraw}
              lines={deleteCdState.cdBreakdownLines}
              primaryBatchCount={selectedEmployees.length}
              estimateReady={false}
              estimatePendingHint={CD_PENDING_STEP1}
              creditMode
            />
          </div>
        </aside>
      </div>

      <QuickAddBatchStickyFooter
        batchSummary={selectionStepBatchSummary}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/delete')}
              className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-2 sm:order-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={goToStep2}
              disabled={selectedIds.size === 0}
              title={selectedIds.size === 0 ? 'Select at least one employee' : undefined}
              className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-1 sm:order-3 ${
                selectedIds.size > 0
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed shadow-none'
              }`}
            >
              <CalendarClock size={18} strokeWidth={2.25} aria-hidden />
              Proceed to select dates
            </button>
          </>
        }
      />
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
