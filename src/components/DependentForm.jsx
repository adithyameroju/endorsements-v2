import { Trash2, User, Heart, Users } from 'lucide-react'
import { dependentRelationGroups, basePlans } from '../data/mockData'
import PlanSelection from './PlanSelection'
import { cloneEmployeeGmcPlans, formatInheritedGmcLines, hasActiveSecondaryGmc } from '../lib/planHelpers'

function getRelationIcon(relation) {
  const r = (relation || '').toLowerCase()
  if (r === 'spouse') return <Heart size={14} className="text-pink-500" />
  if (['father', 'mother'].includes(r)) return <User size={14} className="text-amber-600" />
  if (['son', 'daughter'].includes(r)) return <User size={14} className="text-blue-500" />
  if (['brother', 'sister'].includes(r)) return <Users size={14} className="text-violet-500" />
  if (r.includes('in-law')) return <User size={14} className="text-teal-500" />
  return <User size={14} className="text-gray-500" />
}

const RELATION_LIMITS = {
  Spouse: 1,
  Father: 1, Mother: 1,
  'Father-in-law': 1, 'Mother-in-law': 1,
  Son: 2, Daughter: 2,
  Brother: 2, Sister: 2,
}
const CHILDREN = ['Son', 'Daughter']
const MAX_CHILDREN = 2

/** Father + Mother together allowed; mutually exclusive with in-law group. */
const PARENT_RELATIONS = ['Father', 'Mother']
const INLAW_RELATIONS = ['Father-in-law', 'Mother-in-law']

export default function DependentForm({ dependents, onChange, employeePlans = {}, hideSectionTitle = false }) {
  const hasEmployeeGmc = !!(employeePlans?.gmcBasePlan)
  const secondaryActive = hasActiveSecondaryGmc(employeePlans)
  const hasParentDependent = dependents.some((d) => PARENT_RELATIONS.includes(d.relation))
  const hasInLawDependent = dependents.some((d) => INLAW_RELATIONS.includes(d.relation))

  const countByRelation = (rel) => dependents.filter(d => d.relation === rel).length
  const childrenCount = dependents.filter(d => CHILDREN.includes(d.relation)).length

  const isRelationDisabled = (rel) => {
    if (PARENT_RELATIONS.includes(rel)) {
      if (!secondaryActive) return true
      if (hasInLawDependent) return true
      return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
    }
    if (INLAW_RELATIONS.includes(rel)) {
      if (!secondaryActive) return true
      if (hasParentDependent) return true
      return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
    }
    if (CHILDREN.includes(rel)) return childrenCount >= MAX_CHILDREN
    return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
  }

  const relationDisableTitle = (rel) => {
    if (!isRelationDisabled(rel)) return undefined
    if (PARENT_RELATIONS.includes(rel)) {
      if (!secondaryActive) {
        return 'Parents are covered only under the employee GMC secondary plan. Select a secondary plan first.'
      }
      if (hasInLawDependent) {
        return 'Remove in-law dependents to add parents (parents and in-laws cannot be combined).'
      }
      return 'Maximum reached for this relation.'
    }
    if (INLAW_RELATIONS.includes(rel)) {
      if (!secondaryActive) {
        return 'In-laws are covered only under the employee GMC secondary plan. Select a secondary plan first.'
      }
      if (hasParentDependent) {
        return 'Remove parent dependents to add in-laws (parents and in-laws cannot be combined).'
      }
      return 'Maximum reached for this relation.'
    }
    if (CHILDREN.includes(rel) && childrenCount >= MAX_CHILDREN) return 'Maximum children reached.'
    return 'Maximum reached for this relation.'
  }

  /** Show ✓ when disabled because this relation is already fully used (not rule-locked). */
  const showAddedCheckmark = (rel) => {
    if (!isRelationDisabled(rel)) return false
    if (PARENT_RELATIONS.includes(rel)) {
      return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
    }
    if (INLAW_RELATIONS.includes(rel)) {
      return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
    }
    return true
  }

  const addDependentByRelation = (relation) => {
    if (isRelationDisabled(relation)) return
    const inherited = hasEmployeeGmc ? cloneEmployeeGmcPlans(employeePlans) : {}
    onChange([
      ...dependents,
      {
        id: Date.now(),
        name: '',
        relation,
        dob: '',
        gender: '',
        dateOfMarriage: relation === 'Spouse' ? '' : undefined,
        samePlansAsEmployee: true,
        plans: inherited,
      },
    ])
  }

  const updateDependent = (index, field, value) => {
    const updated = [...dependents]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removeDependent = (index) => {
    onChange(dependents.filter((_, i) => i !== index))
  }

  const setSamePlans = (index, same) => {
    const updated = [...dependents]
    if (same) {
      updated[index] = {
        ...updated[index],
        samePlansAsEmployee: true,
        plans: cloneEmployeeGmcPlans(employeePlans),
      }
    } else {
      const seed = hasEmployeeGmc
        ? cloneEmployeeGmcPlans(employeePlans)
        : { gmcBasePlan: basePlans[0]?.id || '' }
      updated[index] = {
        ...updated[index],
        samePlansAsEmployee: false,
        plans: seed.gmcBasePlan ? seed : { gmcBasePlan: basePlans[0]?.id || '' },
      }
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {!hideSectionTitle && (
        <div className="flex items-center gap-2">
          <User size={16} className="text-indigo-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-700">Dependents</h3>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Select relationship to add a dependent</p>
        {!secondaryActive && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950 leading-snug">
            <span className="font-semibold">Parents &amp; in-laws:</span>{' '}
            These dependents are covered only under the employee&apos;s GMC{' '}
            <span className="font-semibold">secondary</span> plan. Enable and select a secondary plan in the
            employee&apos;s GMC section to add Father, Mother, Father-in-law, or Mother-in-law.
          </div>
        )}
        {secondaryActive && hasParentDependent && (
          <p className="mb-2 text-[11px] text-gray-600 leading-snug">
            <span className="font-semibold text-gray-700">In-laws</span> are disabled while parent dependents
            (Father/Mother) are on this enrollment. Remove parent dependents to add Father-in-law or Mother-in-law.
          </p>
        )}
        {secondaryActive && hasInLawDependent && (
          <p className="mb-2 text-[11px] text-gray-600 leading-snug">
            <span className="font-semibold text-gray-700">Parents</span> are disabled while in-law dependents are on
            this enrollment. Remove in-law dependents to add Father or Mother.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {dependentRelationGroups.map(grp => (
            <div key={grp.label} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-0.5">{grp.label}</span>
              {grp.relations.map(r => {
                const disabled = isRelationDisabled(r)
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => addDependentByRelation(r)}
                    disabled={disabled}
                    title={relationDisableTitle(r)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      disabled
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer'
                    }`}
                  >
                    {r}{showAddedCheckmark(r) ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {dependents.length === 0 ? (
        <p className="text-xs text-gray-500 py-1">No dependents yet — choose a relationship above.</p>
      ) : (
        <div className="space-y-4">
          {dependents.map((dep, index) => (
            <div key={dep.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  {getRelationIcon(dep.relation)}
                  <span>{dep.relation}</span>
                  <span className="text-xs font-normal text-gray-500">— Dependent {index + 1}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => removeDependent(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={dep.name}
                    onChange={e => updateDependent(index, 'name', e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dep.dob}
                    onChange={e => updateDependent(index, 'dob', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                {dep.relation === 'Spouse' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Marriage</label>
                    <input
                      type="date"
                      value={dep.dateOfMarriage || ''}
                      onChange={e => updateDependent(index, 'dateOfMarriage', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
                  <select
                    value={dep.gender}
                    onChange={e => updateDependent(index, 'gender', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-600">GMC Plans</span>
                  {hasEmployeeGmc && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dep.samePlansAsEmployee !== false}
                        onChange={e => setSamePlans(index, e.target.checked)}
                        className="accent-indigo-600 w-4 h-4 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">Same as employee</span>
                    </label>
                  )}
                </div>
                {dep.samePlansAsEmployee !== false && hasEmployeeGmc ? (
                  <div className="px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
                    <p className="text-xs text-gray-500 mb-1">Inherited from employee (GMC — view only)</p>
                    <ul className="text-sm font-medium text-gray-900 list-disc list-inside space-y-0.5">
                      {formatInheritedGmcLines(employeePlans).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <PlanSelection
                    plans={dep.plans || {}}
                    onChange={(plans) => updateDependent(index, 'plans', plans)}
                    label={`dep-${dep.id}`}
                    gmcOnly
                    hideInsuranceHeader
                    hideGmcToggle
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
