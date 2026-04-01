import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle, Sparkles, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import QuickAddBatchStickyFooter from '../components/QuickAddBatchStickyFooter'
import UpdateFlowReviewScreen from '../components/UpdateFlowReviewScreen'
import { mockEmployees, departments, designations } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'
import { cloneEmployeeGmcPlans } from '../lib/planHelpers'
import {
  mergeDemoEmployeePlans,
  buildQuickUpdatePremiumEmployees,
  buildQuickUpdateCdBaselineEmployee,
} from '../lib/updateFlowPremium'
import { formSectionTitleClass, formSectionBadgeClass, updateFormSectionShell, formFieldLabelClass, formControlClass } from '../lib/formUi'
import { quickUpdateBatchSummary } from '../lib/updateFlowBatchSummary'

export default function QuickUpdate() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) ||
    emp.id.toLowerCase().includes(query.toLowerCase()) ||
    emp.email.toLowerCase().includes(query.toLowerCase())
  )

  const batchSummary = useMemo(() => quickUpdateBatchSummary(formData), [formData])
  const canProceed = batchSummary.basicsComplete === 1

  const reviewPremiumEmployees = useMemo(() => {
    if (!showPreview || !formData) return []
    return buildQuickUpdatePremiumEmployees(formData)
  }, [showPreview, formData])

  const reviewCdBaseline = useMemo(() => {
    if (!showPreview || !selectedEmployee || !formData) return undefined
    return [buildQuickUpdateCdBaselineEmployee(formData, selectedEmployee)]
  }, [showPreview, selectedEmployee, formData])

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    const merged = mergeDemoEmployeePlans(emp)
    const last = (emp.name.split(' ').slice(1).join(' ') || 'Kumar')
    setFormData({
      ...emp,
      empId: emp.id,
      plans: merged,
      dependents: [
        {
          id: `dep-${emp.id}-initial`,
          name: `Lakshmi ${last}`.trim(),
          relation: 'Spouse',
          dob: '1993-05-20',
          gender: 'Female',
          samePlansAsEmployee: true,
          plans: cloneEmployeeGmcPlans(merged),
        },
      ],
    })
    setShowResults(false)
    setShowPreview(false)
    setQuery(emp.name)
  }

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const prefillData = () => {
    if (!formData || !selectedEmployee) return
    const merged = mergeDemoEmployeePlans(selectedEmployee)
    const plans = {
      ...merged,
      gmcBasePlan: 'bp2',
      gmcSecondaryPlan: 'sp1',
      gmcAddons: ['ap1', 'ap3'],
      gpaBasePlan: 'gpa-bp2',
      gpaSiType: 'fixed',
    }
    const first = formData.name?.split(' ')[0] || 'Employee'
    setFormData({
      ...formData,
      dob: formData.dob || '1990-05-15',
      doj: formData.doj || '2023-01-10',
      mobile: formData.mobile || '9876543210',
      plans,
      dependents: [
        {
          id: `dep-${selectedEmployee.id}-prefill`,
          name: `Priya ${first}`,
          relation: 'Spouse',
          dob: '1992-08-20',
          gender: 'Female',
          samePlansAsEmployee: true,
          plans: cloneEmployeeGmcPlans(plans),
        },
      ],
    })
  }

  const handleSubmit = () => {
    const details = selectedEmployee ? [{
      name: selectedEmployee.name,
      id: selectedEmployee.id,
      department: selectedEmployee.department,
      designation: selectedEmployee.designation,
    }] : []
    addEntry({ action: 'Update Employee', count: 1, status: 'Success', type: 'quick', details })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Update Submitted</h2>
          <p className="text-sm text-gray-500 mb-1">The changes have been recorded and will appear in the Endorsement History.</p>
          <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (showPreview && formData) {
    return (
      <UpdateFlowReviewScreen
        title="Review & Submit"
        subtitle="Confirm details and CD impact before you submit"
        breadcrumbs={[
          { label: 'Update Employee', path: '/update' },
          { label: 'Quick Update', onClick: () => setShowPreview(false) },
          { label: 'Preview' },
        ]}
        stepperSteps={['Search Employee', 'Edit Details', 'Preview & Submit']}
        stepperCurrentStep={3}
        employees={reviewPremiumEmployees}
        batchSummary={batchSummary}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        submitLabel="Submit Endorsement"
        cdFlow="quick-update"
        cdBaselineEmployees={reviewCdBaseline}
      />
    )
  }

  const stepCurrent = !selectedEmployee ? 1 : 2

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8 pt-4 pb-0">
      <div className="flex-shrink-0">
        <PageHeader
          title="Quick Update"
          subtitle="Search for an employee — update details or add dependents"
          breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Quick Update' }]}
          trailing={
            <Stepper steps={['Search Employee', 'Edit Details', 'Preview & Submit']} currentStep={stepCurrent} compact />
          }
          navTrailing={
            formData ? (
              <button
                type="button"
                onClick={prefillData}
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
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              placeholder="Search by name, employee ID, or email..."
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
                    onClick={() => selectEmployee(emp)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.id} &middot; {emp.email} &middot; {emp.department}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {formData && (
        <>
          <div className="flex-1 min-h-0 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4">
                <section className={updateFormSectionShell.basic}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>1</div>
                      Employee Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">
                    <Field label="Full Name" value={formData.name} onChange={v => updateField('name', v)} />
                    <Field label="Employee ID" value={formData.id} onChange={v => updateField('id', v)} disabled />
                    <Field label="Email" value={formData.email} onChange={v => updateField('email', v)} />
                    <Field label="Date of Birth" type="date" value={formData.dob} onChange={v => updateField('dob', v)} />
                    <SelectField label="Designation" value={formData.designation} onChange={v => updateField('designation', v)} options={designations} />
                    <SelectField label="Gender" value={formData.gender} onChange={v => updateField('gender', v)} options={['Male', 'Female', 'Other']} />
                    <SelectField label="Department" value={formData.department} onChange={v => updateField('department', v)} options={departments} />
                    <Field label="Date of Joining" type="date" value={formData.doj} onChange={v => updateField('doj', v)} />
                    <Field label="Mobile Number" value={formData.mobile} onChange={v => updateField('mobile', v)} />
                  </div>
                </section>

                <section className={updateFormSectionShell.plans}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} bg-indigo-100 text-indigo-600`}>2</div>
                      Insurance Plans <span className="text-red-500 font-semibold">*</span>
                    </h3>
                  </div>
                  <PlanSelection plans={formData.plans} onChange={(plans) => updateField('plans', plans)} label="update-emp" hideInsuranceHeader />
                </section>

                <section className={updateFormSectionShell.dependents}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                      <div className={`${formSectionBadgeClass} ${formData.dependents?.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {formData.dependents?.length > 0 ? <CheckCircle size={14} /> : <Users size={14} />}
                      </div>
                      Dependents
                    </h3>
                    {formData.dependents?.length > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {formData.dependents.length} added
                      </span>
                    )}
                  </div>
                  <DependentForm dependents={formData.dependents} onChange={(deps) => updateField('dependents', deps)} employeePlans={formData.plans} hideSectionTitle />
                </section>
              </div>
            </div>
          </div>
          <QuickAddBatchStickyFooter
            batchSummary={batchSummary}
            actions={
              <button
                type="button"
                onClick={() => canProceed && setShowPreview(true)}
                disabled={!canProceed}
                title={!canProceed ? 'Complete employee name, email, DOB, gender, and date of joining' : undefined}
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

function Field({ label, type = 'text', value, onChange, disabled }) {
  return (
    <div>
      <label className={formFieldLabelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${formControlClass} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className={formFieldLabelClass}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={formControlClass}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
