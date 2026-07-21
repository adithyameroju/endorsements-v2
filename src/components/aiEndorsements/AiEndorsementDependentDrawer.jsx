import { X } from 'lucide-react'
import DependentForm from '../DependentForm'

export default function AiEndorsementDependentDrawer({ row, open, onClose, onSave }) {
  if (!open || !row) return null

  const dep = {
    id: row.id,
    name: row.memberName || '',
    relation: row.relation || '',
    dob: row.dob || '',
    gender: row.gender || '',
    plans: row.plans || {},
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[55] w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-bold text-gray-900">Dependent details</h2>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-gray-500 mb-4">
          Linked to employee <span className="font-semibold text-gray-800">{row.empId || '—'}</span>
        </p>
        <DependentForm
          dependents={[dep]}
          hideSectionTitle
          onChange={(updated) => {
            const first = updated[0]
            if (!first) return
            onSave({
              memberName: first.name,
              relation: first.relation,
              dob: first.dob,
              gender: first.gender,
              plans: first.plans,
            })
          }}
        />
      </div>
      <div className="border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  )
}
