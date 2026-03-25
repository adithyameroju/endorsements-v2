import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, Eye, EyeOff, CheckCircle, User, Trash2, ChevronUp, AlertCircle, Sparkles, X, Wallet, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { designations, basePlans, gpaBasePlans } from '../data/mockData'
import { cloneEmployeeGmcPlans } from '../lib/planHelpers'
import AnimatedCdAmount from '../components/AnimatedCdAmount'
import { formatInr, formatInrSigned } from '../lib/currencyFormat'
import { useEndorsements } from '../store/EndorsementStore'
import QuickAddReviewScreen from '../components/QuickAddReviewScreen'
import {
  formSectionTitleClass,
  formSectionBadgeClass,
  formFieldLabelClass,
  formControlClass,
  formControlErrorClass,
} from '../lib/formUi'

const defaultGmcBaseId = basePlans[0]?.id || ''

const emptyEmployee = () => ({
  id: Date.now(),
  name: '', empId: '', email: '', dob: '', designation: '',
  gender: '', doj: '', mobile: '',
  plans: defaultGmcBaseId ? { gmcBasePlan: defaultGmcBaseId } : {},
  dependents: [],
})

const requiredFields = ['name', 'empId', 'email', 'dob', 'designation', 'gender', 'doj', 'mobile']

function validate(emp) {
  const errors = {}
  if (!emp.name.trim()) errors.name = 'Name is required'
  if (!emp.empId.trim()) errors.empId = 'Employee ID is required'
  if (!emp.email.trim()) errors.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(emp.email)) errors.email = 'Invalid email format'
  if (!emp.dob) errors.dob = 'Date of birth is required'
  if (!emp.designation) errors.designation = 'Designation is required'
  if (!emp.gender) errors.gender = 'Gender is required'
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

const CD_BALANCE_VISIBLE_KEY = 'quickAdd_cdBalanceVisible'
const CD_PLACEMENT_STORAGE_KEY = 'quickAdd_cdPlacement'

function readStoredCdBalanceVisible() {
  try {
    const v = sessionStorage.getItem(CD_BALANCE_VISIBLE_KEY)
    if (v === '0') return false
  } catch {
    /* private mode / unavailable */
  }
  return true
}

function readStoredCdPlacement() {
  try {
    const v = sessionStorage.getItem(CD_PLACEMENT_STORAGE_KEY)
    if (v === 'sidebar' || v === 'bottom') return v
  } catch {
    /* private mode / unavailable */
  }
  return 'sidebar'
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
  const [cdBalanceVisible, setCdBalanceVisible] = useState(readStoredCdBalanceVisible)
  const [cdPlacement, setCdPlacement] = useState(readStoredCdPlacement)
  const [cdBreakdownOpen, setCdBreakdownOpen] = useState(false)
  const [isLgViewport, setIsLgViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const cdPopoverRef = useRef(null)

  const { estimatedCdDraw, cdAfterSubmit, cdBreakdownLines } = useMemo(() => {
    const { total, lines } = estimateCdDrawBreakdown(employees)
    return {
      estimatedCdDraw: total,
      cdAfterSubmit: MOCK_CD_AVAILABLE_RUPEES - total,
      cdBreakdownLines: lines,
    }
  }, [employees])

  const batchSummary = useMemo(() => {
    const count = employees.length
    const basicsComplete = employees.filter(isBasicComplete).length
    const dependentCount = employees.reduce((sum, e) => sum + (e.dependents?.length || 0), 0)
    return { count, basicsComplete, dependentCount }
  }, [employees])

  useEffect(() => {
    setActiveTab((t) => Math.min(t, Math.max(0, employees.length - 1)))
  }, [employees.length])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsLgViewport(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /** Sidebar rail on large screens (accordion + tab each keep their own layout below). */
  const showFormSidebarCd = cdPlacement === 'sidebar' && isLgViewport
  /** Unified chrome: full-width header (tabs | CD CTA) + rail under CTA — only Sidebar CD + Tab view + lg. */
  const sidebarTabUnifiedChrome = cdPlacement === 'sidebar' && uiVariation === 'variation2' && isLgViewport
  const showFooterCd = cdPlacement === 'bottom' || (cdPlacement === 'sidebar' && !isLgViewport)
  /** Omit bottom sticky CD only for sidebar+tab+lg (CD lives in header + rail). Other combos unchanged. */
  const showFooterCdWidget =
    showFooterCd && cdBalanceVisible && !sidebarTabUnifiedChrome

  const persistCdPlacement = (value) => {
    setCdPlacement(value)
    setCdBreakdownOpen(false)
    try {
      sessionStorage.setItem(CD_PLACEMENT_STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }

  const persistCdBalanceVisible = (visible) => {
    setCdBalanceVisible(visible)
    try {
      sessionStorage.setItem(CD_BALANCE_VISIBLE_KEY, visible ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!cdBreakdownOpen) return
    const onPointerDown = (e) => {
      const t = e.target
      if (cdPopoverRef.current?.contains(t)) return
      setCdBreakdownOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [cdBreakdownOpen])

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
    const n = employees.length
    const removed = employees[index]
    setActiveTab((prev) => {
      if (prev > index) return prev - 1
      if (prev === index && index === n - 1) return Math.max(0, prev - 1)
      return prev
    })
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
                    <span className="text-xs text-gray-400 truncate hidden sm:inline">{emp.empId}</span>
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
                <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-indigo-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} ${basicDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {basicDone ? <CheckCircle size={14} /> : '1'}
                      </div>
                      Basic Information
                    </h3>
                    {basicDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Complete</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
                    <FormField label="Full Name" required value={emp.name} onChange={v => updateEmployee(idx, 'name', v)} placeholder="e.g. Rahul Sharma" error={showError('name')} />
                    <FormField label="Employee ID" required value={emp.empId} onChange={v => updateEmployee(idx, 'empId', v)} placeholder="e.g. EMP001" error={showError('empId')} />
                    <FormField label="Email" type="email" required value={emp.email} onChange={v => updateEmployee(idx, 'email', v)} placeholder="e.g. rahul@acko.com" error={showError('email')} />
                    <FormField label="Date of Birth" type="date" required value={emp.dob} onChange={v => updateEmployee(idx, 'dob', v)} error={showError('dob')} />
                    <SelectField label="Designation" required value={emp.designation} onChange={v => updateEmployee(idx, 'designation', v)} options={designations} placeholder="Select designation" error={showError('designation')} />
                    <SelectField label="Gender" required value={emp.gender} onChange={v => updateEmployee(idx, 'gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select gender" error={showError('gender')} />
                    <FormField label="Date of Joining" type="date" required value={emp.doj} onChange={v => updateEmployee(idx, 'doj', v)} error={showError('doj')} />
                    <FormField label="Mobile Number" type="tel" required value={emp.mobile} onChange={v => updateEmployee(idx, 'mobile', v)} placeholder="e.g. 9876543210" error={showError('mobile')} />
                  </div>
                </section>
                <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-sky-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} ${plansDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {plansDone ? <CheckCircle size={14} /> : '2'}
                      </div>
                      Insurance Plans <span className="text-red-500 font-semibold">*</span>
                    </h3>
                    {plansDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Configured</span>}
                  </div>
                  <PlanSelection plans={emp.plans} onChange={(plans) => updateEmployeePlans(idx, plans)} label={`emp-${idx}`} hideInsuranceHeader />
                </section>
                <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-violet-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {depsCount > 0 ? <CheckCircle size={14} /> : <User size={14} />}
                      </div>
                      Dependents
                    </h3>
                    {depsCount > 0 && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{depsCount} added</span>}
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

  /** Tab strip — fixed above scroll; form is tabpanel below. */
  const renderTabStrip = () => (
    <div
      className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full min-w-0 sm:overflow-x-auto sm:[scrollbar-width:thin]"
      role="tablist"
      aria-label="Employees"
    >
      {employees.map((emp, idx) => {
        const basicDone = isBasicComplete(emp)
        const hasAnyError = Object.keys(validate(emp)).length > 0
        const isActive = activeTab === idx
        const tabId = `quickadd-emp-tab-${idx}`

        return (
          <div key={emp.id} className="relative flex-shrink-0">
            <button
              type="button"
              id={tabId}
              role="tab"
              aria-selected={isActive}
              aria-controls="quickadd-emp-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 text-xs font-medium rounded-full border transition-colors min-h-[2.25rem] ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200/60'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : basicDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : hasAnyError
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isActive ? (
                  idx + 1
                ) : basicDone ? (
                  <CheckCircle size={11} strokeWidth={2.5} />
                ) : hasAnyError ? (
                  <AlertCircle size={11} strokeWidth={2.5} />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="max-w-[6rem] sm:max-w-[8.5rem] truncate">
                {emp.name ? emp.name.split(' ')[0] : `Employee ${idx + 1}`}
              </span>
            </button>
            {employees.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeEmployee(idx)
                }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-50 shadow-sm z-10"
                aria-label={`Remove employee ${idx + 1}`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )
      })}
      {employees.length < 5 && (
        <button
          type="button"
          onClick={() => {
            const nextIndex = employees.length
            addEmployee()
            setActiveTab(nextIndex)
          }}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 transition-colors min-h-[2.25rem] flex-shrink-0"
        >
          <Plus size={12} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
          <span className="whitespace-nowrap">Add employee {employees.length + 1}/5</span>
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
        <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${basicDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {basicDone ? <CheckCircle size={14} /> : '1'}
              </div>
              Basic Information
            </h3>
            {basicDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Complete</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
            <FormField label="Full Name" required value={emp.name} onChange={v => updateEmployee(idx, 'name', v)} placeholder="e.g. Rahul Sharma" error={showError('name')} />
            <FormField label="Employee ID" required value={emp.empId} onChange={v => updateEmployee(idx, 'empId', v)} placeholder="e.g. EMP001" error={showError('empId')} />
            <FormField label="Email" type="email" required value={emp.email} onChange={v => updateEmployee(idx, 'email', v)} placeholder="e.g. rahul@acko.com" error={showError('email')} />
            <FormField label="Date of Birth" type="date" required value={emp.dob} onChange={v => updateEmployee(idx, 'dob', v)} error={showError('dob')} />
            <SelectField label="Designation" required value={emp.designation} onChange={v => updateEmployee(idx, 'designation', v)} options={designations} placeholder="Select designation" error={showError('designation')} />
            <SelectField label="Gender" required value={emp.gender} onChange={v => updateEmployee(idx, 'gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select gender" error={showError('gender')} />
            <FormField label="Date of Joining" type="date" required value={emp.doj} onChange={v => updateEmployee(idx, 'doj', v)} error={showError('doj')} />
            <FormField label="Mobile Number" type="tel" required value={emp.mobile} onChange={v => updateEmployee(idx, 'mobile', v)} placeholder="e.g. 9876543210" error={showError('mobile')} />
          </div>
        </section>
        <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-sky-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${plansDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {plansDone ? <CheckCircle size={14} /> : '2'}
              </div>
              Insurance Plans <span className="text-red-500 font-semibold">*</span>
            </h3>
            {plansDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Configured</span>}
          </div>
          <PlanSelection plans={emp.plans} onChange={(plans) => updateEmployeePlans(idx, plans)} label={`emp-${idx}`} hideInsuranceHeader />
        </section>
        <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-violet-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {depsCount > 0 ? <CheckCircle size={14} /> : <User size={14} />}
              </div>
              Dependents
            </h3>
            {depsCount > 0 && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{depsCount} added</span>}
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

  /**
   * Default CD header CTA: same pill whether widget is open or closed.
   * Closed: Eye (view). Open: EyeOff (eye with slash) to dismiss.
   */
  const renderCdBalanceHeaderCta = ({ withStartDivider = false, isExpanded = false } = {}) => {
    const btn = (
      <button
        type="button"
        onClick={() => persistCdBalanceVisible(!isExpanded)}
        className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-2 text-left transition-colors hover:bg-emerald-100/90 cursor-pointer sm:px-3"
        aria-label={
          isExpanded ? 'Close CD balance view' : 'View CD balance — after batch estimate'
        }
        title={isExpanded ? 'Close CD balance view' : 'View CD balance'}
      >
        <Wallet size={17} className="shrink-0 text-emerald-700" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="shrink-0 text-xs font-bold text-emerald-900">CD balance:</span>
          <AnimatedCdAmount
            value={cdAfterSubmit}
            className="min-w-0 truncate text-sm font-bold text-indigo-700 tabular-nums"
          >
            {formatInrSigned(cdAfterSubmit)}
          </AnimatedCdAmount>
        </span>
        {isExpanded ? (
          <EyeOff size={17} className="shrink-0 text-emerald-700" aria-hidden />
        ) : (
          <Eye size={17} className="shrink-0 text-emerald-700" aria-hidden />
        )}
      </button>
    )
    if (withStartDivider) {
      return <div className="ml-0.5 border-l border-gray-200 pl-3">{btn}</div>
    }
    return btn
  }

  /** Sidebar rail: same section styling as Basic info / Plans (integrated form UI). */
  const renderCdSidebarFormPanel = () => (
    <section className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-emerald-500">
      <div className="mb-1">
        <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
          <span className={`${formSectionBadgeClass} bg-emerald-100 text-emerald-700`}>
            <Wallet size={14} aria-hidden />
          </span>
          CD balance (est.)
        </h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Live estimate of Corporate Deposit after this endorsement batch.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-800">After this batch</span>
          {cdAfterSubmit < 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
              <AlertCircle size={14} aria-hidden /> Insufficient
            </span>
          ) : (
            <span title="Sufficient CD for this batch (est.)">
              <CheckCircle size={16} className="text-emerald-600" aria-hidden />
            </span>
          )}
        </div>
        <AnimatedCdAmount
          value={cdAfterSubmit}
          className="text-xl font-bold text-indigo-700 tabular-nums block"
        >
          {formatInrSigned(cdAfterSubmit)}
        </AnimatedCdAmount>
        <p className="text-sm text-gray-600 tabular-nums leading-snug">
          <span className="text-gray-500">Current</span>{' '}
          <AnimatedCdAmount value={MOCK_CD_AVAILABLE_RUPEES} className="font-semibold text-gray-900 inline">
            {formatInr(MOCK_CD_AVAILABLE_RUPEES)}
          </AnimatedCdAmount>
          <span className="text-gray-400"> · </span>
          <span className="text-red-600 font-semibold">
            −Est.{' '}
            <AnimatedCdAmount value={estimatedCdDraw} className="font-semibold text-red-600 inline">
              {formatInr(estimatedCdDraw)}
            </AnimatedCdAmount>
          </span>
        </p>
        <div className="rounded-lg border border-gray-100 bg-gray-50/90 p-3">
          <CdBreakdownPopoverBody lines={cdBreakdownLines} />
        </div>
      </div>
    </section>
  )

  /** Bottom placement: full-width card with popover details. */
  const renderCdBottomWidget = () => (
    <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-emerald-200/60 bg-emerald-50/90">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet size={17} className="text-emerald-700 flex-shrink-0" aria-hidden />
          <h3 className="text-sm font-bold text-emerald-950 tracking-tight">CD balance (est.)</h3>
        </div>
        <button
          type="button"
          onClick={() => persistCdBalanceVisible(false)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-white/70 border border-transparent hover:border-emerald-200/80 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Close CD balance view"
          title="Close CD balance view"
        >
          <EyeOff size={15} aria-hidden />
          Hide
        </button>
      </div>
      <div className="px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div ref={cdPopoverRef} className="relative min-w-0">
          {cdBreakdownOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-3rem,280px)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <CdBreakdownPopoverBody lines={cdBreakdownLines} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-gray-800">After this batch</span>
                <button
                  type="button"
                  onClick={() => setCdBreakdownOpen((o) => !o)}
                  className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-white/80 cursor-pointer"
                >
                  <Info size={13} aria-hidden /> Details
                </button>
              </div>
              {cdAfterSubmit < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
                  <AlertCircle size={15} aria-hidden /> Insufficient
                </span>
              ) : (
                <span title="Sufficient CD for this batch (est.)">
                  <CheckCircle size={16} className="text-emerald-600" aria-hidden />
                </span>
              )}
            </div>
            <AnimatedCdAmount
              value={cdAfterSubmit}
              className="text-xl sm:text-2xl font-bold text-indigo-700 tabular-nums truncate mt-2 block"
            >
              {formatInrSigned(cdAfterSubmit)}
            </AnimatedCdAmount>
            <p className="text-sm text-gray-600 tabular-nums leading-snug mt-2">
              <span className="text-gray-500">Current</span>{' '}
              <AnimatedCdAmount value={MOCK_CD_AVAILABLE_RUPEES} className="font-semibold text-gray-900 inline">
                {formatInr(MOCK_CD_AVAILABLE_RUPEES)}
              </AnimatedCdAmount>
              <span className="text-gray-400"> · </span>
              <span className="text-red-600 font-semibold">
                −Est.{' '}
                <AnimatedCdAmount value={estimatedCdDraw} className="font-semibold text-red-600 inline">
                  {formatInr(estimatedCdDraw)}
                </AnimatedCdAmount>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (showPreview) {
    return (
      <QuickAddReviewScreen
        employees={employees}
        onExitReview={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        cdBreakdownLines={cdBreakdownLines}
        estimatedCdDraw={estimatedCdDraw}
        cdAfterSubmit={cdAfterSubmit}
        currentCd={MOCK_CD_AVAILABLE_RUPEES}
        policyDaysRemaining={MOCK_POLICY_DAYS_LEFT}
      />
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8 pt-4 pb-0">
      <div className="flex-shrink-0 mb-2">
        <PageHeader
          title="Quick Add Employees"
          subtitle="Up to 5 employees — plans and dependents"
          breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Quick Add' }]}
          trailing={<Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={1} compact />}
          navTrailing={
            <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
              <select
                aria-label="Employee form layout"
                value={uiVariation}
                onChange={(e) => {
                  const v = e.target.value
                  setUiVariation(v)
                  if (v === 'variation2') {
                    const i = employees.findIndex((emp) => emp.id === expandedId)
                    setActiveTab(i === -1 ? 0 : i)
                  }
                }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white font-medium max-w-[9rem]"
              >
                <option value="variation2">Tab View</option>
                <option value="variation1">Accordion View</option>
              </select>
              <select
                aria-label="CD balance placement"
                value={cdPlacement}
                onChange={(e) => persistCdPlacement(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white font-medium max-w-[11rem] sm:max-w-[13rem]"
              >
                <option value="sidebar">Sidebar CD balance</option>
                <option value="bottom">Bottom CD balance</option>
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

      <div className="flex-1 min-h-0 flex flex-col min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
        {sidebarTabUnifiedChrome ? (
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden min-w-0 bg-white">
            <div className="flex flex-shrink-0 items-stretch border-b border-gray-100 bg-white z-20">
              <div className="flex min-w-0 flex-1 items-center px-3 py-2 sm:px-4">
                <div className="min-w-0 flex-1 overflow-x-auto sm:[scrollbar-width:thin]">
                  {renderTabStrip()}
                </div>
              </div>
              <div
                className="flex w-[min(19rem,32vw)] max-w-[21rem] shrink-0 items-center justify-end border-l border-gray-100 bg-white px-3 py-2 sm:px-4"
                aria-label="CD balance controls"
              >
                <div className="flex w-full min-w-0 justify-end">
                  {renderCdBalanceHeaderCta({ withStartDivider: false, isExpanded: cdBalanceVisible })}
                </div>
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
              <div
                className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3"
                role="tabpanel"
                id="quickadd-emp-panel"
                aria-labelledby={`quickadd-emp-tab-${activeTab}`}
              >
                {renderTabFormCard(true)}
              </div>
              {cdBalanceVisible && (
                <aside
                  className="w-[min(19rem,32vw)] max-w-[21rem] shrink-0 overflow-y-auto overscroll-contain border-l border-gray-100 bg-white p-4 pt-3"
                  aria-label="CD balance estimate"
                >
                  {renderCdSidebarFormPanel()}
                </aside>
              )}
            </div>
          </div>
        ) : showFormSidebarCd ? (
          /* Accordion + Sidebar CD + lg only (Tab + Sidebar + lg uses sidebarTabUnifiedChrome above). */
          <div className="flex flex-1 min-h-0 flex-row overflow-hidden min-w-0">
            <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-white">
              {cdBalanceVisible && (
                <div className="z-20 flex flex-shrink-0 items-center justify-end gap-2 border-b border-gray-100 bg-white px-3 py-2 sm:px-4">
                  {renderCdBalanceHeaderCta({ withStartDivider: true, isExpanded: true })}
                </div>
              )}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
                {renderAccordionView()}
              </div>
            </div>
            {cdBalanceVisible && (
              <aside
                className="w-[min(19rem,32vw)] max-w-[21rem] shrink-0 border-l border-gray-100 bg-white overflow-y-auto overscroll-contain"
                aria-label="CD balance estimate"
              >
                <div className="sticky top-0 p-4">{renderCdSidebarFormPanel()}</div>
              </aside>
            )}
          </div>
        ) : uiVariation === 'variation1' ? (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
            {renderAccordionView()}
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col min-h-0 overflow-hidden">
            <div className="flex-shrink-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm px-3 py-2 sm:px-4">
              {renderTabStrip()}
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-3"
              role="tabpanel"
              id="quickadd-emp-panel"
              aria-labelledby={`quickadd-emp-tab-${activeTab}`}
            >
              {renderTabFormCard(true)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom: bottom CD (when placement is bottom or narrow sidebar mode) + batch summary + Preview */}
      <div className="flex-shrink-0 sticky bottom-0 z-40 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] py-2.5">
        {showFooterCdWidget && <div className="mb-3">{renderCdBottomWidget()}</div>}
        {!cdBalanceVisible && !sidebarTabUnifiedChrome && (
          <div className="mb-3 flex justify-start">
            {renderCdBalanceHeaderCta({ isExpanded: false })}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
          <p
            className="text-[11px] sm:text-xs text-gray-600 leading-snug min-w-0 sm:flex-1 sm:max-w-md"
            aria-live="polite"
          >
            <span className="font-semibold text-gray-800">{batchSummary.count}</span>
            {' employee'}
            {batchSummary.count !== 1 ? 's' : ''}
            <span className="text-gray-300 mx-1.5">·</span>
            <span className="font-medium text-gray-700">{batchSummary.basicsComplete}</span>
            {' profile'}
            {batchSummary.basicsComplete !== 1 ? 's' : ''} complete
            <span className="text-gray-300 mx-1.5">·</span>
            <span className="font-medium text-gray-700">{batchSummary.dependentCount}</span>
            {' dependent'}
            {batchSummary.dependentCount !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0 sm:flex-shrink-0 sm:ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePreview}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem]"
            >
              <Eye size={18} strokeWidth={2.25} aria-hidden /> Preview &amp; Submit
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
      <label className={formFieldLabelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${formControlClass} ${error ? formControlErrorClass : ''}`}
      />
      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  )
}

function SelectField({ label, required, value, onChange, options, placeholder, error }) {
  return (
    <div>
      <label className={formFieldLabelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${formControlClass} ${error ? formControlErrorClass : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
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

