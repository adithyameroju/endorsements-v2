import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle, AlertTriangle, ChevronLeft, Trash2, CalendarClock, Check, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

const STEPS = ['Select Employees', 'Date & Reason', 'Review & Confirm']

const leavingReasons = [
  'Resignation',
  'Termination',
  'End of contract',
  'Retirement',
  'Mutual separation',
  'Other',
]

export default function QuickDelete() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()

  const [step, setStep] = useState(1)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectionPanelOpen, setSelectionPanelOpen] = useState(true)

  const [globalDate, setGlobalDate] = useState('')
  const [dates, setDates] = useState({})
  const [globalReason, setGlobalReason] = useState('')
  const [reasons, setReasons] = useState({})
  const [applyDateAll, setApplyDateAll] = useState(false)
  const [applyReasonAll, setApplyReasonAll] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    if (!query.trim()) return mockEmployees
    const q = query.toLowerCase()
    return mockEmployees.filter(
      emp => emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q)
    )
  }, [query])

  const selectedEmployees = mockEmployees.filter(e => selectedIds.has(e.id))
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))

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
    const missingReason = selectedEmployees.some(emp => !reasons[emp.id])
    if (missingDate || missingReason) {
      setErrors({
        ...(missingDate ? { date: 'Please set a date of leaving for every employee' } : {}),
        ...(missingReason ? { reason: 'Please set a reason for every employee' } : {}),
      })
      return
    }
    setErrors({})
    setStep(3)
  }

  const handleSubmit = () => {
    const details = selectedEmployees.map(emp => ({
      name: emp.name,
      id: emp.id,
      department: emp.department,
      designation: emp.designation,
      reason: reasons[emp.id],
      dateOfLeaving: dates[emp.id],
    }))
    addEntry({ action: 'Delete Employee', count: selectedEmployees.length, status: 'Success', type: 'quick', details })
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
      <div className="flex flex-col h-full px-6 lg:px-8 py-6">
        <div className="flex-shrink-0">
          <PageHeader
            title="Quick Delete"
            subtitle="Review all details before confirming"
            breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
          />
          <Stepper steps={STEPS} currentStep={3} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <button onClick={() => { setStep(2); setErrors({}) }} className="mb-5 inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
            <ChevronLeft size={16} /> Back to Date & Reason
          </button>

          {/* Summary table (read-only) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Leaving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{reasons[emp.id]}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(dates[emp.id])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirmation */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
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

          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Back</button>
            <button
              disabled={!confirmed}
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={15} /> Delete {selectedEmployees.length} Employee{selectedEmployees.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ─── STEP 2: DATE & REASON ─── */
  if (step === 2) {
    return (
      <div className="flex flex-col h-full px-6 lg:px-8 py-6">
        <div className="flex-shrink-0">
          <PageHeader
            title="Quick Delete"
            subtitle={`Assign date of leaving and reason for ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}`}
            breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
          />
          <Stepper steps={STEPS} currentStep={2} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <button onClick={() => { setStep(1); setErrors({}) }} className="mb-5 inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
            <ChevronLeft size={16} /> Back to selection
          </button>

          {(errors.date || errors.reason) && (
            <div className="flex flex-wrap gap-3 mb-3">
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
              {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
            </div>
          )}

          {/* Editable table with Excel-style global apply checkboxes in header */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Employee</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">ID</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Department</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={applyReasonAll}
                          onChange={e => {
                            setApplyReasonAll(e.target.checked)
                            if (e.target.checked && globalReason) {
                              const applied = { ...reasons }
                              selectedEmployees.forEach(emp => { applied[emp.id] = globalReason })
                              setReasons(applied)
                              setErrors(prev => ({ ...prev, reason: undefined }))
                            }
                          }}
                          className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                          title="Apply reason to all rows"
                        />
                        <span>Reason <span className="text-red-400">*</span></span>
                      </div>
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">
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
                  {/* Global apply row when header checkbox is checked */}
                  {(applyReasonAll || applyDateAll) && (
                    <tr className="bg-indigo-50/60 border-b border-indigo-200">
                      <td colSpan={3} className="px-4 py-2">
                        <span className="text-xs font-semibold text-indigo-700 inline-flex items-center gap-1.5">
                          <CalendarClock size={13} /> Apply to all {selectedEmployees.length} employees
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {applyReasonAll && (
                          <select
                            value={globalReason}
                            onChange={e => {
                              setGlobalReason(e.target.value)
                              if (e.target.value) {
                                const applied = { ...reasons }
                                selectedEmployees.forEach(emp => { applied[emp.id] = e.target.value })
                                setReasons(applied)
                                setErrors(prev => ({ ...prev, reason: undefined }))
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-sm border border-indigo-300 rounded-lg bg-white font-medium text-indigo-900"
                          >
                            <option value="">Select reason for all</option>
                            {leavingReasons.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {applyDateAll && (
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
                        )}
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-4 py-2">
                        <select
                          value={reasons[emp.id] || ''}
                          onChange={e => { setReasons(prev => ({ ...prev, [emp.id]: e.target.value })); setErrors(prev => ({ ...prev, reason: undefined })) }}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white transition-colors ${!reasons[emp.id] && errors.reason ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'}`}
                        >
                          <option value="">Select</option>
                          {leavingReasons.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
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

          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Back</button>
            <button onClick={goToStep3} className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-2 cursor-pointer">
              Review & Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ─── STEP 1: SELECT EMPLOYEES ─── */
  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-6">
      <div className="flex-shrink-0">
        <PageHeader
          title="Quick Delete"
          subtitle="Select employees to remove from the group policy"
          breadcrumbs={[{ label: 'Delete Employee', path: '/delete' }, { label: 'Quick Delete' }]}
        />
        <Stepper steps={STEPS} currentStep={1} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Filter by name, ID, or department..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white"
            />
          </div>
          {selectedIds.size > 0 && (
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        {/* Quick Tip */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Quick Tip:</span> Select multiple employees at once using checkboxes, or use the "Select All" button to select all visible employees. You can customize individual deletion details in the next step.
          </p>
        </div>

        {errors.selection && <p className="text-xs text-red-500 mb-3 -mt-2">{errors.selection}</p>}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 px-4 py-2.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
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
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(emp.doj)}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No employees match your search</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected items panel */}
        {selectedIds.size > 0 && (
          <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden mb-4">
            <button onClick={() => setSelectionPanelOpen(p => !p)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-indigo-700">{selectedIds.size}</span></div>
                <span className="text-sm font-semibold text-gray-900">Selected Employees</span>
              </div>
              {selectionPanelOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {selectionPanelOpen && (
              <div className="border-t border-indigo-100 px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  {selectedEmployees.map(emp => (
                    <span key={emp.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full">
                      <span className="font-medium">{emp.name}</span>
                      <span className="text-indigo-400 text-xs">{emp.id}</span>
                      <button onClick={() => toggleOne(emp.id)} className="ml-0.5 p-0.5 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"><X size={13} /></button>
                    </span>
                  ))}
                </div>
                <button onClick={() => setSelectedIds(new Set())} className="mt-2.5 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer">Clear all</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-500">{selectedIds.size > 0 ? `${selectedIds.size} employee${selectedIds.size > 1 ? 's' : ''} selected` : 'No employees selected'}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/delete')} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={goToStep2} className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-2 cursor-pointer">
            Next: Date & Reason
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
