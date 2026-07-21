const actions = [
  { id: 'add', label: 'Add employees', enabled: true },
  { id: 'update', label: 'Update employees', enabled: false },
  { id: 'delete', label: 'Delete employees', enabled: false },
]

export default function AiEndorsementActionPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-900">Endorsement type</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Endorsement type">
        {actions.map((action) => {
          const selected = value === action.id
          return (
            <button
              key={action.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!action.enabled}
              title={action.enabled ? undefined : 'Coming in a later release'}
              onClick={() => action.enabled && onChange(action.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {action.label}
              {!action.enabled ? ' (soon)' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
