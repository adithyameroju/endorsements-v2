import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, Eye, EyeOff, CheckCircle, User, Trash2, ChevronUp, AlertCircle, Sparkles, X, Wallet, FolderOpen, Calculator } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { basePlans } from '../data/mockData'
import { cloneEmployeeGmcPlans } from '../lib/planHelpers'
import AnimatedCdAmount from '../components/AnimatedCdAmount'
import CdBalanceFormWidget from '../components/CdBalanceFormWidget'
import QuickAddBatchStickyFooter from '../components/QuickAddBatchStickyFooter'
import { formatInrSigned } from '../lib/currencyFormat'
import {
  clearQuickAddDraft,
  loadQuickAddDraft,
  hasQuickAddDraft,
  formatDraftSavedLabel,
} from '../lib/quickAddDraft'
import { useEndorsements } from '../store/EndorsementStore'
import QuickAddReviewScreen from '../components/QuickAddReviewScreen'
import {
  formSectionTitleClass,
  formSectionBadgeClass,
  formFieldLabelClass,
  formControlClass,
  formControlErrorClass,
} from '../lib/formUi'
import {
  validateBasicFields as validate,
  hasPlans,
  employeeHasAnyValidationIssue,
  sectionErrorFlags,
  formatEmployeeIssueTooltip,
  buildQuickAddErrorBannerSummary,
} from '../lib/quickAddValidation'

/** Sidebar / header CD column — +10px vs previous 19rem / 21rem cap. */
const CD_RAIL_WIDTH_CLASS = 'w-[min(calc(19rem+10px),32vw)] max-w-[calc(21rem+10px)]'

const defaultGmcBaseId = basePlans[0]?.id || ''

const emptyEmployee = () => ({
  id: Date.now(),
  name: '', empId: '', email: '', dob: '',
  gender: '', doj: '', mobile: '',
  plans: defaultGmcBaseId ? { gmcBasePlan: defaultGmcBaseId } : {},
  dependents: [],
})

const requiredFields = ['name', 'empId', 'email', 'dob', 'gender', 'doj']

function isFilled(emp) {
  return emp.name.trim() && emp.empId.trim() && emp.email.trim()
}

function isBasicComplete(emp) {
  return requiredFields.every(f => emp[f] && String(emp[f]).trim())
}

function fieldCount(emp) {
  return requiredFields.filter(f => emp[f] && String(emp[f]).trim()).length
}

/** Replace with API / context in production */
const MOCK_CD_AVAILABLE_RUPEES = 48_50_000
/** Illustrative policy context for CD / premium panel header */
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
    lines.push({ id: 'primary', label: 'Primary premium (pro-rata)', amount: primaryTotal })
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
  const [isLgViewport, setIsLgViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [draftBanner, setDraftBanner] = useState('')
  const draftBannerTimer = useRef(null)
  const [draftOffer, setDraftOffer] = useState(null)
  const draftOfferChecked = useRef(false)
  const [hasDraftOnDisk, setHasDraftOnDisk] = useState(() => hasQuickAddDraft())
  /** fresh → Calculate | calculated → Preview | stale → Recalculate after edits */
  const [premiumFlow, setPremiumFlow] = useState('fresh')
  const isFirstEmployeesEffect = useRef(true)
  const suppressPremiumStaleOnce = useRef(false)

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

  const errorBannerSummary = useMemo(
    () => buildQuickAddErrorBannerSummary(employees),
    [employees],
  )

  useEffect(() => {
    if (isFirstEmployeesEffect.current) {
      isFirstEmployeesEffect.current = false
      return
    }
    if (suppressPremiumStaleOnce.current) {
      suppressPremiumStaleOnce.current = false
      return
    }
    setPremiumFlow((f) => (f === 'calculated' ? 'stale' : f))
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

  useEffect(() => {
    if (draftOfferChecked.current) return
    draftOfferChecked.current = true
    const d = loadQuickAddDraft()
    if (d?.employees?.length) setDraftOffer(d)
  }, [])

  /** Hide the startup restore banner once the user has real in-progress data. */
  useEffect(() => {
    if (!draftOffer) return
    const first = employees[0]
    const pristineEmptyRow =
      employees.length === 1 &&
      !isFilled(first) &&
      (first.dependents?.length ?? 0) === 0
    if (!pristineEmptyRow) setDraftOffer(null)
  }, [employees, draftOffer])

  useEffect(
    () => () => {
      if (draftBannerTimer.current) clearTimeout(draftBannerTimer.current)
    },
    [],
  )

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

  const touchAllFieldsForEmployee = (empId) => {
    const allTouched = {}
    requiredFields.forEach((f) => {
      allTouched[f] = true
    })
    allTouched.mobile = true
    setTouchedMap((prev) => ({ ...prev, [empId]: { ...(prev[empId] || {}), ...allTouched } }))
  }

  const handleCalculatePremium = () => {
    setPremiumFlow('calculated')
  }

  const scrollToFirstErrorSectionForEmployee = (emp) => {
    const flags = sectionErrorFlags(emp)
    const order = [
      ['basic', 'basic'],
      ['plans', 'plans'],
      ['dependents', 'dependents'],
    ]
    for (const [flagKey, idSuffix] of order) {
      if (!flags[flagKey]) continue
      const el = document.getElementById(`quickadd-${emp.id}-section-${idSuffix}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
  }

  const handlePreview = () => {
    if (premiumFlow !== 'calculated') return
    let hasErrors = false
    for (const emp of employees) {
      if (employeeHasAnyValidationIssue(emp)) {
        hasErrors = true
        setExpandedId(emp.id)
        const idx = employees.findIndex((e) => e.id === emp.id)
        if (idx !== -1) setActiveTab(idx)
        touchAllFieldsForEmployee(emp.id)
        window.setTimeout(() => scrollToFirstErrorSectionForEmployee(emp), 150)
        break
      }
    }
    if (!hasErrors) setShowPreview(true)
  }

  const prefillData = () => {
    suppressPremiumStaleOnce.current = true
    const dummyEmployees = [
      {
        id: Date.now(),
        name: 'Rajesh Kumar',
        empId: 'EMP101',
        email: 'rajesh.k@acko.com',
        dob: '1990-05-15',
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
    setDraftOffer(null)
    setPremiumFlow('fresh')
  }

  const handleSubmit = () => {
    const details = employees.map(emp => ({
      name: emp.name,
      id: emp.empId,
    }))
    addEntry({ action: 'Add Employee', count: employees.length, status: 'Success', type: 'quick', details })
    clearQuickAddDraft()
    setHasDraftOnDisk(false)
    navigate('/')
  }

  const applyDraftFromPayload = (d) => {
    if (!d?.employees?.length) return false
    suppressPremiumStaleOnce.current = true
    const restored = d.employees
    setEmployees(restored)
    const tab = Math.min(Math.max(0, d.activeTab ?? 0), restored.length - 1)
    setActiveTab(tab)
    if (d.uiVariation === 'variation1' || d.uiVariation === 'variation2') {
      setUiVariation(d.uiVariation)
    }
    const expanded =
      restored.find((e) => e.id === d.expandedId)?.id ?? restored[tab]?.id ?? restored[0].id
    setExpandedId(expanded)
    setPremiumFlow('fresh')
    return true
  }

  const showDraftToast = (message) => {
    setDraftBanner(message)
    if (draftBannerTimer.current) clearTimeout(draftBannerTimer.current)
    draftBannerTimer.current = setTimeout(() => setDraftBanner(''), 3500)
  }

  const handleRestoreDraft = () => {
    if (!draftOffer?.employees?.length) return
    applyDraftFromPayload(draftOffer)
    setDraftOffer(null)
    showDraftToast('Draft restored.')
  }

  const handleLoadDraftFromDisk = () => {
    const d = loadQuickAddDraft()
    if (!applyDraftFromPayload(d)) return
    setDraftOffer(null)
    showDraftToast('Draft loaded from this device.')
  }

  const handleClearDraft = () => {
    clearQuickAddDraft()
    setHasDraftOnDisk(false)
    setDraftOffer(null)
    showDraftToast('Saved draft removed from this device.')
  }

  const renderAccordionView = () => (
    <div className="space-y-3">
      {employees.map((emp, idx) => {
        const isOpen = expandedId === emp.id
        const filled = isFilled(emp)
        const basicDone = isBasicComplete(emp)
        const plansDone = hasPlans(emp)
        const depsCount = emp.dependents.length
        const completed = fieldCount(emp)
        const hasValidationErrors = employeeHasAnyValidationIssue(emp)

        return (
          <div key={emp.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : basicDone ? 'border-emerald-200' : hasValidationErrors ? 'border-red-200 ring-1 ring-red-100/50' : 'border-gray-200 hover:border-gray-300'}`}>
            {/* Accordion header */}
            <button
              onClick={() => toggleAccordion(emp.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                basicDone ? 'bg-emerald-100' : hasValidationErrors ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {basicDone ? (
                  <CheckCircle size={20} className="text-emerald-600" />
                ) : hasValidationErrors ? (
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
                {renderEmployeeForm(emp, idx)}

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
        const hasAnyError = employeeHasAnyValidationIssue(emp)
        const tabTip = hasAnyError ? formatEmployeeIssueTooltip(emp) : ''
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
              title={tabTip || undefined}
              aria-invalid={hasAnyError ? 'true' : undefined}
              className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 text-xs font-medium rounded-full border transition-colors min-h-[2.25rem] ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200/60'
                  : hasAnyError
                    ? 'bg-white text-gray-700 border-red-300 ring-1 ring-red-200/80 hover:border-red-300'
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
    const sec = sectionErrorFlags(emp)
    const ringErr = (on) => (on ? 'ring-2 ring-red-200/90 border-red-200/90' : 'border-gray-200/90')

    return (
      <>
        <section
          id={`quickadd-${emp.id}-section-basic`}
          data-section-has-error={sec.basic ? 'true' : 'false'}
          className={`rounded-xl border bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-indigo-500 ${ringErr(sec.basic)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${basicDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {basicDone ? <CheckCircle size={14} /> : '1'}
              </div>
              Basic Information
            </h3>
            <div className="flex items-center gap-2">
              {sec.basic && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                  Needs fix
                </span>
              )}
              {basicDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Complete</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
            <FormField label="Full Name" required value={emp.name} onChange={v => updateEmployee(idx, 'name', v)} placeholder="e.g. Rahul Sharma" error={showError('name')} />
            <FormField label="Employee ID" required value={emp.empId} onChange={v => updateEmployee(idx, 'empId', v)} placeholder="e.g. EMP001" error={showError('empId')} />
            <FormField label="Email" type="email" required value={emp.email} onChange={v => updateEmployee(idx, 'email', v)} placeholder="e.g. rahul@acko.com" error={showError('email')} />
            <FormField label="Date of Birth" type="date" required value={emp.dob} onChange={v => updateEmployee(idx, 'dob', v)} error={showError('dob')} />
            <SelectField label="Gender" required value={emp.gender} onChange={v => updateEmployee(idx, 'gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select gender" error={showError('gender')} />
            <FormField label="Date of Joining" type="date" required value={emp.doj} onChange={v => updateEmployee(idx, 'doj', v)} error={showError('doj')} />
            <FormField label="Mobile number" type="tel" optional value={emp.mobile} onChange={v => updateEmployee(idx, 'mobile', v)} placeholder="e.g. 9876543210" error={showError('mobile')} />
          </div>
        </section>
        <section
          id={`quickadd-${emp.id}-section-plans`}
          data-section-has-error={sec.plans ? 'true' : 'false'}
          className={`rounded-xl border bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-sky-500 ${ringErr(sec.plans)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${plansDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {plansDone ? <CheckCircle size={14} /> : '2'}
              </div>
              Insurance Plans <span className="text-red-500 font-semibold">*</span>
            </h3>
            <div className="flex items-center gap-2">
              {sec.plans && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                  Needs fix
                </span>
              )}
              {plansDone && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Configured</span>}
            </div>
          </div>
          <PlanSelection plans={emp.plans} onChange={(plans) => updateEmployeePlans(idx, plans)} label={`emp-${idx}`} hideInsuranceHeader />
        </section>
        <section
          id={`quickadd-${emp.id}-section-dependents`}
          data-section-has-error={sec.dependents ? 'true' : 'false'}
          className={`rounded-xl border bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-violet-500 ${ringErr(sec.dependents)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
              <div className={`${formSectionBadgeClass} ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {depsCount > 0 ? <CheckCircle size={14} /> : <User size={14} />}
              </div>
              Dependents
            </h3>
            <div className="flex items-center gap-2">
              {sec.dependents && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                  Needs fix
                </span>
              )}
              {depsCount > 0 && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{depsCount} added</span>}
            </div>
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
    <CdBalanceFormWidget
      cdAfterSubmit={cdAfterSubmit}
      currentCd={MOCK_CD_AVAILABLE_RUPEES}
      estimatedCdDraw={estimatedCdDraw}
      lines={cdBreakdownLines}
      policyDaysRemaining={MOCK_POLICY_DAYS_LEFT}
      primaryBatchCount={employees.length}
    />
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
      <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 bg-white/60">
        <CdBalanceFormWidget
          variant="embedded"
          cdAfterSubmit={cdAfterSubmit}
          currentCd={MOCK_CD_AVAILABLE_RUPEES}
          estimatedCdDraw={estimatedCdDraw}
          lines={cdBreakdownLines}
          policyDaysRemaining={MOCK_POLICY_DAYS_LEFT}
          primaryBatchCount={employees.length}
        />
      </div>
    </div>
  )

  if (showPreview) {
    return (
      <QuickAddReviewScreen
        employees={employees}
        onExitReview={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        batchSummary={batchSummary}
        cdBreakdownLines={cdBreakdownLines}
        estimatedCdDraw={estimatedCdDraw}
        cdAfterSubmit={cdAfterSubmit}
        currentCd={MOCK_CD_AVAILABLE_RUPEES}
        policyDaysRemaining={MOCK_POLICY_DAYS_LEFT}
        draftBanner={draftBanner}
        onClearDraft={handleClearDraft}
        hasDraftOnDisk={hasDraftOnDisk}
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
              {hasDraftOnDisk && (
                <>
                  <button
                    type="button"
                    onClick={handleLoadDraftFromDisk}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                    title="Replace the form with your last saved draft"
                  >
                    <FolderOpen size={13} aria-hidden /> Load draft
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete the saved draft from this browser"
                  >
                    <Trash2 size={13} aria-hidden /> Clear draft
                  </button>
                </>
              )}
            </div>
          }
        />
      </div>

      {draftOffer && (
        <div
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950"
          role="status"
        >
          <span className="font-medium">
            A saved draft is available on this device.
            {draftOffer?.savedAt ? (
              <span className="block sm:inline sm:ml-1 font-normal text-amber-900/80 mt-0.5 sm:mt-0">
                Saved {formatDraftSavedLabel(draftOffer.savedAt)}.
              </span>
            ) : null}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer"
            >
              Restore draft
            </button>
            <button
              type="button"
              onClick={() => setDraftOffer(null)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-semibold text-amber-900 hover:bg-amber-100/50 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {draftBanner && (
        <div
          className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
          role="status"
        >
          {draftBanner}
        </div>
      )}

      {errorBannerSummary.affectedCount > 0 && (
        <div
          className="mb-3 flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950"
          role="alert"
          aria-live="polite"
          title={errorBannerSummary.line}
        >
          <AlertCircle size={16} strokeWidth={2.25} className="shrink-0 text-amber-600" aria-hidden />
          <span className="min-w-0 truncate whitespace-nowrap font-medium leading-tight text-amber-950">
            {errorBannerSummary.line}
          </span>
        </div>
      )}

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
                className={`flex ${CD_RAIL_WIDTH_CLASS} shrink-0 items-center justify-end border-l border-gray-100 bg-white px-3 py-2 sm:px-4`}
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
                  className={`${CD_RAIL_WIDTH_CLASS} shrink-0 overflow-y-auto overscroll-contain border-l border-gray-100 bg-white p-4 pt-3`}
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
                className={`${CD_RAIL_WIDTH_CLASS} shrink-0 border-l border-gray-100 bg-white overflow-y-auto overscroll-contain`}
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

      <QuickAddBatchStickyFooter
        beforeSummary={
          <>
            {showFooterCdWidget && <div className="mb-3">{renderCdBottomWidget()}</div>}
            {!cdBalanceVisible && !sidebarTabUnifiedChrome && (
              <div className="mb-3 flex justify-start">
                {renderCdBalanceHeaderCta({ isExpanded: false })}
              </div>
            )}
          </>
        }
        batchSummary={batchSummary}
        actions={
          <>
            {(premiumFlow === 'fresh' || premiumFlow === 'stale') && (
              <button
                type="button"
                onClick={handleCalculatePremium}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem]"
              >
                <Calculator size={18} strokeWidth={2.25} aria-hidden />
                {premiumFlow === 'stale' ? 'Recalculate premium' : 'Calculate premium'}
              </button>
            )}
            {premiumFlow === 'calculated' && (
              <button
                type="button"
                onClick={handlePreview}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem]"
              >
                <Eye size={18} strokeWidth={2.25} aria-hidden /> Preview &amp; Submit
              </button>
            )}
          </>
        }
      />
    </div>
  )
}

function FormField({ label, type = 'text', required, optional, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className={formFieldLabelClass}>
        {label}{' '}
        {optional && <span className="text-gray-400 font-normal">(Optional)</span>}
        {required && <span className="text-red-500">*</span>}
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

