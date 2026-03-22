import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, CheckCircle, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import PlanSelection from '../components/PlanSelection'
import { mockEmployees, basePlans, secondaryPlans, addonPlans } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

const emptyChild = (num) => ({ id: Date.now() + num, name: '', dob: '', gender: '', samePlansAsEmployee: true, plans: {} })

export default function LifeEventNewborn() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [children, setChildren] = useState([emptyChild(1)])
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  // Mock employee plans for demo
  const mockEmployeePlans = {
    gmcBasePlan: 'bp2', // Base Plan - 5L
    gmcSecondaryPlan: 'sp1', // Secondary Plan - 2L  
    gmcAddons: ['ap1', 'ap3'], // Dental & Vision, OPD
    gpaBasePlan: 'gpa-bp2', // GPA Base - 10L
    gpaSiType: 'fixed'
  }

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(query.toLowerCase()) || emp.id.toLowerCase().includes(query.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp)
    setShowResults(false)
    setQuery(emp.name)
  }

  const updateChild = (index, field, value) => {
    const updated = [...children]
    updated[index] = { ...updated[index], [field]: value }
    setChildren(updated)
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

  const addChild = () => {
    if (children.length >= 2) return
    setChildren([...children, emptyChild(children.length + 1)])
  }

  const removeChild = (index) => {
    if (children.length <= 1) return
    setChildren(children.filter((_, i) => i !== index))
  }

  const setSamePlans = (index, same) => {
    const updated = [...children]
    updated[index] = {
      ...updated[index],
      samePlansAsEmployee: same,
      plans: same ? {} : { gmcBasePlan: mockEmployeePlans.gmcBasePlan || '' }
    }
    setChildren(updated)
  }

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

  const handleSubmit = () => {
    if (!validate()) return
    addEntry({ action: 'Life Event - Add Newborn', count: children.length, status: 'Success', type: 'quick' })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div><h2 className="text-xl font-bold text-gray-900 mb-2">Newborn{children.length > 1 ? 's' : ''} Added</h2><p className="text-sm text-gray-500">Redirecting...</p></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader title="Add Newborn" subtitle="Register up to 2 children for an employee" breadcrumbs={[{ label: 'Update Employee', path: '/update' }, { label: 'Add Newborn' }]} />
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><User size={18} className="text-amber-600" /></div>
            <div><p className="text-sm font-semibold text-gray-900">{selectedEmployee.name}</p><p className="text-xs text-gray-500">{selectedEmployee.id} &middot; {selectedEmployee.department}</p></div>
          </div>
          
          {/* Employee's Current Plans */}
          <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/60">
            <p className="text-xs font-semibold text-blue-700/70 uppercase tracking-wider mb-2">Employee's Current Plans</p>
            <p className="text-sm text-gray-900">{formatEmployeeGmcOnly(mockEmployeePlans)}</p>
          </div>

          {children.map((child, idx) => (
            <div key={child.id} className="space-y-4">
              <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider">Child {idx + 1} Details</p>
                  {children.length > 1 && (
                    <button type="button" onClick={() => removeChild(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Child Name <span className="text-red-500">*</span></label>
                    <input type="text" value={child.name} onChange={e => updateChild(idx, 'name', e.target.value)} placeholder="Full name"
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors[`name_${idx}`] ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors[`name_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`name_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" value={child.dob} onChange={e => updateChild(idx, 'dob', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors[`dob_${idx}`] ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors[`dob_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`dob_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                    <select value={child.gender} onChange={e => updateChild(idx, 'gender', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${errors[`gender_${idx}`] ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value="">Select gender</option><option>Male</option><option>Female</option>
                    </select>
                    {errors[`gender_${idx}`] && <p className="text-xs text-red-500 mt-1">{errors[`gender_${idx}`]}</p>}
                  </div>
                </div>
              </div>
              <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider">Child {idx + 1} Insurance Plans</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={child.samePlansAsEmployee}
                      onChange={e => setSamePlans(idx, e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                    <span className="text-xs font-medium text-gray-700">Same as employee</span>
                  </label>
                </div>
                {child.samePlansAsEmployee ? (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Same as employee (view only)</p>
                    <p className="text-sm font-medium text-gray-900">{formatEmployeeGmcOnly(mockEmployeePlans)}</p>
                  </div>
                ) : (
                  <PlanSelection plans={child.plans} onChange={plans => updateChild(idx, 'plans', plans)} label={`newborn-${idx}`} gmcOnly hideInsuranceHeader hideGmcToggle />
                )}
              </div>
            </div>
          ))}

          {children.length < 2 && (
            <button type="button" onClick={addChild}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Plus size={14} className="group-hover:text-indigo-600" />
              </div>
              Add Child 2
            </button>
          )}

          <div className="flex justify-end pt-3">
            <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"><CheckCircle size={16} /> Submit</button>
          </div>
        </div>
      )}
    </div>
  )
}
