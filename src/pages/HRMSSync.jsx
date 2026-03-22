import { useState } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, Check, X, Settings2,
  User, Users, Shield, CheckCircle, RefreshCw, Search
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlanSelection from '../components/PlanSelection'
import DependentForm from '../components/DependentForm'
import { hrmsJoiningEmployees, hrmsLeavingEmployees } from '../data/mockData'
import { useEndorsements } from '../store/EndorsementStore'

export default function HRMSSync() {
  const { addEntry } = useEndorsements()
  const [activeTab, setActiveTab] = useState('joining')
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState('10 Mar 2026, 09:30 AM')
  const [joiningStates, setJoiningStates] = useState(
    hrmsJoiningEmployees.reduce((acc, emp) => ({ ...acc, [emp.id]: { status: 'pending', managing: false, plans: {}, dependents: [] } }), {})
  )
  const [leavingStates, setLeavingStates] = useState(
    hrmsLeavingEmployees.reduce((acc, emp) => ({
      ...acc,
      [emp.id]: { status: 'pending', cancelParentPolicies: {} }
    }), {})
  )
  const [standalonePopup, setStandalonePopup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const updateJoining = (id, updates) => {
    setJoiningStates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }
  const updateLeaving = (id, updates) => {
    setLeavingStates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setLastSync(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    }, 2000)
  }

  const handleAcceptJoining = (emp) => {
    updateJoining(emp.id, { status: 'approved' })
    addEntry({ action: `HRMS Sync - Accept (${emp.name})`, count: 1, status: 'Success', type: 'sync' })
  }

  const handleRejectJoining = (emp) => {
    updateJoining(emp.id, { status: 'rejected' })
    addEntry({ action: `HRMS Sync - Reject (${emp.name})`, count: 1, status: 'Success', type: 'sync' })
  }

  const handleApproveWithChanges = (emp) => {
    updateJoining(emp.id, { status: 'approved', managing: false })
    addEntry({ action: `HRMS Sync - Accept with changes (${emp.name})`, count: 1, status: 'Success', type: 'sync' })
  }

  const handleApproveLeaving = (emp) => {
    if (emp.hasParentStandalonePolicy) {
      setStandalonePopup(emp)
    } else {
      updateLeaving(emp.id, { status: 'approved' })
      addEntry({ action: `HRMS Sync - Approve leaving (${emp.name})`, count: 1, status: 'Success', type: 'sync' })
    }
  }

  const handleRejectLeaving = (emp) => {
    updateLeaving(emp.id, { status: 'rejected' })
    addEntry({ action: `HRMS Sync - Reject leaving (${emp.name})`, count: 1, status: 'Success', type: 'sync' })
  }

  const confirmApproveLeaving = () => {
    if (standalonePopup) {
      updateLeaving(standalonePopup.id, { status: 'approved' })
      addEntry({ action: `HRMS Sync - Approve leaving (${standalonePopup.name})`, count: 1, status: 'Success', type: 'sync' })
      setStandalonePopup(null)
    }
  }

  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-6">
      <PageHeader
        title="HRMS Sync"
        subtitle="Review and approve employee changes synced from your HRMS"
        breadcrumbs={[{ label: 'HRMS Sync' }]}
      />

      {/* Sync bar */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <TabBtn active={activeTab === 'joining'} onClick={() => setActiveTab('joining')} icon={ArrowDownToLine} label="Joining" count={hrmsJoiningEmployees.length} color="emerald" />
          <TabBtn active={activeTab === 'leaving'} onClick={() => setActiveTab('leaving')} icon={ArrowUpFromLine} label="Leaving" count={hrmsLeavingEmployees.length} color="red" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Last sync: {lastSync}</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 flex-shrink-0 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, ID, department..."
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {activeTab === 'joining' && hrmsJoiningEmployees.filter(emp => {
          if (!searchQuery.trim()) return true
          const q = searchQuery.toLowerCase()
          return emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q)
        }).map(emp => {
          const state = joiningStates[emp.id]
          return (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{emp.id}</span>
                    </div>
                    <p className="text-xs text-gray-500">{emp.email} &middot; {emp.department} &middot; {emp.designation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Joining: {emp.doj}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {state.dependents?.length > 0 && (
                    <span className="text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Users size={10} /> {state.dependents.length} dep{state.dependents.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {state.status === 'pending' && (
                    <>
                      <button onClick={() => updateJoining(emp.id, { managing: !state.managing })} className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-1.5 cursor-pointer">
                        <Settings2 size={13} /> Manage
                      </button>
                      <button onClick={() => handleAcceptJoining(emp)} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer">
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => handleRejectJoining(emp)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-1.5 cursor-pointer">
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  {state.status === 'approved' && <Badge color="emerald" label="Approved" />}
                  {state.status === 'rejected' && <Badge color="red" label="Rejected" />}
                </div>
              </div>
              {state.managing && state.status === 'pending' && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/50 space-y-5">
                  <PlanSelection plans={state.plans} onChange={(plans) => updateJoining(emp.id, { plans })} label={`hrms-${emp.id}`} />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Dependents</h4>
                    <DependentForm
                      dependents={state.dependents}
                      onChange={(deps) => updateJoining(emp.id, { dependents: deps })}
                      employeePlans={state.plans}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <button onClick={() => updateJoining(emp.id, { managing: false })} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                    <button onClick={() => handleApproveWithChanges(emp)} className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer"><Check size={13} /> Approve with Changes</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {activeTab === 'leaving' && hrmsLeavingEmployees.filter(emp => {
          if (!searchQuery.trim()) return true
          const q = searchQuery.toLowerCase()
          return emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q)
        }).map(emp => {
          const state = leavingStates[emp.id]
          return (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{emp.id}</span>
                      </div>
                      <p className="text-xs text-gray-500">{emp.email} &middot; {emp.department} &middot; {emp.designation}</p>
                      <p className="text-xs text-red-500 mt-0.5">Last working day: {emp.lastDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {emp.dependents?.length > 0 && (
                      <span className="text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Users size={10} /> {emp.dependents.length} dep{emp.dependents.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {state.status === 'pending' && (
                      <>
                        <button onClick={() => handleApproveLeaving(emp)} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer">
                          <Check size={13} /> Approve
                        </button>
                        <button onClick={() => handleRejectLeaving(emp)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-1.5 cursor-pointer">
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}
                    {state.status === 'approved' && <Badge color="emerald" label="Approved" />}
                    {state.status === 'rejected' && <Badge color="red" label="Rejected" />}
                  </div>
                </div>

                {emp.dependents.length > 0 && (
                  <div className="mt-3 ml-[52px]">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users size={12} /> Dependents ({emp.dependents.length})
                    </p>
                    <div className="space-y-1.5">
                      {emp.dependents.map((dep, di) => (
                        <div key={di} className="flex items-center justify-between bg-gray-50 rounded-lg px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center"><User size={12} className="text-gray-500" /></div>
                            <div>
                              <p className="text-sm text-gray-800 leading-tight">{dep.name}</p>
                              <p className="text-xs text-gray-500">{dep.relation} &middot; DOB: {dep.dob}</p>
                            </div>
                          </div>
                          {dep.hasStandalonePolicy && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Standalone Policy</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Standalone cancellation popup */}
      {standalonePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setStandalonePopup(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Shield size={16} className="text-amber-600" /></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Standalone Policy Cancellation</h3>
                <p className="text-xs text-gray-500">Review before approving {standalonePopup.name}'s removal</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                This employee has dependents with standalone policies. Would you like to cancel those as well?
              </p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dependents with standalone policies</p>
                {standalonePopup.dependents.filter(d => d.hasStandalonePolicy).map((dep, di) => (
                  <div key={di} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"><User size={11} className="text-gray-500" /></div>
                    {dep.name} <span className="text-gray-400">&middot;</span> <span className="text-gray-500">{dep.relation}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={leavingStates[standalonePopup.id]?.cancelAllStandalone || false}
                  onChange={(e) => {
                    updateLeaving(standalonePopup.id, { cancelAllStandalone: e.target.checked })
                  }}
                  className="accent-amber-600 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Cancel all standalone policies</p>
                  <p className="text-xs text-gray-600">This will cancel standalone policies for all listed dependents above</p>
                </div>
              </label>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setStandalonePopup(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={confirmApproveLeaving} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer">
                <Check size={14} /> Approve Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label, count, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={15} />
      {label}
      <span className={`ml-0.5 px-1.5 py-0.5 text-xs rounded-full font-medium ${
        active ? `bg-${color}-100 text-${color}-700` : 'bg-gray-200 text-gray-600'
      }`}>{count}</span>
    </button>
  )
}

function Badge({ color, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
      color === 'emerald' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
    }`}>
      {color === 'emerald' ? <CheckCircle size={13} /> : <X size={13} />} {label}
    </span>
  )
}
