import { Trash2, User, Heart, Users } from 'lucide-react'
import { dependentRelationGroups, basePlans, gpaBasePlans } from '../data/mockData'
import PlanSelection from './PlanSelection'

function getRelationIcon(relation) {
  const r = (relation || '').toLowerCase()
  if (r === 'spouse') return <Heart size={14} className="text-pink-500" />
  if (['father', 'mother'].includes(r)) return <User size={14} className="text-amber-600" />
  if (['son', 'daughter'].includes(r)) return <User size={14} className="text-blue-500" />
  if (['brother', 'sister'].includes(r)) return <Users size={14} className="text-violet-500" />
  if (r.includes('in-law')) return <User size={14} className="text-teal-500" />
  return <User size={14} className="text-gray-500" />
}

/** Format employee's GMC plan details for dependents (GPA not applicable) */
function formatEmployeeGmcOnly(plans) {
  const gmcBase = basePlans.find(p => p.id === plans?.gmcBasePlan)
  return gmcBase ? `GMC: ${gmcBase.name}` : 'No GMC plan configured'
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

export default function DependentForm({ dependents, onChange, employeePlans = {} }) {
  const hasEmployeeGmc = !!(employeePlans?.gmcBasePlan)

  const countByRelation = (rel) => dependents.filter(d => d.relation === rel).length
  const childrenCount = dependents.filter(d => CHILDREN.includes(d.relation)).length

  const isRelationDisabled = (rel) => {
    if (CHILDREN.includes(rel)) return childrenCount >= MAX_CHILDREN
    return countByRelation(rel) >= (RELATION_LIMITS[rel] || 99)
  }

  const addDependentByRelation = (relation) => {
    if (isRelationDisabled(relation)) return
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
        plans: {},
      }
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
    updated[index] = {
      ...updated[index],
      samePlansAsEmployee: same,
      plans: same ? {} : { gmcBasePlan: employeePlans?.gmcBasePlan || '' },
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User size={16} className="text-indigo-500 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-gray-700">Dependents</h3>
      </div>

      {/* Step 1: Select relationship chips first */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Select relationship to add a dependent</p>
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      disabled
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer'
                    }`}
                  >
                    {r}{disabled ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: After selection, show form for each added dependent */}
      {dependents.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          <User size={22} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No dependents added yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Select a relationship above to add one</p>
        </div>
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

              {/* Plans: GMC only for dependents */}
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
                  <div className="px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Same as employee GMC (view only)</p>
                    <p className="text-sm font-medium text-gray-900">{formatEmployeeGmcOnly(employeePlans) || '—'}</p>
                  </div>
                ) : (
                  <PlanSelection
                    plans={dep.plans || {}}
                    onChange={(plans) => updateDependent(index, 'plans', plans)}
                    label={`dep-${dep.id}`}
                    gmcOnly
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
