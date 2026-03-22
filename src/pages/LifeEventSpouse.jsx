import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import { mockEmployees, basePlans, secondaryPlans, addonPlans } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

export default function LifeEventSpouse() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [spouseData, setSpouseData] = useState({ name: '', dob: '', gender: 'Female', dateOfMarriage: '', samePlansAsEmployee: true, plans: {} })
  
  // Mock employee plans for demo
  const mockEmployeePlans = {
    gmcBasePlan: 'bp2', // Base Plan - 5L
    gmcSecondaryPlan: 'sp1', // Secondary Plan - 2L  
    gmcAddons: ['ap1', 'ap3'], // Dental & Vision, OPD
    gpaBasePlan: 'gpa-bp2', // GPA Base - 10L
    gpaSiType: 'fixed'
  }
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

  const formatEmployeeGmcOnly = (plans) => {
    const parts = []
    const gmcBase = basePlans.find(p => p.id === plans.gmcBasePlan)
    if (gmcBase) parts.push(`GMC: ${gmcBase.name}`)
    
    const gmcSecondary = secondaryPlans.find(p => p.id === plans.gmcSecondaryPlan)
    if (gmcSecondary) parts.push(`Secondary: ${gmcSecondary.name}`)
    
    if (plans.gmcAddons?.length) {
      const addons = addonPlans.filter(p => plans.gmcAddons.includes(p.id)).map(p => p.name)
      if (addons.length) parts.push(`Add-ons: ${addons.join(', ')}`)
    }
    
    return parts.join(' • ') || 'No GMC plan configured'
  }

  const setSamePlans = (same) => {
    setSpouseData({
      ...spouseData,
      samePlansAsEmployee: same,
      plans: same ? {} : { gmcBasePlan: mockEmployeePlans.gmcBasePlan || '' }
    })
  }

  const validate = () => {
    const e = {}
    if (!spouseData.name.trim()) e.name = 'Spouse name is required'
    if (!spouseData.dob) e.dob = 'Date of birth is required'
    if (!spouseData.dateOfMarriage) e.dateOfMarriage = 'Date of marriage is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    addEntry({ action: 'Life Event - Add Spouse', count: 1, status: 'Success', type: 'quick' })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div><h2 className="text-xl font-bold text-gray-900 mb-2">Spouse Added</h2><p className="text-sm text-gray-500">Redirecting...</p></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader title="Add Spouse" subtitle="Register a spouse for an employee" breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Spouse' }]} />
      <Stepper steps={['Select Employee', 'Spouse Details & Plans', 'Submit']} currentStep={selectedEmployee ? 2 : 1} />

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
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center"><User size={18} className="text-pink-600" /></div>
            <div><p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p><p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.department}</p></div>
          </div>
          
          {/* Employee's Current Plans */}
          <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/60">
            <p className="text-xs font-semibold text-blue-700/70 uppercase tracking-wider mb-2">Employee's Current Plans</p>
            <p className="text-sm text-gray-900">{formatEmployeeGmcOnly(mockEmployeePlans)}</p>
          </div>
          <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
            <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider mb-3">Spouse Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Spouse Name <span className="text-red-500">*</span></label>
                <input type="text" value={spouseData.name} onChange={e => setSpouseData({ ...spouseData, name: e.target.value })} placeholder="Full name"
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.name ? 'border-red-300' : 'border-gray-200'}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" value={spouseData.dob} onChange={e => setSpouseData({ ...spouseData, dob: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.dob ? 'border-red-300' : 'border-gray-200'}`} />
                {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Marriage <span className="text-red-500">*</span></label>
                <input type="date" value={spouseData.dateOfMarriage} onChange={e => setSpouseData({ ...spouseData, dateOfMarriage: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors.dateOfMarriage ? 'border-red-300' : 'border-gray-200'}`} />
                {errors.dateOfMarriage && <p className="text-xs text-red-500 mt-1">{errors.dateOfMarriage}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
                <select value={spouseData.gender} onChange={e => setSpouseData({ ...spouseData, gender: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider">Spouse Insurance Plans</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spouseData.samePlansAsEmployee}
                  onChange={e => setSamePlans(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 rounded"
                />
                <span className="text-xs font-medium text-gray-700">Same as employee</span>
              </label>
            </div>
            {spouseData.samePlansAsEmployee ? (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Same as employee (view only)</p>
                <p className="text-sm font-medium text-gray-900">{formatEmployeeGmcOnly(mockEmployeePlans)}</p>
              </div>
            ) : (
              <PlanSelection plans={spouseData.plans} onChange={plans => setSpouseData({ ...spouseData, plans })} label="spouse" hideInsuranceHeader />
            )}
          </div>
          <div className="flex justify-end pt-3">
            <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit</button>
          </div>
        </div>
      )}
    </div>
  )
}
