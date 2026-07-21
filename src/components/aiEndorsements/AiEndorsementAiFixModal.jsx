import { useMemo } from 'react'
import { X, Sparkles, AlertTriangle, AlertCircle, Wand2, ExternalLink } from 'lucide-react'
import { buildAiFixRowSections, buildAiSummaryCopy } from '../../lib/aiEndorsementAiFix'
import AiFixFieldEditor from './AiFixFieldEditor'

const SEVERITY_META = {
  aiFixable: {
    label: 'AI can fix',
    icon: Wand2,
    heading: 'text-violet-900',
    bar: 'border-violet-200 bg-violet-50/50',
  },
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    heading: 'text-red-800',
    bar: 'border-red-200 bg-red-50/40',
  },
  warning: {
    label: 'Warnings',
    icon: AlertTriangle,
    heading: 'text-amber-900',
    bar: 'border-amber-200 bg-amber-50/40',
  },
}

function FixTable({ rows, rowsById, onApplySuggestion, onUpdateRow, onUpdatePlan, onScrollToCell }) {
  if (!rows.length) {
    return <p className="px-3 py-4 text-center text-xs text-gray-500">No issues in this group.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Member</th>
            <th className="px-3 py-2">Emp ID</th>
            <th className="px-3 py-2">Field</th>
            <th className="px-3 py-2">Current</th>
            <th className="px-3 py-2">Fix here</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((item) => {
            const row = rowsById[item.rowId]
            if (!row) return null
            return (
              <tr key={item.id} className="align-middle hover:bg-gray-50/80">
                <td className="px-3 py-2 tabular-nums text-gray-500">{item.rowIndex + 1}</td>
                <td className="max-w-[8rem] truncate px-3 py-2 font-medium text-gray-900">
                  {item.memberName}
                </td>
                <td className="px-3 py-2 tabular-nums text-gray-700">{item.empId}</td>
                <td className="px-3 py-2 text-gray-700">{item.fieldLabel}</td>
                <td className="max-w-[7rem] truncate px-3 py-2 text-gray-500">{item.currentValue}</td>
                <td className="min-w-[10rem] px-3 py-2">
                  {item.hasSuggestion && item.suggestedLabel ? (
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                        <Sparkles size={10} aria-hidden />
                        AI: {item.suggestedLabel}
                      </span>
                      <button
                        type="button"
                        className="cursor-pointer rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-700"
                        onClick={() => onApplySuggestion?.(item)}
                      >
                        Apply
                      </button>
                    </div>
                  ) : null}
                  <AiFixFieldEditor
                    fieldId={item.fieldId}
                    row={row}
                    onChange={(patch) => onUpdateRow?.(item.rowId, patch)}
                    onPlanChange={(key, val) => onUpdatePlan?.(item.rowId, key, val)}
                  />
                  {item.message ? (
                    <p className="mt-1 text-[10px] text-red-600">{item.message}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                    onClick={() => onScrollToCell?.(item.fieldId, item.rowId)}
                    title="View in grid"
                  >
                    <ExternalLink size={11} aria-hidden />
                    Grid
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AiEndorsementAiFixModal({
  open,
  onClose,
  rowValidation,
  rows,
  onApplyAllAiFixes,
  onApplyAllSuggestions,
  onUpdateRow,
  onUpdatePlan,
  onScrollToCell,
}) {
  const sections = useMemo(
    () => (open ? buildAiFixRowSections(rowValidation, rows) : { aiFixable: [], critical: [], warning: [] }),
    [open, rowValidation, rows],
  )
  const summary = useMemo(() => (open ? buildAiSummaryCopy(rowValidation) : null), [open, rowValidation])
  const rowsById = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r])), [rows])

  if (!open) return null

  const ordered = [
    { key: 'aiFixable', items: sections.aiFixable },
    { key: 'critical', items: sections.critical },
    { key: 'warning', items: sections.warning },
  ]
  const allWithSuggestions = [
    ...sections.aiFixable,
    ...sections.critical,
    ...sections.warning,
  ].filter((i) => i.hasSuggestion && i.suggestedValue)

  const applySuggestion = (item) => {
    if (!item.suggestedValue) return
    const planKeys = ['gmcBasePlan', 'gmcSecondaryPlan', 'gpaBasePlan', 'gmcTopup', 'gmcAddons']
    if (planKeys.includes(item.fieldId)) {
      onUpdatePlan?.(item.rowId, item.fieldId, item.suggestedValue)
    } else if (item.fieldId === 'endorsementType') {
      onUpdateRow?.(item.rowId, { endorsementType: item.suggestedValue })
    } else {
      onUpdateRow?.(item.rowId, { [item.fieldId]: item.suggestedValue })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 cursor-pointer"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-fix-modal-title"
        className="relative z-10 flex h-[min(90vh,48rem)] w-[min(96vw,72rem)] max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles size={20} aria-hidden />
            </div>
            <div>
              <h2 id="ai-fix-modal-title" className="text-base font-bold text-gray-900">
                Smart fixes
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {summary
                  ? `${summary.errorRows} rows · apply AI suggestions or edit inline — fixed rows drop off automatically`
                  : 'Fix issues here without leaving this view.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6 portal-grid-scroll">
          {ordered.every((s) => s.items.length === 0) ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-emerald-700">All issues resolved</p>
              <p className="mt-1 text-xs text-gray-500">You can close this and continue to preview.</p>
            </div>
          ) : (
            ordered.map(({ key, items }) => {
              if (!items.length) return null
              const meta = SEVERITY_META[key]
              const Icon = meta.icon
              const sectionSuggestions = items.filter((i) => i.hasSuggestion && i.suggestedValue)
              return (
                <section key={key} className={`rounded-xl border p-4 ${meta.bar}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${meta.heading}`}
                    >
                      <Icon size={14} aria-hidden />
                      {meta.label}
                      <span className="ml-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] tabular-nums font-semibold normal-case tracking-normal text-gray-700">
                        {items.length}
                      </span>
                    </div>
                    {sectionSuggestions.length > 0 ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700"
                        onClick={() => onApplyAllSuggestions?.(sectionSuggestions)}
                      >
                        Apply all suggestions in section
                      </button>
                    ) : null}
                  </div>
                  <FixTable
                    rows={items}
                    rowsById={rowsById}
                    onApplySuggestion={applySuggestion}
                    onUpdateRow={onUpdateRow}
                    onUpdatePlan={onUpdatePlan}
                    onScrollToCell={onScrollToCell}
                  />
                </section>
              )
            })
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6">
          {allWithSuggestions.length > 0 ? (
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
              onClick={() => onApplyAllSuggestions?.(allWithSuggestions)}
            >
              Apply all AI suggestions
            </button>
          ) : null}
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
