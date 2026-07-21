import { getGridField } from '../../lib/aiEndorsementSchema'
import { columnErrorCounts } from '../../lib/aiEndorsementValidation'

export default function AiEndorsementColumnErrorsPanel({ rowValidation, onFieldClick }) {
  const counts = columnErrorCounts(rowValidation)
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
        No column errors — all mapped fields look good.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Column errors</h3>
      <ul className="space-y-2">
        {entries.map(([fieldId, count]) => (
          <li key={fieldId}>
            <button
              type="button"
              onClick={() => onFieldClick?.(fieldId)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-left text-xs hover:bg-red-50 cursor-pointer"
            >
              <span className="font-semibold text-red-900">{getGridField(fieldId)?.label ?? fieldId}</span>
              <span className="tabular-nums font-bold text-red-700">{count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
