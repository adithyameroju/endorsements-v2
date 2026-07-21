import { CheckCircle, Pencil, UserMinus, UserPlus, UserCog, Users } from 'lucide-react'

/**
 * Footer for AI Endorsements preview — optional summary chips + action slot.
 */
export default function AiEndorsementPreviewFooter({
  summary,
  actions,
  showSummary = true,
  variant = 'pinned',
}) {
  const { total, additions, addDependents, updates, deletions, offboards } = summary ?? {}

  const shellClass =
    variant === 'pinned'
      ? 'shrink-0 -mx-6 border-t border-gray-200 bg-white px-6 py-2.5 lg:-mx-8 lg:px-8'
      : 'sticky bottom-0 z-40 -mx-6 shrink-0 border-t border-gray-200 bg-white/95 px-6 py-2.5 backdrop-blur-sm lg:-mx-8 lg:px-8'

  return (
    <div className={shellClass}>
      <div
        className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${
          showSummary ? '' : 'sm:justify-end'
        }`}
      >
        {showSummary ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-stretch gap-2 sm:gap-2.5" aria-live="polite">
            <SummaryChip icon={Users} label="Total" value={total} tone="indigo" />
            {additions > 0 ? (
              <SummaryChip icon={UserPlus} label="Additions" value={additions} tone="emerald" />
            ) : null}
            {addDependents > 0 ? (
              <SummaryChip icon={Users} label="Add dependents" value={addDependents} tone="teal" />
            ) : null}
            {updates > 0 ? (
              <SummaryChip icon={UserCog} label="Updates" value={updates} tone="blue" />
            ) : null}
            {deletions > 0 ? (
              <SummaryChip icon={UserMinus} label="Deletions" value={deletions} tone="rose" />
            ) : null}
            {offboards > 0 ? (
              <SummaryChip icon={UserMinus} label="Offboards" value={offboards} tone="amber" />
            ) : null}
          </div>
        ) : null}
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:ml-auto sm:w-auto sm:flex-shrink-0 sm:flex-row sm:items-center">
          {actions}
        </div>
      </div>
    </div>
  )
}

const TONE = {
  indigo: { border: 'border-indigo-100', bg: 'bg-indigo-50/70', icon: 'text-indigo-600', label: 'text-indigo-600/85' },
  emerald: { border: 'border-emerald-100', bg: 'bg-emerald-50/60', icon: 'text-emerald-600', label: 'text-emerald-800/80' },
  teal: { border: 'border-teal-100', bg: 'bg-teal-50/60', icon: 'text-teal-600', label: 'text-teal-800/80' },
  blue: { border: 'border-blue-100', bg: 'bg-blue-50/60', icon: 'text-blue-600', label: 'text-blue-800/80' },
  rose: { border: 'border-rose-100', bg: 'bg-rose-50/60', icon: 'text-rose-600', label: 'text-rose-800/80' },
  amber: { border: 'border-amber-100', bg: 'bg-amber-50/60', icon: 'text-amber-600', label: 'text-amber-800/80' },
}

function SummaryChip({ icon: Icon, label, value, tone }) {
  const t = TONE[tone] ?? TONE.indigo
  return (
    <div
      className={`inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border px-2.5 py-1.5 ${t.border} ${t.bg}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white ${t.icon}`}>
        <Icon size={15} strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${t.label}`}>{label}</p>
        <p className="text-sm font-semibold tabular-nums leading-tight text-gray-900">{value}</p>
      </div>
    </div>
  )
}

const secondaryBtn =
  'order-2 inline-flex w-full flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto'
const primaryBtn =
  'order-1 inline-flex w-full flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:order-3 sm:w-auto'
const ghostBtn =
  'order-3 inline-flex w-full flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:order-1 sm:w-auto'

export function AiEndorsementPreviewGridActions({ onBack, onContinue, onStartOver, rowCount }) {
  return (
    <>
      {onStartOver ? (
        <button type="button" onClick={onStartOver} className={ghostBtn}>
          Start over
        </button>
      ) : null}
      <button type="button" onClick={onBack} className={`${secondaryBtn} sm:order-2`}>
        <Pencil size={16} strokeWidth={2.25} aria-hidden />
        Edit
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={rowCount === 0}
        className={primaryBtn}
      >
        <CheckCircle size={16} strokeWidth={2.25} aria-hidden />
        Continue to confirm
      </button>
    </>
  )
}

export function AiEndorsementPreviewActions({
  onBack,
  onSubmit,
  onStartOver,
  submitting,
  cdSubmitBlocked,
  rowCount,
  backLabel = 'Edit',
}) {
  return (
    <>
      {onStartOver ? (
        <button type="button" onClick={onStartOver} className={ghostBtn}>
          Start over
        </button>
      ) : null}
      <button type="button" onClick={onBack} className={`${secondaryBtn} sm:order-2`}>
        <Pencil size={16} strokeWidth={2.25} aria-hidden />
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || cdSubmitBlocked || rowCount === 0}
        title={
          cdSubmitBlocked
            ? 'CD balance is not sufficient for this batch (est.) — go back and recharge or reduce rows.'
            : undefined
        }
        className={`${primaryBtn} ${
          cdSubmitBlocked || rowCount === 0 ? 'bg-indigo-400 text-white/90 hover:bg-indigo-400' : ''
        }`}
      >
        <CheckCircle size={16} strokeWidth={2.25} aria-hidden />
        {submitting ? 'Submitting…' : `Submit ${rowCount} endorsement${rowCount === 1 ? '' : 's'}`}
      </button>
    </>
  )
}
