import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronLeft, Eye, CheckCircle, User, Trash2, ChevronUp, Shield, Users, AlertCircle, UserPlus, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { departments, designations } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

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
  return emp.plans && (emp.plans.gmcBase || emp.plans.gpaBase)
}

function fieldCount(emp) {
  return requiredFields.filter(f => emp[f] && String(emp[f]).trim()).length
}

export default function QuickAdd() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [employees, setEmployees] = useState([emptyEmployee()])
  const [expandedId, setExpandedId] = useState(employees[0].id)
  const [showPreview, setShowPreview] = useState(false)
  const [touchedMap, setTouchedMap] = useState({})
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

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
    setNudgeDismissed(true)
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

  if (showPreview) {
    return (
      <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
        <PageHeader
          title="Review & Submit"
          subtitle="Review all employee details before submitting"
          breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Quick Add', path: '/add/quick' }, { label: 'Preview' }]}
        />
        <Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={2} />
        <button onClick={() => setShowPreview(false)} className="mb-5 inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
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
              {emp.dependents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Dependents ({emp.dependents.length})</p>
                  {emp.dependents.map((dep, di) => <p key={di} className="text-sm text-gray-700">{dep.name} &middot; {dep.relation}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setShowPreview(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Edit</button>
          <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit Endorsement</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-6">
      <div className="flex-shrink-0">
        <PageHeader
          title="Quick Add Employees"
          subtitle="Add up to 5 employees with plan and dependent details"
          breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Quick Add' }]}
        />
        <Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={1} />

        {employees.length === 1 && !nudgeDismissed && (
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl mt-1 mb-1">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-900">You can add up to 5 employees at once</p>
              <p className="text-xs text-indigo-600/70 mt-0.5">Fill in details for one, then use the <span className="font-semibold">+ Add Employee</span> button below to add more.</p>
            </div>
            <button
              onClick={() => setNudgeDismissed(true)}
              className="p-1 text-indigo-400 hover:text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
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
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-6">
                  <section>
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
                  <hr className="border-gray-100" />
                  <section>
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
                  <hr className="border-gray-100" />
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${depsCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {depsCount > 0 ? <CheckCircle size={14} /> : '3'}
                        </div>
                        Dependents
                      </h3>
                      {depsCount > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{depsCount} added</span>}
                    </div>
                    <DependentForm dependents={emp.dependents} onChange={(deps) => updateEmployeeDeps(idx, deps)} />
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

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{employees.length} employee{employees.length > 1 ? 's' : ''} added</span>
          {employees.length < 5 && (
            <button
              onClick={addEmployee}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
            >
              <UserPlus size={13} /> Add Employee
              <span className="text-indigo-400 font-normal">({employees.length}/5)</span>
            </button>
          )}
        </div>
        <button onClick={handlePreview} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><Eye size={16} /> Preview & Submit</button>
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
