import { Plus, Trash2 } from 'lucide-react'
import { dependentRelations } from '../data/mockData'
import PlanSelection from './PlanSelection'

export default function DependentForm({ dependents, onChange }) {
  const addDependent = () => {
    onChange([
      ...dependents,
      {
        id: Date.now(),
        name: '',
        relation: '',
        dob: '',
        gender: '',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Dependents</h3>
        <button
          type="button"
          onClick={addDependent}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Dependent
        </button>
      </div>

      {dependents.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-400">No dependents added yet</p>
          <button
            type="button"
            onClick={addDependent}
            className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer"
          >
            + Add a dependent
          </button>
        </div>
      )}

      {dependents.map((dep, index) => (
        <div key={dep.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Dependent {index + 1}</h4>
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Relationship</label>
              <select
                value={dep.relation}
                onChange={e => updateDependent(index, 'relation', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Select</option>
                {dependentRelations.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
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

          <PlanSelection
            plans={dep.plans}
            onChange={(plans) => updateDependent(index, 'plans', plans)}
            label={`dep-${dep.id}`}
          />
        </div>
      ))}
    </div>
  )
}
