import { Calculator, Wallet, TrendingDown, CheckCircle, AlertCircle, PanelRightClose, Info } from 'lucide-react'
import { formatInr, formatInrSigned } from '../lib/currencyFormat'
import AnimatedCdAmount from './AnimatedCdAmount'

function lineDisplayLabel(line) {
  switch (line.id) {
    case 'primary':
      return 'Base plan (employees)'
    case 'dependents':
      return line.label.replace(/^Dependents/, 'Parental / dependents')
    case 'secondary':
      return 'Top-up / secondary GMC'
    default:
      return line.label
  }
}

/**
 * Live Premium Estimate card (desktop side rail). All amounts illustrative (est.).
 */
export default function PremiumEstimateLivePanel({
  lines,
  totalPremium,
  currentCd,
  balanceAfter,
  isSufficient,
  policyDaysRemaining,
  onCollapse,
  collapseAriaLabel = 'Collapse premium panel',
  collapseTitle = 'Hide panel (preview stays on edge)',
}) {
  const detailLines = lines.filter((l) => l.id !== 'total')

  return (
    <div className="flex flex-col h-full min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-3 pt-3 pb-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Calculator size={15} className="text-violet-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-gray-900 leading-tight">Premium Estimate</h2>
              <p className="text-[10px] text-gray-500">Live (est.)</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {policyDaysRemaining != null && (
              <p className="text-[10px] text-gray-500 text-right hidden xl:block max-w-[5.5rem] leading-tight">
                {policyDaysRemaining}d left in policy
              </p>
            )}
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="p-1.5 rounded-lg text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
                aria-label={collapseAriaLabel}
                title={collapseTitle}
              >
                <PanelRightClose size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pt-2 pb-0">
        <div className="rounded-lg border border-violet-200/80 bg-gradient-to-br from-violet-50/95 to-indigo-50/40 px-2.5 py-2 shadow-sm">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 border border-violet-100">
              <Info size={14} className="text-violet-600" aria-hidden />
            </div>
            <div className="min-w-0 text-[10px] leading-snug text-violet-950">
              <p className="font-semibold text-violet-900 mb-0.5">Your CD after this batch</p>
              <p className="text-violet-800/90">
                We estimate how much premium this endorsement may draw from your Corporate Deposit (CD). Lines below
                reflect employees, dependents, and optional GMC cover you selected — totals update as you edit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 flex-1 overflow-y-auto min-h-0">
        {detailLines.length > 0 ? (
          <ul className="space-y-1.5 mb-2.5">
            {detailLines.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 text-[11px] text-gray-600">
                <span className="leading-snug">{lineDisplayLabel(l)}</span>
                <AnimatedCdAmount value={l.amount} className="font-medium text-gray-900 flex-shrink-0">
                  {formatInr(l.amount)}
                </AnimatedCdAmount>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-gray-500 mb-2.5">Add employee or dependent details to see line items.</p>
        )}

        <div className="border-t border-gray-200 pt-2.5 flex items-end justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-900">Total (Pro-rata)</span>
          <AnimatedCdAmount value={totalPremium} className="text-sm font-bold text-violet-700">
            {formatInr(totalPremium)}
          </AnimatedCdAmount>
        </div>

        <div className="mt-3 rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-slate-50/80 p-2.5 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-gray-600">
              <Wallet size={12} className="text-gray-500 flex-shrink-0" />
              Current CD
            </span>
            <AnimatedCdAmount value={currentCd} className="font-semibold text-gray-900">
              {formatInr(currentCd)}
            </AnimatedCdAmount>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <TrendingDown size={12} className="flex-shrink-0" />
              Deduction
            </span>
            <AnimatedCdAmount value={totalPremium} className="font-semibold text-red-600">
              −{formatInr(totalPremium)}
            </AnimatedCdAmount>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-900">After</span>
            <AnimatedCdAmount
              value={balanceAfter}
              className={`text-xs font-bold ${balanceAfter < 0 ? 'text-red-600' : 'text-gray-900'}`}
            >
              {formatInrSigned(balanceAfter)}
            </AnimatedCdAmount>
          </div>
        </div>
      </div>

      <div
        className={`px-3 py-2 text-[10px] font-medium flex items-start gap-1.5 border-t leading-snug ${
          isSufficient
            ? 'bg-violet-50/90 text-violet-800 border-violet-100'
            : 'bg-red-50/90 text-red-800 border-red-100'
        }`}
      >
        {isSufficient ? (
          <>
            <CheckCircle size={12} className="text-violet-600 flex-shrink-0 mt-0.5" />
            Sufficient CD for this batch (est.)
          </>
        ) : (
          <>
            <AlertCircle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
            Insufficient CD (est.) — review plans or funding.
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Collapsed edge preview for the premium rail — tap to expand full panel.
 */
export function PremiumEstimateCollapsedRail({
  totalPremium,
  balanceAfter,
  isSufficient,
  onExpand,
}) {
  const afterTitle = formatInrSigned(balanceAfter)
  const estTitle = formatInr(totalPremium)
  return (
    <button
      type="button"
      onClick={onExpand}
      className="group flex flex-col items-stretch gap-1.5 w-full min-w-0 max-w-full py-3 px-1 rounded-lg border border-transparent hover:border-violet-200 hover:bg-violet-50/60 transition-all cursor-pointer text-center min-h-[12rem] overflow-hidden"
      aria-label="Expand premium estimate panel"
    >
      <div className="flex flex-col items-center gap-1.5 w-full min-w-0">
        <Calculator size={18} className="text-violet-600 group-hover:text-violet-700 flex-shrink-0" />
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight w-full">
          Est.
        </span>
        <span
          className="text-[10px] font-bold text-violet-700 tabular-nums leading-tight w-full min-w-0 truncate px-0.5"
          title={estTitle}
        >
          {formatInr(totalPremium)}
        </span>
        <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wide leading-tight w-full mt-0.5">
          After
        </span>
        <span
          className={`text-[10px] font-semibold tabular-nums leading-tight w-full min-w-0 truncate px-0.5 ${balanceAfter < 0 ? 'text-red-600' : 'text-gray-700'}`}
          title={afterTitle}
        >
          {formatInrSigned(balanceAfter)}
        </span>
        <span
          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 mx-auto ${isSufficient ? 'bg-emerald-500' : 'bg-red-500'}`}
          title={isSufficient ? 'Sufficient CD' : 'Insufficient CD'}
        />
        <span className="text-[9px] text-violet-600 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Expand
        </span>
      </div>
    </button>
  )
}
