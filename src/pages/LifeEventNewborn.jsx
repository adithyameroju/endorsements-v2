import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import { mockEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

export default function LifeEventNewborn() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [childData, setChildData] = useState({ name: '', dob: '', gender: '', plans: {} })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) || emp.id.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setShowResults(false)
    setQuery(emp.name)
  }

  const validate = () => {
    const e = {}
    if (!childData.name.trim()) e.name = 'Child name is required'
    if (!childData.dob) e.dob = 'Date of birth is required'
    if (!childData.gender) e.gender = 'Gender is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    addEntry({ action: 'Life Event - Add Newborn', count: 1, status: 'Success', type: 'quick' })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div><h2 className="text-xl font-bold text-gray-900 mb-2">Newborn Added</h2><p className="text-sm text-gray-500">Redirecting...</p></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader title="Add Newborn" subtitle="Register a new child for an employee" breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Newborn' }]} />
      <Stepper steps={['Select Employee', 'Child Details & Plans', 'Submit']} currentStep={selectedEmployee ? 2 : 1} />

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
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><User size={18} className="text-amber-600" /></div>
            <div><p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p><p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.department}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Child Name <span className="text-red-500">*</span></label>
              <input type="text" value={childData.name} onChange={e => setChildData({ ...childData, name: e.target.value })} placeholder="Full name"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.name ? 'border-red-300' : 'border-gray-200'}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" value={childData.dob} onChange={e => setChildData({ ...childData, dob: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.dob ? 'border-red-300' : 'border-gray-200'}`} />
              {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
              <select value={childData.gender} onChange={e => setChildData({ ...childData, gender: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.gender ? 'border-red-300' : 'border-gray-200'}`}>
                <option value="">Select gender</option><option>Male</option><option>Female</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Child Insurance Plans</h4>
            <PlanSelection plans={childData.plans} onChange={plans => setChildData({ ...childData, plans })} label="newborn" />
          </div>
          <div className="flex justify-end pt-3">
            <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit</button>
          </div>
        </div>
      )}
    </div>
  )
}
