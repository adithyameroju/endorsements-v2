import { useEffect, useMemo, useState } from 'react'
import { Search, User, X } from 'lucide-react'
import {
  isEmployeeAlreadyInGrid,
  lookupIntentLabel,
  searchEmployeesByQuery,
} from '../../lib/aiEndorsementEmployeeLookup'
import { getPlanSummaryParts } from '../../lib/planHelpers'
import { formControlClass } from '../../lib/formUi'

export default function AiEndorsementEmployeeLookupModal({
  open,
  intent = 'update',
  existingRows = [],
  onClose,
  onConfirm,
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(null)
      setError('')
    }
  }, [open])

  const results = useMemo(() => searchEmployeesByQuery(query), [query])

  if (!open) return null

  const handleSelect = (emp) => {
    setSelected(emp)
    setError('')
    setQuery(emp.id)
  }

  const handleAdd = () => {
    if (!selected) {
      if (results.length === 1) {
        const emp = results[0]
        if (isEmployeeAlreadyInGrid(existingRows, emp.id, intent)) {
          setError(`This employee already has a ${intent} row in the grid.`)
          return
        }
        onConfirm?.(emp)
        return
      }
      setError('Select an employee from the list or enter a valid EMP ID.')
      return
    }
    if (isEmployeeAlreadyInGrid(existingRows, selected.id, intent)) {
      setError(`This employee already has a ${intent} row in the grid.`)
      return
    }
    onConfirm?.(selected)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selected) {
        handleAdd()
      } else if (results.length === 1) {
        handleSelect(results[0])
        handleAdd()
      }
    }
  }

  const planParts = selected ? getPlanSummaryParts(selected.plans || {}) : []

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-employee-lookup-title"
        className="relative z-10 flex w-[min(96vw,28rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="ai-employee-lookup-title" className="text-base font-bold text-gray-900">
              {lookupIntentLabel(intent)}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Search by EMP ID, name, or email. We will pre-fill the row for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="EMP ID, name, or email"
              className={`${formControlClass} pl-9`}
              autoFocus
            />
          </div>

          {error ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {!selected && results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {results.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50/60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <User size={14} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{emp.name}</span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {emp.id} · {emp.email}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!selected && query.trim() && results.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No employees match your search.</p>
          ) : null}

          {selected ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-3">
              <p className="text-sm font-bold text-gray-900">{selected.name}</p>
              <p className="mt-0.5 text-xs text-gray-600">
                {selected.id} · {selected.email}
              </p>
              {planParts.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {planParts.map((p) => (
                    <span
                      key={`${p.key}-${p.text}`}
                      className="inline-flex rounded-md border border-slate-200/90 bg-white px-1.5 py-0.5 text-[10px] text-slate-800"
                    >
                      <span className="font-semibold text-slate-500">{p.key}</span>
                      <span className="ml-0.5">{p.text}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Add to grid
          </button>
        </div>
      </div>
    </div>
  )
}
