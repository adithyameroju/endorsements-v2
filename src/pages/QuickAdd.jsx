import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronLeft, Eye, CheckCircle, User, Trash2, ChevronUp, AlertCircle, Heart, Users, Sparkles, X, Shield, Wallet, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { departments, designations, basePlans, gpaBasePlans } from '../data/mockData'
import { cloneEmployeeGmcPlans } from '../lib/planHelpers'
import { formatInr, formatInrSigned } from '../lib/currencyFormat'
import { useEndorsements } from '../store/EndorsementStore'
import PremiumEstimateLivePanel from '../components/PremiumEstimateLivePanel'

const emptyEmployee = () => ({
  id: Date.now(),
  name: '', empId: '', email: '', dob: '', designation: '',
  gender: '', department: '', doj: '', mobile: '',
  plans: {},
  dependents: [],
})

const requiredFields = ['name', 'empId', 'email', 'dob', 'designation', 'gender', 'department', 'doj', 'mobile']

function validate(emp) {
  const errors = {}
  if (!emp.name.trim()) errors.name = 'Name is required'
  if (!emp.empId.trim()) errors.empId = 'Employee ID is required'
  if (!emp.email.trim()) errors.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(emp.email)) errors.email = 'Invalid email format'
  if (!emp.dob) errors.dob = 'Date of birth is required'
  if (!emp.designation) errors.designation = 'Designation is required'
  if (!emp.gender) errors.gender = 'Gender is required'
  if (!emp.department) errors.department = 'Department is required'
  if (!emp.doj) errors.doj = 'Date of joining is required'
  if (!emp.mobile.trim()) errors.mobile = 'Mobile is required'
  else if (!/^\d{10}$/.test(emp.mobile)) errors.mobile = 'Must be 10 digits'
  return errors
}

function isFilled(emp) {
  return emp.name.trim() && emp.empId.trim() && emp.email.trim()
}

function isBasicComplete(emp) {
  return requiredFields.every(f => emp[f] && String(emp[f]).trim())
}

function hasPlans(emp) {
  return emp.plans && (emp.plans.gmcBasePlan || emp.plans.gpaBasePlan)
}

function fieldCount(emp) {
  return requiredFields.filter(f => emp[f] && String(emp[f]).trim()).length
}

/** Replace with API / context in production */
const MOCK_CD_AVAILABLE_RUPEES = 48_50_000
/** Illustrative policy context for Premium Estimate header */
const MOCK_POLICY_DAYS_LEFT = 9

const CD_DISPLAY_MODE_STORAGE_KEY = 'quickAdd_cdDisplayMode'
const CD_LIVE_PANEL_OPEN_KEY = 'quickAdd_cdLivePanelOpen'

function readStoredCdDisplayMode() {
  try {
    const v = sessionStorage.getItem(CD_DISPLAY_MODE_STORAGE_KEY)
    if (v === 'side_panel' || v === 'bottom_strip') return v
  } catch {
    /* private mode / unavailable */
  }
  return 'bottom_strip'
}

function readStoredCdLivePanelOpen() {
  try {
    return sessionStorage.getItem(CD_LIVE_PANEL_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

const CD_EST_PRIMARY_COMPLETE_RUPEES = 42_000
const CD_EST_PRIMARY_PARTIAL_RUPEES = 18_000
const CD_EST_PER_DEPENDENT_RUPEES = 14_000
const CD_EST_SECONDARY_BUMP_RUPEES = 6_000

/**
 * Single pass: totals must match prior estimateCdDrawRupees behavior.
 * @returns {{ total: number, lines: { id: string, label: string, amount: number }[] }}
 */
function estimateCdDrawBreakdown(employees) {
  let primaryTotal = 0
  let dependentLives = 0
  let dependentTotal = 0
  let secondaryTotal = 0

  for (const emp of employees) {
    if (isBasicComplete(emp)) {
      primaryTotal += CD_EST_PRIMARY_COMPLETE_RUPEES
    } else if (isFilled(emp)) {
      primaryTotal += CD_EST_PRIMARY_PARTIAL_RUPEES
    }
    const dc = emp.dependents?.length || 0
    dependentLives += dc
    dependentTotal += dc * CD_EST_PER_DEPENDENT_RUPEES
    if (emp.plans?.gmcSecondaryPlan && emp.plans.gmcSecondaryPlan !== 'none') {
      secondaryTotal += CD_EST_SECONDARY_BUMP_RUPEES
    }
  }

  const total = primaryTotal + dependentTotal + secondaryTotal

  const lines = []
  if (primaryTotal > 0) {
    lines.push({ id: 'primary', label: 'Primary (employees)', amount: primaryTotal })
  }
  if (dependentTotal > 0) {
    lines.push({
      id: 'dependents',
      label: `Dependents (${dependentLives} ${dependentLives === 1 ? 'life' : 'lives'})`,
      amount: dependentTotal,
    })
  }
  if (secondaryTotal > 0) {
    lines.push({ id: 'secondary', label: 'Secondary GMC', amount: secondaryTotal })
  }
  lines.push({ id: 'total', label: 'Est. total (batch)', amount: total })

  return { total, lines }
}

function CdBreakdownPopoverBody({ lines }) {
  const detailLines = lines.filter((l) => l.id !== 'total')
  const totalLine = lines.find((l) => l.id === 'total')
  return (
    <>
      <p className="text-[11px] font-semibold text-gray-800 border-b border-gray-100 pb-2 mb-2">Premium estimate (est.)</p>
      {detailLines.length > 0 ? (
        <ul className="space-y-1.5">
          {detailLines.map((l) => (
            <li key={l.id} className="flex justify-between gap-4 text-[11px] text-gray-600">
              <span>{l.label}</span>
              <span className="tabular-nums font-medium text-gray-900">{formatInr(l.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-gray-500">No line items yet — add employees or dependents to see breakdown.</p>
      )}
      {totalLine && (
        <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-gray-100 text-xs font-semibold text-gray-900">
          <span>{totalLine.label}</span>
          <span className="tabular-nums text-indigo-700">{formatInr(totalLine.amount)}</span>
        </div>
      )}
    </>
  )
}

export default function QuickAdd() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [employees, setEmployees] = useState([emptyEmployee()])
  const [expandedId, setExpandedId] = useState(employees[0].id)
  const [showPreview, setShowPreview] = useState(false)
  const [touchedMap, setTouchedMap] = useState({})
  const [uiVariation, setUiVariation] = useState('variation2')
  const [activeTab, setActiveTab] = useState(0)
  const [cdDisplayMode, setCdDisplayMode] = useState(readStoredCdDisplayMode)
  const [isLgViewport, setIsLgViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [cdLivePanelOpen, setCdLivePanelOpen] = useState(readStoredCdLivePanelOpen)
  const [cdBreakdownOpen, setCdBreakdownOpen] = useState(false)
  const [cdPreviewBreakdownOpen, setCdPreviewBreakdownOpen] = useState(false)
  const cdPopoverRef = useRef(null)
  const cdPreviewPopoverRef = useRef(null)
  const bottomCdSectionRef = useRef(null)

  const { estimatedCdDraw, cdAfterSubmit, cdBreakdownLines } = useMemo(() => {
    const { total, lines } = estimateCdDrawBreakdown(employees)
    return {
      estimatedCdDraw: total,
      cdAfterSubmit: MOCK_CD_AVAILABLE_RUPEES - total,
      cdBreakdownLines: lines,
    }
  }, [employees])

  const showSidePanel = cdDisplayMode === 'side_panel' && isLgViewport
  const showBottomCd = cdDisplayMode === 'bottom_strip' || (cdDisplayMode === 'side_panel' && !isLgViewport)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsLgViewport(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleCdDisplayModeChange = (value) => {
    setCdDisplayMode(value)
    if (value === 'side_panel') {
      setCdBreakdownOpen(false)
      setCdLivePanelOpen(false)
      try {
        sessionStorage.setItem(CD_LIVE_PANEL_OPEN_KEY, '0')
      } catch {
        /* ignore */
      }
    }
    try {
      sessionStorage.setItem(CD_DISPLAY_MODE_STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }

  const persistCdLivePanelOpen = (open) => {
    setCdLivePanelOpen(open)
    try {
      sessionStorage.setItem(CD_LIVE_PANEL_OPEN_KEY, open ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!cdBreakdownOpen && !cdPreviewBreakdownOpen) return
    const onPointerDown = (e) => {
      const t = e.target
      if (cdPopoverRef.current?.contains(t)) return
      if (cdPreviewPopoverRef.current?.contains(t)) return
      setCdBreakdownOpen(false)
      setCdPreviewBreakdownOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [cdBreakdownOpen, cdPreviewBreakdownOpen])

  const handleCdToolbarCtaClick = () => {
    if (showBottomCd) {
      setCdBreakdownOpen(true)
      bottomCdSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    persistCdLivePanelOpen(!cdLivePanelOpen)
  }

  const cdToolbarCtaTitle = !showBottomCd
    ? cdLivePanelOpen
      ? 'Hide CD balance panel'
      : 'Show CD balance panel'
    : 'View CD balance in footer'

  const renderCdToolbarCta = () => (
    <button
      type="button"
      onClick={handleCdToolbarCtaClick}
      title={cdToolbarCtaTitle}
      className="inline-flex items-center gap-1.5 max-w-[11rem] sm:max-w-[13rem] pl-2 pr-2 py-2 rounded-lg border border-emerald-200/90 bg-emerald-50/80 hover:bg-emerald-50 transition-colors cursor-pointer text-left min-w-0 flex-shrink-0"
      aria-label={cdToolbarCtaTitle}
      aria-expanded={!showBottomCd ? cdLivePanelOpen : undefined}
    >
      <Wallet size={14} className="text-emerald-700 flex-shrink-0" aria-hidden />
      <span className="min-w-0 flex flex-col items-start leading-tight">
        <span className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wide">CD</span>
        <span
          className="text-xs font-bold text-indigo-700 tabular-nums truncate w-full"
          title={formatInrSigned(cdAfterSubmit)}
        >
          {formatInrSigned(cdAfterSubmit)}
        </span>
      </span>
      {cdAfterSubmit < 0 ? (
        <AlertCircle size={14} className="text-red-600 flex-shrink-0" aria-hidden />
      ) : (
        <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" aria-hidden />
      )}
      {!showBottomCd && (
        <ChevronDown
          size={16}
          className={`text-emerald-800 flex-shrink-0 transition-transform duration-200 ${cdLivePanelOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      )}
    </button>
  )

  const updateEmployee = (index, field, value) => {
    const updated = [...employees]
    updated[index] = { ...updated[index], [field]: value }
    setEmployees(updated)
    setTouchedMap(prev => ({
      ...prev,
      [updated[index].id]: { ...(prev[updated[index].id] || {}), [field]: true }
    }))
  }

  const updateEmployeePlans = (index, plans) => {
    const updated = [...employees]
    updated[index] = { ...updated[index], plans }
    const cloned = cloneEmployeeGmcPlans(plans)
    updated[index].dependents = updated[index].dependents.map((d) => {
      if (d.samePlansAsEmployee !== false && plans?.gmcBasePlan) {
        return { ...d, plans: { ...cloned } }
      }
      return d
    })
    setEmployees(updated)
  }

  const updateEmployeeDeps = (index, dependents) => {
    const updated = [...employees]
    updated[index] = { ...updated[index], dependents }
    setEmployees(updated)
  }

  const addEmployee = () => {
    if (employees.length >= 5) return
    const newEmp = emptyEmployee()
    setEmployees(prev => [...prev, newEmp])
    setExpandedId(newEmp.id)
  }

  const removeEmployee = (index) => {
    if (employees.length <= 1) return
    const removed = employees[index]
    const updated = employees.filter((_, i) => i !== index)
    setEmployees(updated)
    if (expandedId === removed.id) {
      setExpandedId(updated[Math.min(index, updated.length - 1)].id)
    }
  }

  const toggleAccordion = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const markDoneAndNext = (currentIdx) => {
    const emp = employees[currentIdx]
    if (!isBasicComplete(emp)) return
    setExpandedId(null)
    const nextIncomplete = employees.findIndex((e, i) => i !== currentIdx && !isBasicComplete(e))
    if (nextIncomplete !== -1) {
      setTimeout(() => setExpandedId(employees[nextIncomplete].id), 200)
    }
  }

  const handlePreview = () => {
    let hasErrors = false
    for (const emp of employees) {
      const errors = validate(emp)
      if (Object.keys(errors).length > 0) {
        hasErrors = true
        setExpandedId(emp.id)
        const allTouched = {}
        requiredFields.forEach(f => allTouched[f] = true)
        setTouchedMap(prev => ({ ...prev, [emp.id]: allTouched }))
        break
      }
    }
    if (!hasErrors) setShowPreview(true)
  }

  const prefillData = () => {
    const dummyEmployees = [
      {
        id: Date.now(),
        name: 'Rajesh Kumar',
        empId: 'EMP101',
        email: 'rajesh.k@acko.com',
        dob: '1990-05-15',
        designation: 'Software Engineer',
        gender: 'Male',
        department: 'Engineering',
        doj: '2026-03-20',
        mobile: '9876543210',
        plans: {
          gmcBasePlan: 'bp2',
          gmcSecondaryPlan: 'sp1',
          gmcAddons: ['ap1'],
          gpaBasePlan: 'gpa-bp1',
          gpaSiType: 'fixed'
        },
        dependents: [
          {
            id: Date.now() + 1,
            name: 'Priya Kumar',
            relation: 'Spouse',
            dob: '1992-08-20',
            gender: 'Female',
            samePlansAsEmployee: true,
            plans: {}
          }
        ]
      },
      {
        id: Date.now() + 100,
        name: 'Anita Sharma',
        empId: 'EMP102',
        email: 'anita.s@acko.com',
        dob: '1988-12-03',
        designation: 'Product Manager',
        gender: 'Female',
        department: 'Product',
        doj: '2026-03-25',
        mobile: '9876543211',
        plans: {
          gmcBasePlan: 'bp3',
          gpaBasePlan: 'gpa-bp2',
          gpaSiType: 'ctc',
          gpaCtc: '1200000'
        },
        dependents: [
          {
            id: Date.now() + 2,
            name: 'Arjun Sharma',
            relation: 'Son',
            dob: '2015-03-10',
            gender: 'Male',
            samePlansAsEmployee: false,
            plans: { gmcBasePlan: 'bp1' }
          }
        ]
      }
    ]
    setEmployees(dummyEmployees)
    setExpandedId(dummyEmployees[0].id)
    setActiveTab(0)
  }

  const handleSubmit = () => {
    const details = employees.map(emp => ({
      name: emp.name,
      id: emp.empId,
      department: emp.department,
      designation: emp.designation,
    }))
    addEntry({ action: 'Add Employee', count: employees.length, status: 'Success', type: 'quick', details })
    navigate('/')
  }

  const renderAccordionView = () => (
    <div className="space-y-3">
      {employees.map((emp, idx) => {
        const isOpen = expandedId === emp.id
        const errors = validate(emp)
        const touched = touchedMap[emp.id] || {}
        const filled = isFilled(emp)
        const basicDone = isBasicComplete(emp)
        const plansDone = hasPlans(emp)
        const depsCount = emp.dependents.length
        const completed = fieldCount(emp)
        const showError = (field) => touched[field] && errors[field]
        const hasAnyError = Object.keys(touched).length > 0 && Object.keys(errors).length > 0

        return (
          <div key={emp.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : basicDone ? 'border-emerald-200' : hasAnyError ? 'border-red-200' : 'border-gray-200 hover:border-gray-300'}`}>
            {/* Accordion header */}
            <button
              onClick={() => toggleAccordion(emp.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                basicDone ? 'bg-emerald-100' : hasAnyError ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {basicDone ? (
                  <CheckCircle size={20} className="text-emerald-600" />
                ) : hasAnyError ? (
                  <AlertCircle size={20} className="text-red-500" />
                ) : (
                  <span className="text-sm font-bold text-gray-400">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${basicDone ? 'text-gray-900' : 'text-gray-700'}`}>
                    {emp.name || `Employee ${idx + 1}`}
                  </p>
                  {!isOpen && filled && (
                    <span className="text-xs text-gray-400 truncate hidden sm:inline">
                      {emp.empId} &middot; {emp.department || 'No dept'}
                    </span>
                  )}
                </div>
                {/* Section status pills (collapsed) */}
                {!isOpen && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <SectionPill label="Basic Info" done={basicDone} count={`${completed}/${requiredFields.length}`} />
                    <SectionPill label="Plans" done={plansDone} />
                    <SectionPill label="Dependents" done={depsCount > 0} count={depsCount > 0 ? depsCount : null} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {employees.length > 1 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeEmployee(idx) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeEmployee(idx) } }}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </div>
                )}
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${basicDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {basicDone ? <CheckCircle size={14} /> : '1'}
                      </div>
                      Basic Information
                    </h3>
                    {basicDone && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Complete</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
                    <FormField label="Full Name" required value={emp.name} onChange={v => updateEmployee(idx, 'name', v)} placeholder="e.g. Rahul Sharma" error={showError('name')} />
                    <FormField label="Employee ID" required value={emp.empId} onChange={v => updateEmployee(idx, 'empId', v)} placeholder="e.g. EMP001" error={showError('empId')} />
                    <FormField label="Email" type="email" required value={emp.email} onChange={v => updateEmployee(idx, 'email', v)} placeholder="e.g. rahul@acko.com" error={showError('email')} />
                    <FormField label="Date of Birth" type="date" required value={emp.dob} onChange={v => updateEmployee(idx, 'dob', v)} error={showError('dob')} />
                    <SelectField label="Designation" required value={emp.designation} onChange={v => updateEmployee(idx, 'designation', v)} options={designations} placeholder="Select designation" error={showError('designation')} />
                    <SelectField label="Gender" required value={emp.gender} onChange={v => updateEmployee(idx, 'gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select gender" error={showError('gender')} />
                    <SelectField label="Department" required value={emp.department} onChange={v => updateEmployee(idx, 'department', v)} options={departments} placeholder="Select department" error={showError('department')} />
                    <FormField label="Date of Joining" type="date" required value={emp.doj} onChange={v => updateEmployee(idx, 'doj', v)} error={showError('doj')} />
                    <FormField label="Mobile Number" type="tel" required value={emp.mobile} onChange={v => updateEmployee(idx, 'mobile', v)} placeholder="e.g. 9876543210" error={showError('mobile')} />
                  </div>
                </section>
                <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${plansDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {plansDone ? <CheckCircle size={14} /> : '2'}
                      </div>
                      Insurance Plans
                    </h3>
                    {plansDone && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Configured</span>}
                  </div>
                  <PlanSelection plans={emp.plans} onChange={(plans) => updateEmployeePlans(idx, plans)} label={`emp-${idx}`} />
                </section>
                <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {depsCount > 0 ? <CheckCircle size={14} /> : <User size={14} />}
                      </div>
                      Dependents
                    </h3>
                    {depsCount > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{depsCount} added</span>}
                  </div>
                  <DependentForm
                    dependents={emp.dependents}
                    onChange={(deps) => updateEmployeeDeps(idx, deps)}
                    employeePlans={emp.plans}
                    hideSectionTitle
                  />
                </section>

                {/* Done action */}
                {basicDone && employees.length < 5 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Employee details complete. Collapse and add next?</p>
                    <button
                      onClick={() => markDoneAndNext(idx)}
                      className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Done, continue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add another employee CTA */}
      {employees.length < 5 && (
        <button
          onClick={addEmployee}
          className="w-full flex items-center justify-center gap-2.5 py-5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Plus size={16} className="group-hover:text-indigo-600" />
          </div>
          Add another employee ({employees.length}/5)
        </button>
      )}
    </div>
  )

  /** Tab strip only — stays fixed; form scrolls below. */
  const renderTabStrip = () => (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit max-w-full flex-wrap">
      {employees.map((emp, idx) => {
        const basicDone = isBasicComplete(emp)
        const hasAnyError = Object.keys(validate(emp)).length > 0
        const isActive = activeTab === idx

        return (
          <div key={emp.id} className="relative">
            <button
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                basicDone ? 'bg-emerald-100 text-emerald-600' : hasAnyError ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-500'
              }`}>
                {basicDone ? <CheckCircle size={10} /> : hasAnyError ? <AlertCircle size={10} /> : idx + 1}
              </div>
              <span className="hidden sm:inline truncate max-w-20">
                {emp.name ? emp.name.split(' ')[0] : `Emp ${idx + 1}`}
              </span>
            </button>
            {employees.length > 1 && (
              <button
                type="button"
                onClick={() => { removeEmployee(idx); if (activeTab >= idx && activeTab > 0) setActiveTab(activeTab - 1) }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-100 hover:bg-red-200 text-red-500 rounded-full flex items-center justify-center text-xs"
              >
                <X size={8} />
              </button>
            )}
          </div>
        )
      })}
      {employees.length < 5 && (
        <button
          type="button"
          onClick={() => { addEmployee(); setActiveTab(employees.length) }}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-gray-200/50 rounded-md transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline text-xs">Add</span>
        </button>
      )}
    </div>
  )

  const renderTabFormCard = (embedded = false) => (
    <div
      className={
        embedded
          ? 'overflow-hidden'
          : 'bg-white border border-gray-200 rounded-xl overflow-hidden'
      }
    >
      {employees[activeTab] && (
        <div className={`space-y-4 ${embedded ? 'py-1' : 'p-6'}`}>
          {renderEmployeeForm(employees[activeTab], activeTab)}
        </div>
      )}
    </div>
  )

  const renderEmployeeForm = (emp, idx) => {
    const errors = validate(emp)
    const touched = touchedMap[emp.id] || {}
    const basicDone = isBasicComplete(emp)
    const plansDone = hasPlans(emp)
    const depsCount = emp.dependents.length
    const showError = (field) => touched[field] && errors[field]

    return (
      <>
        <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${basicDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {basicDone ? <CheckCircle size={14} /> : '1'}
              </div>
              Basic Information
            </h3>
            {basicDone && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Complete</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
            <FormField label="Full Name" required value={emp.name} onChange={v => updateEmployee(idx, 'name', v)} placeholder="e.g. Rahul Sharma" error={showError('name')} />
            <FormField label="Employee ID" required value={emp.empId} onChange={v => updateEmployee(idx, 'empId', v)} placeholder="e.g. EMP001" error={showError('empId')} />
            <FormField label="Email" type="email" required value={emp.email} onChange={v => updateEmployee(idx, 'email', v)} placeholder="e.g. rahul@acko.com" error={showError('email')} />
            <FormField label="Date of Birth" type="date" required value={emp.dob} onChange={v => updateEmployee(idx, 'dob', v)} error={showError('dob')} />
            <SelectField label="Designation" required value={emp.designation} onChange={v => updateEmployee(idx, 'designation', v)} options={designations} placeholder="Select designation" error={showError('designation')} />
            <SelectField label="Gender" required value={emp.gender} onChange={v => updateEmployee(idx, 'gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select gender" error={showError('gender')} />
            <SelectField label="Department" required value={emp.department} onChange={v => updateEmployee(idx, 'department', v)} options={departments} placeholder="Select department" error={showError('department')} />
            <FormField label="Date of Joining" type="date" required value={emp.doj} onChange={v => updateEmployee(idx, 'doj', v)} error={showError('doj')} />
            <FormField label="Mobile Number" type="tel" required value={emp.mobile} onChange={v => updateEmployee(idx, 'mobile', v)} placeholder="e.g. 9876543210" error={showError('mobile')} />
          </div>
        </section>
        <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${plansDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {plansDone ? <CheckCircle size={14} /> : '2'}
              </div>
              Insurance Plans
            </h3>
            {plansDone && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Configured</span>}
          </div>
          <PlanSelection plans={emp.plans} onChange={(plans) => updateEmployeePlans(idx, plans)} label={`emp-${idx}`} />
        </section>
        <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {depsCount > 0 ? <CheckCircle size={14} /> : <User size={14} />}
              </div>
              Dependents
            </h3>
            {depsCount > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{depsCount} added</span>}
          </div>
          <DependentForm
            dependents={emp.dependents}
            onChange={(deps) => updateEmployeeDeps(idx, deps)}
            employeePlans={emp.plans}
            hideSectionTitle
          />
        </section>
      </>
    )
  }

  if (showPreview) {
    return (
      <div className="h-full overflow-y-auto px-6 lg:px-8 py-4">
        <PageHeader
          title="Review & Submit"
          subtitle="Review all employee details before submitting"
          breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Quick Add', path: '/add/quick' }, { label: 'Preview' }]}
          trailing={<Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={2} compact />}
        />
        <button onClick={() => setShowPreview(false)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
          <ChevronLeft size={16} /> Back to editing
        </button>
        <div className="space-y-4">
          {employees.map((emp, idx) => (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center"><User size={18} className="text-indigo-600" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{emp.name || `Employee ${idx + 1}`}</h3>
                  <p className="text-xs text-gray-500">{emp.empId} &middot; {emp.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2.5 text-sm">
                <PF label="Email" value={emp.email} />
                <PF label="DOB" value={emp.dob} />
                <PF label="Gender" value={emp.gender} />
                <PF label="Designation" value={emp.designation} />
                <PF label="Department" value={emp.department} />
                <PF label="Joining" value={emp.doj} />
                <PF label="Mobile" value={emp.mobile} />
              </div>
              {(emp.plans?.gmcBasePlan || emp.plans?.gpaBasePlan) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Plans</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {emp.plans?.gmcBasePlan && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                        <Heart size={14} className="text-blue-600" />
                        <span className="text-gray-900">GMC: {basePlans.find(p => p.id === emp.plans.gmcBasePlan)?.name || emp.plans.gmcBasePlan}</span>
                      </span>
                    )}
                    {emp.plans?.gpaBasePlan && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
                        <Shield size={14} className="text-violet-600" />
                        <span className="text-gray-900">GPA: {gpaBasePlans.find(p => p.id === emp.plans.gpaBasePlan)?.name || emp.plans.gpaBasePlan}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
              {emp.dependents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> Dependents ({emp.dependents.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {emp.dependents.map((dep, di) => (
                      <div key={di} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-indigo-500">{getRelationIcon(dep.relation)}</span>
                        <span className="text-sm text-gray-900">{dep.name || '—'}</span>
                        <span className="text-xs text-gray-500">({dep.relation || '—'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          ref={cdPreviewPopoverRef}
          className="relative mt-5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 px-4 py-3"
        >
          {cdPreviewBreakdownOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <CdBreakdownPopoverBody lines={cdBreakdownLines} />
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">CD balance</span>
              <button
                type="button"
                onClick={() => setCdPreviewBreakdownOpen((o) => !o)}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-white/80 cursor-pointer"
              >
                <Info size={12} className="flex-shrink-0" aria-hidden /> Details
              </button>
            </div>
            {cdAfterSubmit < 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 flex-shrink-0">
                <AlertCircle size={14} aria-hidden /> Insufficient
              </span>
            ) : (
              <span className="flex-shrink-0" title="Sufficient CD for this batch (est.)">
                <CheckCircle size={14} className="text-emerald-600" aria-hidden />
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-indigo-700 tabular-nums mt-1">{formatInrSigned(cdAfterSubmit)}</p>
          <p className="text-[11px] text-gray-600 tabular-nums leading-snug mt-0.5">
            <span className="text-gray-500">Current</span> {formatInr(MOCK_CD_AVAILABLE_RUPEES)}
            <span className="text-gray-400"> · </span>
            <span className="text-red-600 font-medium">−Est. {formatInr(estimatedCdDraw)}</span>
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setShowPreview(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Edit</button>
          <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit Endorsement</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-4">
      <div className="flex-shrink-0 mb-3">
        <PageHeader
          title="Quick Add Employees"
          subtitle="Add up to 5 employees with plan and dependent details"
          breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Quick Add' }]}
          trailing={<Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={1} compact />}
          navTrailing={
            <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
              <select
                aria-label="Employee form layout"
                value={uiVariation}
                onChange={(e) => setUiVariation(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white font-medium max-w-[9rem]"
              >
                <option value="variation2">Tab View</option>
                <option value="variation1">Accordion View</option>
              </select>
              <select
                aria-label="CD summary placement"
                value={cdDisplayMode}
                onChange={(e) => handleCdDisplayModeChange(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white font-medium max-w-[10rem]"
              >
                <option value="bottom_strip">CD: Bottom bar</option>
                <option value="side_panel">CD: Live panel</option>
              </select>
              <button
                type="button"
                onClick={prefillData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
              >
                <Sparkles size={13} aria-hidden /> Prefill Data
              </button>
            </div>
          }
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col min-h-0">
        {showSidePanel ? (
          <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="flex flex-row items-start">
                <div
                  className={`flex-1 min-w-0 ${showSidePanel && cdLivePanelOpen ? 'border-r border-gray-100' : ''}`}
                >
                  {uiVariation === 'variation1' ? (
                    <>
                      <div className="sticky top-0 z-20 flex justify-end py-2.5 px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                        {renderCdToolbarCta()}
                      </div>
                      <div className="px-4 pb-8 pt-4">{renderAccordionView()}</div>
                    </>
                  ) : (
                    <>
                      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 py-2.5 px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                        <div className="min-w-0 flex-1 overflow-x-auto pb-0.5">{renderTabStrip()}</div>
                        {renderCdToolbarCta()}
                      </div>
                      <div className="px-4 pb-8 pt-4">{renderTabFormCard(true)}</div>
                    </>
                  )}
                </div>
                {showSidePanel && cdLivePanelOpen && (
                  <aside className="shrink-0 sticky top-0 self-start max-h-[calc(100vh-7.5rem)] w-[min(22rem,calc(100vw-28rem))] flex flex-col border-l border-gray-100 bg-gradient-to-b from-gray-50/90 to-white">
                    <div className="p-2 min-h-0 overflow-y-auto">
                      <PremiumEstimateLivePanel
                        lines={cdBreakdownLines}
                        totalPremium={estimatedCdDraw}
                        currentCd={MOCK_CD_AVAILABLE_RUPEES}
                        balanceAfter={cdAfterSubmit}
                        isSufficient={cdAfterSubmit >= 0}
                        policyDaysRemaining={MOCK_POLICY_DAYS_LEFT}
                        onCollapse={() => persistCdLivePanelOpen(false)}
                        collapseAriaLabel="Close CD balance panel"
                        collapseTitle="Close CD balance panel"
                      />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {uiVariation === 'variation1' ? (
              <>
                <div className="flex-shrink-0 flex justify-end py-2 -mx-6 lg:-mx-8 px-6 lg:px-8 border-b border-gray-200/90 bg-gray-50/80">
                  {renderCdToolbarCta()}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto pb-4 pt-3">{renderAccordionView()}</div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 flex items-center justify-between gap-3 py-2.5 -mt-1 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-gray-50 border-b border-gray-200/90 z-30">
                  <div className="min-w-0 flex-1 overflow-x-auto pb-0.5">{renderTabStrip()}</div>
                  {renderCdToolbarCta()}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto pb-4 pt-3">{renderTabFormCard()}</div>
              </>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom: optional CD + Preview */}
      <div
        className={`flex-shrink-0 sticky bottom-0 z-40 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] ${showBottomCd ? 'py-3.5' : 'py-2.5'}`}
      >
        <div
          className={`flex items-center ${showBottomCd ? 'flex-col gap-3 sm:flex-row sm:justify-between' : 'justify-end'}`}
        >
          {showBottomCd && (
            <div ref={bottomCdSectionRef} className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
              <div
                ref={cdPopoverRef}
                className="relative flex items-center gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/70 px-3.5 py-2 sm:px-4 sm:py-2.5 min-w-0 flex-1 sm:flex-initial sm:max-w-xl"
              >
                {cdBreakdownOpen && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-3rem,280px)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <CdBreakdownPopoverBody lines={cdBreakdownLines} />
                  </div>
                )}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="text-emerald-700 w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide truncate">CD balance</span>
                      <button
                        type="button"
                        onClick={() => setCdBreakdownOpen((o) => !o)}
                        className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-white/80 flex-shrink-0 cursor-pointer"
                      >
                        <Info size={12} aria-hidden /> Details
                      </button>
                    </div>
                    {cdAfterSubmit < 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 flex-shrink-0">
                        <AlertCircle size={14} aria-hidden /> Insufficient
                      </span>
                    ) : (
                      <span className="flex-shrink-0" title="Sufficient CD for this batch (est.)">
                        <CheckCircle size={14} className="text-emerald-600" aria-hidden />
                      </span>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-indigo-700 tabular-nums truncate mt-0.5">
                    {formatInrSigned(cdAfterSubmit)}
                  </p>
                  <p className="text-[11px] text-gray-600 tabular-nums leading-snug">
                    <span className="text-gray-500">Current</span> {formatInr(MOCK_CD_AVAILABLE_RUPEES)}
                    <span className="text-gray-400"> · </span>
                    <span className="text-red-600 font-medium">−Est. {formatInr(estimatedCdDraw)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className={`flex items-center justify-end flex-shrink-0 ${showBottomCd ? 'w-full sm:w-auto' : ''}`}>
            <button
              type="button"
              onClick={handlePreview}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye size={16} /> Preview &amp; Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, type = 'text', required, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white transition-colors ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SelectField({ label, required, value, onChange, options, placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white transition-colors ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SectionPill({ label, done, count }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
      done
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-gray-400 bg-gray-50 border-gray-200'
    }`}>
      {done ? <CheckCircle size={10} /> : <span className="w-2.5 h-2.5 rounded-full bg-gray-200 flex-shrink-0" />}
      {label}
      {count != null && <span className="text-[9px] opacity-70">{typeof count === 'number' ? count : count}</span>}
    </span>
  )
}

function PF({ label, value }) {
  return <div><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-medium text-gray-900">{value || '—'}</p></div>
}

function getRelationIcon(relation) {
  const r = (relation || '').toLowerCase()
  if (r === 'spouse') return <Heart size={14} className="text-pink-500" />
  if (['father', 'mother'].includes(r)) return <User size={14} className="text-amber-600" />
  if (['son', 'daughter'].includes(r)) return <User size={14} className="text-blue-500" />
  if (['brother', 'sister'].includes(r)) return <Users size={14} className="text-violet-500" />
  if (r.includes('in-law')) return <User size={14} className="text-teal-500" />
  return <User size={14} className="text-gray-500" />
}
