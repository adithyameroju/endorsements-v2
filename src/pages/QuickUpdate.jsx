import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { mockEmployees, departments, designations } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

export default function QuickUpdate() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) ||
    emp.id.toLowerCase().includes(query.toLowerCase()) ||
    emp.email.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setFormData({
      ...emp,
      plans: {},
      dependents: [
        { id: 1, name: 'Lakshmi ' + emp.name.split(' ')[1], relation: 'Spouse', dob: '1993-05-20', gender: 'Female', plans: {} },
      ],
    })
    setShowResults(false)
    setQuery(emp.name)
  }

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
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

  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-6">
      <div className="flex-shrink-0">
        <PageHeader title="Quick Update" subtitle="Search for an employee — update details or add dependents" breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Quick Update' }]} />
        <Stepper steps={['Search Employee', 'Edit Details', 'Submit']} currentStep={selectedEmployee ? (submitted ? 3 : 2) : 1} />

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
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2.5">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">1</div>
                Employee Details
              </h3>
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

            <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2.5">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">2</div>
                Insurance Plans
              </h3>
              <PlanSelection plans={formData.plans} onChange={(plans) => updateField('plans', plans)} label="update-emp" />
            </section>

            <section className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2.5">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">3</div>
                Dependents
              </h3>
              <DependentForm dependents={formData.dependents} onChange={(deps) => updateField('dependents', deps)} employeePlans={formData.plans} />
            </section>
          </div>

          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
            <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer">
              <CheckCircle size={16} /> Submit Update
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
