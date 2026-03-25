import { Plus, X, Heart, Shield } from 'lucide-react'
import { basePlans, secondaryPlans, addonPlans, topupPlans, gpaBasePlans } from '../data/mockData'
import { formFieldLabelClass, formControlClass } from '../lib/formUi'

export default function PlanSelection({
  plans,
  onChange,
  label = '',
  gmcOnly = false,
  hideInsuranceHeader = false,
  hideGmcToggle = false,
  /** Dependent GMC: single row of controls to save vertical space */
  horizontalGmcLayout = false,
}) {
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
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Insurance Plans <span className="text-red-500">*</span></h3>
          <p className="text-xs text-gray-500 leading-snug">Toggle on the plans you want to enroll this employee in</p>
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
                <span className="text-base font-bold text-gray-900">GMC</span>
                <p className="text-xs text-gray-500 leading-snug">Group Medical Coverage — configure plan for this dependent</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Heart size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-base font-bold text-gray-900">GMC</span>
                  <p className="text-xs text-gray-500 leading-snug">Comprehensive medical insurance for hospitalization, OPD & more</p>
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
            <div
              className={`border-t border-gray-100 ${horizontalGmcLayout ? 'p-3 bg-slate-50/70' : 'p-4 bg-blue-50/20 space-y-3'}`}
            >
              {horizontalGmcLayout ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                  <div className="min-w-0 w-full">
                    <label className={`${formFieldLabelClass} mb-1.5`}>Base <span className="text-red-500">*</span></label>
                    <select
                      value={plans.gmcBasePlan || ''}
                      onChange={(e) => updatePlans('gmcBasePlan', e.target.value)}
                      className={formControlClass}
                    >
                      <option value="">Select</option>
                      {basePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name.replace(/^Base Plan - /, '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 w-full">
                    <OptionalPlanInline
                      label="Secondary"
                      active={plans.gmcSecondaryPlan && plans.gmcSecondaryPlan !== 'none'}
                      onToggle={(on) => updatePlans('gmcSecondaryPlan', on ? secondaryPlans[0].id : 'none')}
                    >
                      <select
                        value={plans.gmcSecondaryPlan || ''}
                        onChange={(e) => updatePlans('gmcSecondaryPlan', e.target.value)}
                        className={formControlClass}
                      >
                        {secondaryPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name.replace(/^Secondary Plan - /, '')}
                          </option>
                        ))}
                      </select>
                    </OptionalPlanInline>
                  </div>
                  <div className="min-w-0 w-full">
                    <OptionalPlanInline
                      label="Top-up"
                      active={plans.gmcTopup && plans.gmcTopup !== 'none'}
                      onToggle={(on) => updatePlans('gmcTopup', on ? topupPlans[0].id : 'none')}
                    >
                      <select
                        value={plans.gmcTopup || ''}
                        onChange={(e) => updatePlans('gmcTopup', e.target.value)}
                        className={formControlClass}
                      >
                        {topupPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name.replace(/^Top-Up - /, '')}
                          </option>
                        ))}
                      </select>
                    </OptionalPlanInline>
                  </div>
                  <div className="min-w-0 w-full xl:col-span-1">
                    <OptionalPlanInline
                      label="Add-ons"
                      active={(plans.gmcAddons || []).length > 0}
                      onToggle={(on) => updatePlans('gmcAddons', on ? [addonPlans[0].id] : [])}
                    >
                      <div className="flex flex-wrap gap-1 w-full">
                        {addonPlans.map((p) => {
                          const sel = (plans.gmcAddons || []).includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const cur = plans.gmcAddons || []
                                updatePlans('gmcAddons', sel ? cur.filter((a) => a !== p.id) : [...cur, p.id])
                              }}
                              className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-all font-medium ${
                                sel
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {sel ? '✓ ' : ''}
                              {p.name.split(' ')[0]}
                            </button>
                          )
                        })}
                      </div>
                    </OptionalPlanInline>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className={formFieldLabelClass}>
                      Base Plan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={plans.gmcBasePlan || ''}
                      onChange={(e) => updatePlans('gmcBasePlan', e.target.value)}
                      className={formControlClass}
                    >
                      <option value="">Select base plan</option>
                      {basePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {fmt(p.sumInsured)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <OptionalPlan
                      label="Top-up Plan"
                      active={plans.gmcTopup && plans.gmcTopup !== 'none'}
                      onToggle={(on) => updatePlans('gmcTopup', on ? topupPlans[0].id : 'none')}
                    >
                      <select
                        value={plans.gmcTopup || ''}
                        onChange={(e) => updatePlans('gmcTopup', e.target.value)}
                        className={formControlClass}
                      >
                        {topupPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {fmt(p.sumInsured)}
                          </option>
                        ))}
                      </select>
                    </OptionalPlan>

                    <OptionalPlan
                      label="Add-on Plan"
                      active={(plans.gmcAddons || []).length > 0}
                      onToggle={(on) => updatePlans('gmcAddons', on ? [addonPlans[0].id] : [])}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {addonPlans.map((p) => {
                          const sel = (plans.gmcAddons || []).includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const cur = plans.gmcAddons || []
                                updatePlans('gmcAddons', sel ? cur.filter((a) => a !== p.id) : [...cur, p.id])
                              }}
                              className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-all font-medium ${
                                sel
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {sel ? '✓ ' : ''}
                              {p.name}
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
                        onChange={(e) => updatePlans('gmcSecondaryPlan', e.target.value)}
                        className={formControlClass}
                      >
                        {secondaryPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {fmt(p.sumInsured)}
                          </option>
                        ))}
                      </select>
                    </OptionalPlan>
                  </div>
                </>
              )}
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
                <span className="text-base font-bold text-gray-900">GPA</span>
                <p className="text-xs text-gray-500 leading-snug">Accidental death and disability coverage</p>
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
              <div>
                <label className={formFieldLabelClass}>
                  Base Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={plans.gpaBasePlan || ''}
                  onChange={e => updatePlans('gpaBasePlan', e.target.value)}
                  className={formControlClass}
                >
                  <option value="">Select base plan</option>
                  {gpaBasePlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.sumInsured)}</option>)}
                </select>
              </div>

              {plans.gpaBasePlan && (
                <div>
                  <label className={formFieldLabelClass}>Sum Insured Method <span className="text-red-500">*</span></label>
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
                            className="w-full max-w-[10rem] min-h-[2.75rem] px-3 py-2.5 text-sm border border-red-200 rounded-lg bg-white box-border"
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
                              className="w-full max-w-[10rem] min-h-[2.75rem] px-3 py-2.5 text-sm border border-red-200 rounded-lg bg-white box-border"
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

/** Full-width optional block for horizontal dependent GMC row */
function OptionalPlanInline({ label, active, onToggle, children }) {
  if (!active) {
    return (
      <div className="min-w-0 w-full flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="w-full min-h-[2.75rem] px-3 rounded-lg border border-dashed border-gray-300 bg-white text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-800 transition-colors cursor-pointer"
        >
          + Add {label}
        </button>
      </div>
    )
  }
  return (
    <div className="min-w-0 w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="text-xs font-semibold text-red-600 hover:underline cursor-pointer shrink-0"
        >
          Remove
        </button>
      </div>
      <div className="w-full min-w-0">{children}</div>
    </div>
  )
}

function OptionalPlan({ label, active, onToggle, children }) {
  return (
    <div className={`rounded-lg border transition-all ${active ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
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