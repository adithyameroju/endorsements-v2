import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle, Sparkles, Calculator, Eye } from 'lucide-react'
import CdBalanceFormWidget from '../components/CdBalanceFormWidget'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import QuickAddBatchStickyFooter from '../components/QuickAddBatchStickyFooter'
import UpdateFlowReviewScreen from '../components/UpdateFlowReviewScreen'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'
import { formatInheritedGmcLines } from '../lib/planHelpers'
import {
  formHelperTextClass,
  formSectionTitleClass,
  formSectionBadgeClass,
  updateFormSectionShell,
  formFieldLabelClass,
  formControlClass,
  formControlErrorClass,
} from '../lib/formUi'
import {
  mergeDemoEmployeePlans,
  buildSpouseFlowPremiumEmployees,
  buildLifeEventCdBaselineEmployee,
  computeUpdateFlowCdState,
} from '../lib/updateFlowPremium'
import { spouseFlowBatchSummary } from '../lib/updateFlowBatchSummary'

const CD_RAIL_WIDTH_CLASS = 'w-full lg:w-[min(calc(19rem+10px),32vw)] lg:max-w-[calc(21rem+10px)]'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function LifeEventSpouse() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [spouseData, setSpouseData] = useState({
    name: '',
    dob: '',
    gender: 'Female',
    dateOfMarriage: '',
    coverageEffectiveDate: '',
    samePlansAsEmployee: true,
    plans: {},
  })
  const [showPreview, setShowPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [employeePlansEdit, setEmployeePlansEdit] = useState(null)
  const [premiumFlow, setPremiumFlow] = useState('fresh')
  const isFirstSpouseEffect = useRef(true)

  const batchSummary = useMemo(
    () => spouseFlowBatchSummary(selectedEmployee, spouseData),
    [selectedEmployee, spouseData],
  )
  const canProceed = batchSummary.basicsComplete === 1

  const reviewPremiumEmployees = useMemo(() => {
    if (!showPreview || !selectedEmployee) return []
    return buildSpouseFlowPremiumEmployees(
      selectedEmployee,
      spouseData,
      employeePlansEdit ?? mergeDemoEmployeePlans(selectedEmployee),
    )
  }, [showPreview, selectedEmployee, spouseData, employeePlansEdit])

  const reviewCdBaseline = useMemo(() => {
    if (!showPreview || !selectedEmployee) return undefined
    return [buildLifeEventCdBaselineEmployee(selectedEmployee)]
  }, [showPreview, selectedEmployee])

  const formCdState = useMemo(() => {
    if (!selectedEmployee || !employeePlansEdit) return null
    const employees = buildSpouseFlowPremiumEmployees(
      selectedEmployee,
      spouseData,
      employeePlansEdit,
    )
    const baseline = [buildLifeEventCdBaselineEmployee(selectedEmployee)]
    return computeUpdateFlowCdState(employees, {
      flow: 'add-spouse',
      flowMeta: { spouseName: spouseData.name },
      baselineEmployees: baseline,
    })
  }, [selectedEmployee, spouseData, employeePlansEdit])

  useEffect(() => {
    if (isFirstSpouseEffect.current) {
      isFirstSpouseEffect.current = false
      return
    }
    setPremiumFlow((f) => (f === 'calculated' ? 'stale' : f))
  }, [spouseData, employeePlansEdit])

  const cdEstimateReadyForm = premiumFlow === 'calculated'

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) || emp.id.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setEmployeePlansEdit(mergeDemoEmployeePlans(emp))
    setShowResults(false)
    setShowPreview(false)
    setPremiumFlow('fresh')
    isFirstSpouseEffect.current = true
    setQuery(emp.name)
  }

  const setSamePlans = (same) => {
    const ep = employeePlansEdit || mergeDemoEmployeePlans(selectedEmployee)
    setSpouseData({
      ...spouseData,
      samePlansAsEmployee: same,
      plans: same ? {} : { gmcBasePlan: ep.gmcBasePlan || '' },
    })
  }

  const prefillSpouse = () => {
    if (!selectedEmployee) return
    setSpouseData({
      name: 'Ananya Rao',
      dob: '1994-06-12',
      gender: 'Female',
      dateOfMarriage: '2025-01-15',
      coverageEffectiveDate: todayIsoDate(),
      samePlansAsEmployee: true,
      plans: {},
    })
  }

  const validate = () => {
    const e = {}
    if (!spouseData.name.trim()) e.name = 'Spouse name is required'
    if (!spouseData.dob) e.dob = 'Date of birth is required'
    if (!spouseData.dateOfMarriage) e.dateOfMarriage = 'Date of marriage is required'
    if (!String(spouseData.coverageEffectiveDate || '').trim()) {
      e.coverageEffectiveDate = 'Coverage effective date is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleProceedToSubmit = () => {
    if (!validate()) return
    if (formCdState?.cdAfterSubmit < 0) return
    setShowPreview(true)
  }

  const handleSubmit = () => {
    if (!validate()) return
    addEntry({
      action: 'Life Event - Add Spouse',
      count: 1,
      status: 'Success',
      type: 'quick',
      changeSummary: { title: 'Spouse added to cover', lines: ['Spouse enrolled under employee record'] },
      premiumSummary: {
        totalInclGst: 22160,
        gstRatePercent: 18,
        lines: [
          { label: 'GMC dependent (mock)', amount: 14000 },
          { label: 'GST (18%)', amount: 8160 },
          { label: 'Total (incl. GST)', amount: 22160 },
        ],
      },
    })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Spouse Added</h2>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (showPreview && selectedEmployee) {
    return (
      <UpdateFlowReviewScreen
        title="Review & Submit"
        subtitle="Confirm details and CD impact before you submit"
        breadcrumbs={[
          { label: 'Update Employee', path: '/update' },
          { label: 'Add Spouse', onClick: () => setShowPreview(false) },
          { label: 'Preview' },
        ]}
        stepperSteps={['Select Employee', 'Spouse Details & Plans', 'Preview & Submit']}
        stepperCurrentStep={3}
        employees={reviewPremiumEmployees}
        batchSummary={batchSummary}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        submitLabel="Submit Endorsement"
        cdFlow="add-spouse"
        cdFlowMeta={{ spouseName: spouseData.name }}
        cdBaselineEmployees={reviewCdBaseline}
        cdEstimateReady
      />
    )
  }

  const stepCurrent = selectedEmployee ? 2 : 1

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8 pt-4 pb-0">
      <div className="flex-shrink-0">
        <PageHeader
          title="Add Spouse"
          subtitle="Register a spouse for an employee"
          breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Spouse' }]}
          trailing={
            <Stepper steps={['Select Employee', 'Spouse Details & Plans', 'Preview & Submit']} currentStep={stepCurrent} compact />
          }
          navTrailing={
            selectedEmployee ? (
              <button
                type="button"
                onClick={prefillSpouse}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
              >
                <Sparkles size={13} aria-hidden /> Prefill data
              </button>
            ) : null
          }
        />

        <div className="relative mb-5">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white"
            />
          </div>
          {showResults && query.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">No employees found</div>
              ) : (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => selectEmployee(emp)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.id} &middot; {emp.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && employeePlansEdit && (
        <>
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:self-stretch rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4">
                <section className={updateFormSectionShell.basic}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>1</div>
                      Employee
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p>
                      <p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.email}</p>
                    </div>
                  </div>
                </section>

                <section className={updateFormSectionShell.plans}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>2</div>
                      Insurance Plans <span className="text-red-500 font-semibold">*</span>
                    </h3>
                  </div>
                  <PlanSelection
                    plans={employeePlansEdit}
                    onChange={setEmployeePlansEdit}
                    label="life-spouse-emp"
                    hideInsuranceHeader
                  />
                </section>

                <section className={updateFormSectionShell.basic}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>3</div>
                      Spouse details
                    </h3>
                  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-4">
                  <div>
                    <label className={formFieldLabelClass}>Spouse Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={spouseData.name}
                      onChange={e => setSpouseData({ ...spouseData, name: e.target.value })}
                      placeholder="Full name"
                      className={`${formControlClass} ${errors.name ? formControlErrorClass : ''}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={formFieldLabelClass}>Date of Birth <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={spouseData.dob}
                      onChange={e => setSpouseData({ ...spouseData, dob: e.target.value })}
                      className={`${formControlClass} ${errors.dob ? formControlErrorClass : ''}`}
                    />
                    {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className={formFieldLabelClass}>Date of Marriage <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={spouseData.dateOfMarriage}
                      onChange={e => setSpouseData({ ...spouseData, dateOfMarriage: e.target.value })}
                      className={`${formControlClass} ${errors.dateOfMarriage ? formControlErrorClass : ''}`}
                    />
                    {errors.dateOfMarriage && <p className="text-xs text-red-500 mt-1">{errors.dateOfMarriage}</p>}
                  </div>
                  <div>
                    <label className={formFieldLabelClass}>Gender</label>
                    <select
                      value={spouseData.gender}
                      onChange={e => setSpouseData({ ...spouseData, gender: e.target.value })}
                      className={formControlClass}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={formFieldLabelClass}>
                      Coverage effective date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={spouseData.coverageEffectiveDate}
                      onChange={e => setSpouseData({ ...spouseData, coverageEffectiveDate: e.target.value })}
                      className={`${formControlClass} ${errors.coverageEffectiveDate ? formControlErrorClass : ''}`}
                    />
                    {errors.coverageEffectiveDate && (
                      <p className="text-xs text-red-500 mt-1">{errors.coverageEffectiveDate}</p>
                    )}
                  </div>
                </div>
                </section>

                <section className={updateFormSectionShell.dependents}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>4</div>
                      Spouse coverage (GMC)
                    </h3>
                  </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Match employee GMC stack</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spouseData.samePlansAsEmployee}
                      onChange={e => setSamePlans(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">Same as employee</span>
                  </label>
                </div>
                {spouseData.samePlansAsEmployee ? (
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 space-y-1.5">
                    <p className={formHelperTextClass}>Inherited from employee plans above (GMC — view only)</p>
                    <ul className="text-sm font-medium text-gray-900 list-disc list-inside space-y-0.5">
                      {formatInheritedGmcLines(employeePlansEdit).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <PlanSelection
                    plans={spouseData.plans}
                    onChange={plans => setSpouseData({ ...spouseData, plans })}
                    label="spouse"
                    gmcOnly
                    hideInsuranceHeader
                    hideGmcToggle
                    horizontalGmcLayout
                  />
                )}
                </section>
              </div>
            </div>
            {formCdState && (
              <aside
                className={`${CD_RAIL_WIDTH_CLASS} shrink-0 lg:min-h-0 flex flex-col lg:self-stretch`}
                aria-label="CD balance estimate"
              >
                <div className="flex flex-col flex-1 min-h-0 lg:sticky lg:top-4 lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto overscroll-contain pb-2">
                  <CdBalanceFormWidget
                    cdAfterSubmit={formCdState.cdAfterSubmit}
                    currentCd={formCdState.currentCd}
                    estimatedCdDraw={formCdState.estimatedCdDraw}
                    lines={formCdState.cdBreakdownLines}
                    primaryBatchCount={1}
                    estimateReady={cdEstimateReadyForm}
                  />
                </div>
              </aside>
            )}
          </div>
          <QuickAddBatchStickyFooter
            batchSummary={batchSummary}
            actions={
              <>
                {(premiumFlow === 'fresh' || premiumFlow === 'stale') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (canProceed) setPremiumFlow('calculated')
                    }}
                    disabled={!canProceed}
                    title={
                      !canProceed
                        ? 'Enter spouse details, date of marriage, and coverage effective date'
                        : undefined
                    }
                    className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] ${
                      canProceed
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Calculator size={18} strokeWidth={2.25} aria-hidden />
                    {premiumFlow === 'stale' ? 'Recalculate premium' : 'Calculate premium'}
                  </button>
                )}
                {premiumFlow === 'calculated' && (
                  <button
                    type="button"
                    onClick={handleProceedToSubmit}
                    disabled={formCdState?.cdAfterSubmit < 0}
                    title={
                      formCdState?.cdAfterSubmit < 0
                        ? 'Estimated CD after this change would be negative — adjust cover or recharge CD.'
                        : undefined
                    }
                    className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 flex-shrink-0 min-h-[3rem] ${
                      formCdState?.cdAfterSubmit < 0
                        ? 'text-white/90 bg-indigo-400 cursor-not-allowed shadow-none'
                        : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer'
                    }`}
                  >
                    <Eye size={18} strokeWidth={2.25} aria-hidden /> Proceed to submit
                  </button>
                )}
              </>
            }
          />
        </>
      )}
    </div>
  )
}
