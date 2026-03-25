import { Users, UserCheck, Baby } from 'lucide-react'

/**
 * Bottom sticky bar shared by Quick Add form and Preview — summary chips + action slot.
 */
export default function QuickAddBatchStickyFooter({ beforeSummary, batchSummary, actions }) {
  const { count, basicsComplete, dependentCount } = batchSummary
  return (
    <div className="flex-shrink-0 sticky bottom-0 z-40 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] py-2.5">
      {beforeSummary}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
        <div
          className="flex flex-wrap items-stretch gap-2 sm:gap-2.5 min-w-0 sm:flex-1"
          aria-live="polite"
        >
          <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 min-h-[3.25rem]">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-indigo-600 shrink-0">
              <Users size={18} strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600/85">
                Employees
              </p>
              <p className="text-sm font-bold text-gray-900 tabular-nums leading-tight">{count}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 min-h-[3.25rem]">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600 shrink-0">
              <UserCheck size={18} strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80">
                Profiles complete
              </p>
              <p className="text-sm font-bold text-gray-900 tabular-nums leading-tight">
                {basicsComplete}
                <span className="text-gray-400 font-semibold"> / {count}</span>
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 min-h-[3.25rem]">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-violet-600 shrink-0">
              <Baby size={18} strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800/80">
                Dependents
              </p>
              <p className="text-sm font-bold text-gray-900 tabular-nums leading-tight">
                {dependentCount}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 min-w-0 sm:flex-shrink-0 sm:ml-auto w-full sm:w-auto">
          {actions}
        </div>
      </div>
    </div>
  )
}
