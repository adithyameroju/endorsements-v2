import { useState } from 'react'
import { Plus, X, Heart, Shield } from 'lucide-react'
import { basePlans, secondaryPlans, addonPlans, topupPlans, gpaBasePlans } from '../data/mockData'

export default function PlanSelection({ plans, onChange, label = '', gmcOnly = false }) {
  const updatePlans = (key, value) => {
    onChange({ ...plans, [key]: value })
  }

  const gmcEnabled = !!(plans.gmcBasePlan)
  const gpaEnabled = !!(plans.gpaBasePlan)

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
      updatePlans('gpaBasePlan', gpaBasePlans[0].id)
      updatePlans('gpaSiType', 'fixed')
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
    <div className={gmcOnly ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
      {/* GMC Section */}
      <div className="space-y-4">
        {/* GMC Toggle Header */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
          <div className="flex items-center gap-2.5">
            <Heart size={16} className="text-blue-600" />
            <div>
              <span className="text-sm font-semibold text-gray-900">GMC</span>
              <p className="text-xs text-gray-500">Group Mediclaim</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gmcEnabled}
              onChange={e => toggleGMC(e.target.checked)}
              className="accent-blue-600 w-4 h-4 rounded"
            />
            <span className="text-xs font-medium text-gray-700">Enable</span>
          </label>
        </div>

        {/* GMC Options */}
        {gmcEnabled && (
          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/20 space-y-3">
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
              <p className="text-xs font-medium text-gray-500">Optional Plans</p>

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

              <OptionalPlan
                label="Top-Up Plan"
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
                label="Add-on Covers"
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
            </div>
          </div>
        )}
      </div>

      {/* GPA Section - hidden when gmcOnly (e.g. dependents) */}
      {!gmcOnly && (
        <div className="space-y-4">
          {/* GPA Toggle Header */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-violet-600" />
              <div>
                <span className="text-sm font-semibold text-gray-900">GPA</span>
                <p className="text-xs text-gray-500">Group Personal Accident</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gpaEnabled}
                onChange={e => toggleGPA(e.target.checked)}
                className="accent-violet-600 w-4 h-4 rounded"
              />
              <span className="text-xs font-medium text-gray-700">Enable</span>
            </label>
          </div>

          {/* GPA Options */}
          {gpaEnabled && (
            <div className="border border-violet-100 rounded-xl p-4 bg-violet-50/20 space-y-3">
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
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sum Insured Type <span className="text-red-500">*</span></label>
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'fixed' ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'fixed'} onChange={() => updatePlans('gpaSiType', 'fixed')} className="accent-violet-600" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">Fixed Sum Insured</span>
                        {plans.gpaSiType === 'fixed' && (
                          <span className="ml-2 text-xs text-violet-600 font-medium">
                            {fmt(gpaBasePlans.find(p => p.id === plans.gpaBasePlan)?.sumInsured || 0)}
                          </span>
                        )}
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'ctc' ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'ctc'} onChange={() => updatePlans('gpaSiType', 'ctc')} className="accent-violet-600" />
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900">Based on CTC</span>
                        {plans.gpaSiType === 'ctc' && (
                          <input
                            type="number"
                            placeholder="Enter CTC"
                            value={plans.gpaCtc || ''}
                            onChange={e => updatePlans('gpaCtc', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-32 px-2.5 py-1 text-sm border border-violet-200 rounded-md bg-white"
                          />
                        )}
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      plans.gpaSiType === 'manual' ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`gpa-si-${label}`} checked={plans.gpaSiType === 'manual'} onChange={() => updatePlans('gpaSiType', 'manual')} className="accent-violet-600" />
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
                              className="w-32 px-2.5 py-1 text-sm border border-violet-200 rounded-md bg-white"
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