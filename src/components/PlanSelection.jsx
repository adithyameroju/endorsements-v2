import { Plus, X, Heart, Shield } from 'lucide-react'
import { basePlans, secondaryPlans, addonPlans, topupPlans, gpaBasePlans } from '../data/mockData'

export default function PlanSelection({ plans, onChange, label = '', gmcOnly = false, hideInsuranceHeader = false, hideGmcToggle = false }) {
  const updatePlans = (key, value) => {
    onChange({ ...plans, [key]: value })
  }

  const gmcEnabled = !!(plans.gmcBasePlan)
  const gpaEnabled = !!(plans.gpaBasePlan)
  /** Dependents: no GMC on/off row — always show configure UI */
  const showGmcConfigure = hideGmcToggle || gmcEnabled

  const toggleGMC = (enabled) => {
    if (enabled) {
      updatePlans('gmcBasePlan', basePlans[0].id)
    } else {
      const newPlans = { ...plans }
      delete newPlans.gmcBasePlan
      delete newPlans.gmcSecondaryPlan
      delete newPlans.gmcTopup
      delete newPlans.gmcAddons
      onChange(newPlans)
    }
  }

  const toggleGPA = (enabled) => {
    if (enabled) {
      // Single merge — two updatePlans() calls used stale `plans` and dropped gpaBasePlan
      onChange({
        ...plans,
        gpaBasePlan: gpaBasePlans[0].id,
        gpaSiType: 'fixed',
      })
    } else {
      const newPlans = { ...plans }
      delete newPlans.gpaBasePlan
      delete newPlans.gpaSiType
      delete newPlans.gpaCtc
      delete newPlans.gpaManualSi
      onChange(newPlans)
    }
  }

  return (
    <div className={hideInsuranceHeader ? '' : 'space-y-6'}>
      {/* Header — omitted for dependents when custom GMC is selected */}
      {!hideInsuranceHeader && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Insurance Plans <span className="text-red-500">*</span></h3>
          <p className="text-xs text-gray-500">Toggle on the plans you want to enroll this employee in</p>
        </div>
      )}

      <div className={gmcOnly ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        {/* GMC Section - Combined Container */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          {/* GMC header: toggle (employees) or static title (dependents custom GMC) */}
          {hideGmcToggle ? (
            <div className="flex items-center gap-2.5 p-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Heart size={16} className="text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">GMC</span>
                <p className="text-xs text-gray-500">Group Medical Coverage — configure plan for this dependent</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Heart size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900">GMC</span>
                  <p className="text-xs text-gray-500">Comprehensive medical insurance for hospitalization, OPD & more</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gmcEnabled}
                  onChange={e => toggleGMC(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* GMC Options */}
          {showGmcConfigure && (
            <div className="border-t border-gray-100 p-4 bg-blue-50/20 space-y-3">
              <div className="mb-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">CONFIGURE GMC PLANS</p>
              </div>
              
              {/* Base plan - mandatory dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base Plan <span className="text-red-500">*</span></label>
                <select
                  value={plans.gmcBasePlan || ''}
                  onChange={e => updatePlans('gmcBasePlan', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Select base plan</option>
                  {basePlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.sumInsured)}</option>)}
                </select>
              </div>

              {/* Optional add-ons - toggle to add */}
              <div className="space-y-2">
                <OptionalPlan
                  label="Top-up Plan"
                  active={plans.gmcTopup && plans.gmcTopup !== 'none'}
                  onToggle={(on) => updatePlans('gmcTopup', on ? topupPlans[0].id : 'none')}
                >
                  <select
                    value={plans.gmcTopup || ''}
                    onChange={e => updatePlans('gmcTopup', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                  >
                    {topupPlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.sumInsured)}</option>)}
                  </select>
                </OptionalPlan>

                <OptionalPlan
                  label="Add-on Plan"
                  active={(plans.gmcAddons || []).length > 0}
                  onToggle={(on) => updatePlans('gmcAddons', on ? [addonPlans[0].id] : [])}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {addonPlans.map(p => {
                      const sel = (plans.gmcAddons || []).includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const cur = plans.gmcAddons || []
                            updatePlans('gmcAddons', sel ? cur.filter(a => a !== p.id) : [...cur, p.id])
                          }}
                          className={`px-2.5 py-1 text-xs rounded-full border cursor-pointer transition-all ${
                            sel ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {sel ? '✓ ' : ''}{p.name}
                        </button>
                      )
                    })}
                  </div>
                </OptionalPlan>

                <OptionalPlan
                  label="Secondary Plan"
                  active={plans.gmcSecondaryPlan && plans.gmcSecondaryPlan !== 'none'}
                  onToggle={(on) => updatePlans('gmcSecondaryPlan', on ? secondaryPlans[0].id : 'none')}
                >
                  <select
                    value={plans.gmcSecondaryPlan || ''}
                    onChange={e => updatePlans('gmcSecondaryPlan', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                  >
                    {secondaryPlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.sumInsured)}</option>)}
                  </select>
                </OptionalPlan>
              </div>
            </div>
          )}
        </div>

      {/* GPA Section - Combined Container - hidden when gmcOnly (e.g. dependents) */}
      {!gmcOnly && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          {/* GPA Toggle Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-red-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">GPA</span>
                <p className="text-xs text-gray-500">Accidental death and disability coverage</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gpaEnabled}
                onChange={e => toggleGPA(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* GPA Options */}
          {gpaEnabled && (
            <div className="border-t border-gray-100 p-4 bg-red-50/20 space-y-3">
              <div className="mb-3">
                <p className="text-xs font-semibold text-red-700 mb-2">CONFIGURE GPA PLAN</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base Plan <span className="text-red-500">*</span></label>
                <select
                  value={plans.gpaBasePlan || ''}
                  onChange={e => updatePlans('gpaBasePlan', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Select base plan</option>
                  {gpaBasePlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.sumInsured)}</option>)}
                </select>
              </div>

              {plans.gpaBasePlan && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sum Insured Method <span className="text-red-500">*</span></label>
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'fixed' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'fixed'} onChange={() => updatePlans('gpaSiType', 'fixed')} className="accent-red-600" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">Fixed Sum Insured</span>
                        {plans.gpaSiType === 'fixed' && (
                          <span className="ml-2 text-xs text-red-600 font-medium">
                            {fmt(gpaBasePlans.find(p => p.id === plans.gpaBasePlan)?.sumInsured || 0)}
                          </span>
                        )}
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'ctc' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'ctc'} onChange={() => updatePlans('gpaSiType', 'ctc')} className="accent-red-600" />
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900">Based on CTC</span>
                        {plans.gpaSiType === 'ctc' && (
                          <input
                            type="number"
                            placeholder="Enter CTC"
                            value={plans.gpaCtc || ''}
                            onChange={e => updatePlans('gpaCtc', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-32 px-2.5 py-1 text-sm border border-red-200 rounded-md bg-white"
                          />
                        )}
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'manual' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'manual'} onChange={() => updatePlans('gpaSiType', 'manual')} className="accent-red-600" />
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900">Enter Sum Insured</span>
                        {plans.gpaSiType === 'manual' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="Amount"
                              value={plans.gpaManualSi || ''}
                              onChange={e => updatePlans('gpaManualSi', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-32 px-2.5 py-1 text-sm border border-red-200 rounded-md bg-white"
                            />
                            <span className="text-xs text-gray-400">₹1L – ₹50L</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

function OptionalPlan({ label, active, onToggle, children }) {
  return (
    <div className={`rounded-lg border transition-all ${active ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        {active ? (
          <button type="button" onClick={() => onToggle(false)} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer flex items-center gap-0.5">
            <X size={12} /> Remove
          </button>
        ) : (
          <button type="button" onClick={() => onToggle(true)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer flex items-center gap-0.5">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      {active && (
        <div className="px-3 pb-2.5">
          {children}
        </div>
      )}
    </div>
  )
}

function fmt(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}