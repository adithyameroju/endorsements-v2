import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import DependentForm from '../components/DependentForm'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'
import { mergeDemoEmployeePlans } from '../lib/updateFlowPremium'
import {
  formSectionTitleClass,
  formSectionBadgeClass,
  updateFormSectionShell,
} from '../lib/formUi'

export default function AddDependents() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [dependents, setDependents] = useState([])
  const [submitted, setSubmitted] = useState(false)

  const employeePlansForForm = useMemo(
    () => (selectedEmployee ? mergeDemoEmployeePlans(selectedEmployee) : {}),
    [selectedEmployee],
  )

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) ||
    emp.id.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setShowResults(false)
    setQuery(emp.name)
    setDependents([])
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dependents Added</h2>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const stepCurrent = selectedEmployee ? 2 : 1

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8 pt-4 pb-6 overflow-y-auto">
      <PageHeader
        title="Add Dependents"
        subtitle="Add dependents to an existing employee"
        breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Dependents' }]}
        trailing={
          <Stepper steps={['Select Employee', 'Add Dependents', 'Submit']} currentStep={stepCurrent} compact />
        }
      />

      <div className="relative mb-5 max-w-xl">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
          placeholder="Search by name or employee ID..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white"
        />
        {showResults && query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No employees found</div>
            ) : (
              filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => selectEmployee(emp)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-left border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.id} &middot; {emp.department}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <div className="p-6 space-y-4">
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

            <section className={updateFormSectionShell.dependents}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${formSectionTitleClass} flex items-center gap-2.5`}>
                  <div className={`${formSectionBadgeClass} ${dependents.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {dependents.length > 0 ? <CheckCircle size={14} /> : <Users size={14} />}
                  </div>
                  Dependent details
                </h3>
                {dependents.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {dependents.length} added
                  </span>
                )}
              </div>
              <DependentForm
                dependents={dependents}
                onChange={setDependents}
                employeePlans={employeePlansForForm}
                hideSectionTitle
              />
            </section>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
            <button
              type="button"
              onClick={() => {
                addEntry({ action: 'Add Dependents', count: dependents.length, status: 'Success', type: 'quick' })
                setSubmitted(true)
                setTimeout(() => navigate('/'), 2000)
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              <CheckCircle size={16} /> Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
