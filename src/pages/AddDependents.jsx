import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import DependentForm from '../components/DependentForm'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

export default function AddDependents() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [dependents, setDependents] = useState([])
  const [submitted, setSubmitted] = useState(false)

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

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader title="Add Dependents" subtitle="Add dependents to an existing employee" breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Dependents' }]} />
      <Stepper steps={['Select Employee', 'Add Dependents', 'Submit']} currentStep={selectedEmployee ? 2 : 1} />

      <div className="relative mb-5 max-w-xl">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" value={query} onChange={e => { setQuery(e.target.value); setShowResults(true) }} onFocus={() => setShowResults(true)} placeholder="Search employee..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white" />
        {showResults && query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
            {filteredEmployees.map(emp => (
              <button key={emp.id} onClick={() => selectEmployee(emp)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-left border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><User size={14} className="text-indigo-600" /></div>
                <div><p className="text-sm font-medium text-gray-900">{emp.name}</p><p className="text-xs text-gray-500">{emp.id}</p></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center"><User size={18} className="text-indigo-600" /></div>
            <div><p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p><p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.department}</p></div>
          </div>
          <DependentForm dependents={dependents} onChange={setDependents} />
          <div className="flex justify-end mt-5">
            <button onClick={() => { addEntry({ action: 'Add Dependents', count: dependents.length, status: 'Success', type: 'quick' }); setSubmitted(true); setTimeout(() => navigate('/'), 2000) }} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit</button>
          </div>
        </div>
      )}
    </div>
  )
}
