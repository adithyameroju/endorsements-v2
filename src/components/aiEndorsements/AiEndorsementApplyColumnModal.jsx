import { X } from 'lucide-react'
import { getGridField, planOptionsForKind } from '../../lib/aiEndorsementSchema'

const PLAN_KINDS = {
  gmcBasePlan: 'gmcBase',
  gmcSecondaryPlan: 'gmcSecondary',
  gpaBasePlan: 'gpaBase',
  gmcTopup: 'gmcTopup',
  gmcAddons: 'gmcAddon',
}

export default function AiEndorsementApplyColumnModal({ modal, rowCount, onApply, onClose }) {
  if (!modal) return null

  const field = getGridField(modal.fieldId)
  const isPlan = field?.type === 'plan'
  const planKind = PLAN_KINDS[modal.fieldId] || field?.planKind
  const options = isPlan ? planOptionsForKind(planKind) : []

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Apply to column — {field?.label}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-600">
            Set the same value for {modal.scope === 'selected' ? 'selected rows' : `all ${rowCount} rows`} in this column.
          </p>
          {isPlan ? (
            <select
              id="apply-column-value"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              defaultValue=""
            >
              {options.map((p) => (
                <option key={p.id || 'none'} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="apply-column-value"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder={`Enter ${field?.label?.toLowerCase()}`}
            />
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('apply-column-value')
                onApply(el?.value ?? '')
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
