import { useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import { buildAiFixRowSections } from '../../lib/aiEndorsementAiFix'
import { countErrorRows } from '../../lib/aiEndorsementValidation'

const SEVERITY_ORDER = { critical: 0, warning: 1, aiFixable: 2 }

const SEVERITY_CHIP = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-900',
  aiFixable: 'bg-violet-100 text-violet-900',
}

const SEVERITY_LABEL = {
  critical: 'Critical',
  warning: 'Warning',
  aiFixable: 'AI fix',
}

function flattenErrorList(rowValidation, rows) {
  const sections = buildAiFixRowSections(rowValidation, rows)
  const flat = []
  for (const [severity, items] of Object.entries(sections)) {
    for (const item of items) {
      flat.push({
        ...item,
        severity,
        message: item.message ?? item.suggestion ?? 'Invalid value',
      })
    }
  }
  flat.sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (sev !== 0) return sev
    return (a.rowIndex ?? 0) - (b.rowIndex ?? 0)
  })
  return flat
}

export default function AiEndorsementErrorBanner({
  rowValidation,
  rows = [],
  emphasis = false,
  embedded = false,
  onCellClick,
  onOpenAiFix,
}) {
  const [expanded, setExpanded] = useState(false)

  const flatErrors = useMemo(
    () => flattenErrorList(rowValidation, rows),
    [rowValidation, rows],
  )

  const errorCount = countErrorRows(rowValidation)
  if (!errorCount) return null

  const outerClass = embedded
    ? `text-xs text-amber-950 ${emphasis ? 'ring-2 ring-amber-300 ring-inset' : ''}`
    : `overflow-hidden rounded-xl border border-amber-200 bg-white text-xs text-amber-950 ${
        emphasis ? 'quickadd-error-banner-emphasis ring-2 ring-amber-300' : ''
      }`

  return (
    <div id="ai-grid-error-banner" className={outerClass} role="alert" aria-live="polite">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((prev) => !prev)
          }
        }}
        className={`flex min-w-0 cursor-pointer flex-wrap items-center gap-2 px-4 py-3 ${
          embedded
            ? 'bg-amber-50/70 hover:bg-amber-50'
            : 'border-b border-amber-100 bg-amber-50/90 hover:bg-amber-50'
        }`}
      >
        <AlertCircle size={16} strokeWidth={2.25} className="shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-amber-950">
            {errorCount} row{errorCount === 1 ? '' : 's'} need fixes · {flatErrors.length} issue
            {flatErrors.length === 1 ? '' : 's'}
          </p>
          {!expanded ? (
            <p className="mt-0.5 text-[11px] text-amber-900/80">
              Fix these issues to continue — click to jump to cells.
            </p>
          ) : null}
        </div>
        {flatErrors.some((e) => e.severity === 'aiFixable') && onOpenAiFix ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenAiFix()
            }}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-50"
          >
            <Wand2 size={12} aria-hidden />
            Fix with AI
          </button>
        ) : null}
        <span className="inline-flex shrink-0 text-amber-800" aria-hidden>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {expanded ? (
        <div className="bg-gray-50/40 px-4 py-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[36rem] text-left text-[11px]">
              <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-10 px-3 py-2">#</th>
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="w-20 px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flatErrors.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 tabular-nums text-gray-500">{(item.rowIndex ?? 0) + 1}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onCellClick?.(item.fieldId, item.rowId, item.errorFieldId)}
                        className="cursor-pointer text-left hover:text-indigo-700"
                      >
                        <span className="font-medium text-gray-900">{item.memberName}</span>
                        {item.empId && item.empId !== '—' ? (
                          <span className="ml-1 text-gray-500">· {item.empId}</span>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">{item.fieldLabel}</td>
                    <td className="px-3 py-2 text-gray-600">{item.message}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          SEVERITY_CHIP[item.severity] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {SEVERITY_LABEL[item.severity] ?? item.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
