import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle, Plus, Trash2, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import QuickAddBatchStickyFooter from '../components/QuickAddBatchStickyFooter'
import UpdateFlowReviewScreen from '../components/UpdateFlowReviewScreen'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'
import { cloneEmployeeGmcPlans, formatInheritedGmcLines } from '../lib/planHelpers'
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
  buildNewbornFlowPremiumEmployees,
  buildLifeEventCdBaselineEmployee,
} from '../lib/updateFlowPremium'
import { newbornFlowBatchSummary } from '../lib/updateFlowBatchSummary'

function createEmptyChild(empId, index) {
  return {
    id: `new-${empId}-child-${index}`,
    name: '',
    dob: '',
    gender: '',
    samePlansAsEmployee: true,
    plans: {},
  }
}

export default function LifeEventNewborn() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [children, setChildren] = useState([])
  const [employeePlansEdit, setEmployeePlansEdit] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const batchSummary = useMemo(
    () => newbornFlowBatchSummary(selectedEmployee, children),
    [selectedEmployee, children],
  )
  const canProceed = batchSummary.basicsComplete === 1

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) || emp.id.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setEmployeePlansEdit(mergeDemoEmployeePlans(emp))
    setChildren([createEmptyChild(emp.id, 1)])
    setShowResults(false)
    setShowPreview(false)
    setQuery(emp.name)
  }

  const updateChild = (index, field, value) => {
    const updated = [...children]
    updated[index] = { ...updated[index], [field]: value }
    setChildren(updated)
  }

  const addChild = () => {
    if (children.length >= 2 || !selectedEmployee) return
    setChildren([...children, createEmptyChild(selectedEmployee.id, children.length + 1)])
  }

  const removeChild = (index) => {
    if (children.length <= 1) return
    setChildren(children.filter((_, i) => i !== index))
  }

  const setSamePlans = (index, same) => {
    const ep = employeePlansEdit || mergeDemoEmployeePlans(selectedEmployee)
    const updated = [...children]
    updated[index] = {
      ...updated[index],
      samePlansAsEmployee: same,
      plans: same ? cloneEmployeeGmcPlans(ep) : { gmcBasePlan: ep.gmcBasePlan || '' },
    }
    setChildren(updated)
  }

  const prefillChildren = () => {
    if (!selectedEmployee || !employeePlansEdit) return
    const base = selectedEmployee.name?.split(' ')[0] || 'Child'
    setChildren([
      {
        id: `new-${selectedEmployee.id}-child-prefill`,
        name: `${base} Jr.`,
        dob: '2025-11-08',
        gender: 'Male',
        samePlansAsEmployee: true,
        plans: cloneEmployeeGmcPlans(employeePlansEdit),
      },
    ])
  }

  const validChildrenCount = useMemo(
    () => children.filter((c) => c.name?.trim() && c.dob && c.gender).length,
    [children],
  )

  const reviewPremiumEmployees = useMemo(() => {
    if (!showPreview || !selectedEmployee) return []
    return buildNewbornFlowPremiumEmployees(
      selectedEmployee,
      children,
      employeePlansEdit ?? mergeDemoEmployeePlans(selectedEmployee),
    )
  }, [showPreview, selectedEmployee, children, employeePlansEdit])

  const reviewCdBaseline = useMemo(() => {
    if (!showPreview || !selectedEmployee) return undefined
    return [buildLifeEventCdBaselineEmployee(selectedEmployee)]
  }, [showPreview, selectedEmployee])

  const validate = () => {
    const e = {}
    children.forEach((child, i) => {
      if (!child.name.trim()) e[`name_${i}`] = 'Child name is required'
      if (!child.dob) e[`dob_${i}`] = 'Date of birth is required'
      if (!child.gender) e[`gender_${i}`] = 'Gender is required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleProceedToSubmit = () => {
    if (!validate()) return
    setShowPreview(true)
  }

  const handleSubmit = () => {
    if (!validate()) return
    addEntry({ action: 'Life Event - Add Newborn', count: children.length, status: 'Success', type: 'quick' })
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Newborn{children.length > 1 ? 's' : ''} Added</h2>
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
          { label: 'Add Newborn', onClick: () => setShowPreview(false) },
          { label: 'Preview' },
        ]}
        stepperSteps={['Select Employee', 'Child Details & Plans', 'Preview & Submit']}
        stepperCurrentStep={3}
        employees={reviewPremiumEmployees}
        batchSummary={batchSummary}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        submitLabel="Submit Endorsement"
        cdFlow="add-newborn"
        cdFlowMeta={{ childrenCount: validChildrenCount }}
        cdBaselineEmployees={reviewCdBaseline}
      />
    )
  }

  const stepCurrent = selectedEmployee ? 2 : 1

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8 pt-4 pb-0">
      <div className="flex-shrink-0">
        <PageHeader
          title="Add Newborn"
          subtitle="Register up to 2 children for an employee"
          breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Newborn' }]}
          trailing={
            <Stepper steps={['Select Employee', 'Child Details & Plans', 'Preview & Submit']} currentStep={stepCurrent} compact />
          }
          navTrailing={
            selectedEmployee ? (
              <button
                type="button"
                onClick={prefillChildren}
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
                      <p className="text-xs text-gray-500 truncate">{emp.id} &middot; {emp.department}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && employeePlansEdit && children.length > 0 && (
        <>
          <div className="flex-1 min-h-0 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden flex flex-col">
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
                      <p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.department}</p>
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
                    label="life-newborn-emp"
                    hideInsuranceHeader
                  />
                </section>

              {children.map((child, idx) => (
                <div key={child.id} className="space-y-4">
                  <section className={updateFormSectionShell.dependents}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                        <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>
                          {3 + idx}
                        </div>
                        Child {idx + 1} · Details
                      </h3>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                      <div>
                        <label className={formFieldLabelClass}>Child Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={e => updateChild(idx, 'name', e.target.value)}
                          placeholder="Full name"
                          className={`${formControlClass} ${errors[`name_${idx}`] ? formControlErrorClass : ''}`}
                        />
                        {errors[`name_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`name_${idx}`]}</p>}
                      </div>
                      <div>
                        <label className={formFieldLabelClass}>Date of Birth <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={child.dob}
                          onChange={e => updateChild(idx, 'dob', e.target.value)}
                          className={`${formControlClass} ${errors[`dob_${idx}`] ? formControlErrorClass : ''}`}
                        />
                        {errors[`dob_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`dob_${idx}`]}</p>}
                      </div>
                      <div>
                        <label className={formFieldLabelClass}>Gender <span className="text-red-500">*</span></label>
                        <select
                          value={child.gender}
                          onChange={e => updateChild(idx, 'gender', e.target.value)}
                          className={`${formControlClass} ${errors[`gender_${idx}`] ? formControlErrorClass : ''}`}
                        >
                          <option value="">Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                        {errors[`gender_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`gender_${idx}`]}</p>}
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Child {idx + 1} GMC</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={child.samePlansAsEmployee}
                          onChange={e => setSamePlans(idx, e.target.checked)}
                          className="accent-indigo-600 w-4 h-4 rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Same as employee</span>
                      </label>
                    </div>
                    {child.samePlansAsEmployee ? (
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
                        plans={child.plans}
                        onChange={plans => updateChild(idx, 'plans', plans)}
                        label={`newborn-${idx}`}
                        gmcOnly
                        hideInsuranceHeader
                        hideGmcToggle
                        horizontalGmcLayout
                      />
                    )}
                    </div>
                  </section>
                </div>
              ))}

              {children.length < 2 && (
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Plus size={14} className="group-hover:text-indigo-600" />
                  </div>
                  Add Child 2
                </button>
              )}

              </div>
            </div>
          </div>
          <QuickAddBatchStickyFooter
            batchSummary={batchSummary}
            actions={
              <button
                type="button"
                onClick={handleProceedToSubmit}
                disabled={!canProceed}
                title={!canProceed ? 'Enter each child’s name, date of birth, and gender' : undefined}
                className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 flex-shrink-0 min-h-[3rem] ${
                  canProceed
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed shadow-none'
                }`}
              >
                Proceed to submit
              </button>
            }
          />
        </>
      )}
    </div>
  )
}
