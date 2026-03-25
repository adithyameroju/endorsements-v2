import { useEffect, useRef, useState } from 'react'
import { Calculator, Wallet, TrendingDown, AlertCircle, CheckCircle, User, Users, Layers } from 'lucide-react'
import AnimatedCdAmount from './AnimatedCdAmount'
import { formatInr, formatInrSigned } from '../lib/currencyFormat'
import { formSectionBadgeClass } from '../lib/formUi'

function splitLineLabel(label) {
  const i = label.indexOf('(')
  if (i === -1) return { main: label, meta: null }
  return { main: label.slice(0, i).trim(), meta: label.slice(i) }
}

const LINE_GROUP_ORDER = ['primary', 'dependents', 'secondary']
const LINE_GROUP_HEADINGS = {
  primary: 'Employees',
  dependents: 'Dependents',
  secondary: 'Secondary GMC',
}

function lineGroupIcon(id) {
  switch (id) {
    case 'primary':
      return <User size={12} className="text-violet-600 shrink-0" aria-hidden />
    case 'dependents':
      return <Users size={12} className="text-violet-600 shrink-0" aria-hidden />
    case 'secondary':
      return <Layers size={12} className="text-violet-600 shrink-0" aria-hidden />
    default:
      return null
  }
}

function PremiumLineRow({ line }) {
  const { main, meta } = splitLineLabel(line.label)
  return (
    <div className="flex justify-between gap-3 text-[11px] leading-snug">
      <span className="min-w-0 text-gray-700">
        <span className="font-medium text-gray-800">{main}</span>
        {meta ? <span className="text-gray-400 font-normal"> {meta}</span> : null}
      </span>
      <AnimatedCdAmount
        value={line.amount}
        className="flex-shrink-0 tabular-nums font-medium text-gray-900 text-right"
      >
        {formatInr(line.amount)}
      </AnimatedCdAmount>
    </div>
  )
}

/** Grouped line items inside a contained panel for scanability. */
function PremiumLinesGrouped({ lines, primaryBatchCount = 0 }) {
  const detailLines = lines.filter((l) => l.id !== 'total')
  if (detailLines.length === 0) {
    return (
      <p className="text-[11px] text-gray-500 leading-snug px-1 py-2">
        Add employees or dependents to see lines.
      </p>
    )
  }

  const byId = Object.fromEntries(detailLines.map((l) => [l.id, l]))

  return (
    <div className="rounded-lg border border-violet-100/90 bg-violet-50/40 px-2 sm:px-2.5 divide-y divide-violet-100/80">
      {LINE_GROUP_ORDER.map((id) => {
        const line = byId[id]
        if (!line) return null
        let heading = LINE_GROUP_HEADINGS[id] || line.label
        if (id === 'primary' && primaryBatchCount > 0) {
          heading = `Primary employees (${primaryBatchCount})`
        }
        return (
          <div key={id} className="py-2 first:pt-2.5 last:pb-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              {lineGroupIcon(id)}
              <span className="text-[9px] font-semibold uppercase tracking-wide text-violet-800/75">
                {heading}
              </span>
            </div>
            <PremiumLineRow line={line} />
          </div>
        )
      })}
    </div>
  )
}

/** Compact breakdown for popovers / tooltips. */
export function CdBreakdownPopoverBody({ lines, primaryBatchCount = 0 }) {
  const totalLine = lines.find((l) => l.id === 'total')
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-800 border-b border-gray-100 pb-2 mb-2">
        Estimated premium (pro-rata)
      </p>
      <PremiumLinesGrouped lines={lines} primaryBatchCount={primaryBatchCount} />
      {totalLine && (
        <div className="flex justify-between gap-3 pt-2.5 mt-2.5 border-t border-gray-200">
          <span className="text-xs font-bold text-gray-900">Total (est.)</span>
          <AnimatedCdAmount
            value={totalLine.amount}
            className="text-xs font-bold text-violet-700 tabular-nums"
          >
            {formatInr(totalLine.amount)}
          </AnimatedCdAmount>
        </div>
      )}
    </div>
  )
}

/**
 * Premium line breakdown + CD wallet math + status.
 * `variant="card"` — sidebar / review rail. `variant="embedded"` — inside bottom sticky emerald shell.
 */
export default function CdBalanceFormWidget({
  cdAfterSubmit,
  currentCd,
  estimatedCdDraw,
  lines,
  policyDaysRemaining,
  primaryBatchCount = 0,
  variant = 'card',
  className = '',
}) {
  const prevSig = useRef(`${estimatedCdDraw}|${cdAfterSubmit}`)
  const [panelFlash, setPanelFlash] = useState(false)
  useEffect(() => {
    const sig = `${estimatedCdDraw}|${cdAfterSubmit}`
    if (prevSig.current === sig) return
    prevSig.current = sig
    let offTimer
    const onTimer = setTimeout(() => {
      setPanelFlash(true)
      offTimer = setTimeout(() => setPanelFlash(false), 720)
    }, 0)
    return () => {
      clearTimeout(onTimer)
      clearTimeout(offTimer)
    }
  }, [estimatedCdDraw, cdAfterSubmit])

  const totalLine = lines.find((l) => l.id === 'total')
  const totalPremium = totalLine?.amount ?? estimatedCdDraw
  const isSufficient = cdAfterSubmit >= 0

  const inner = (
    <>
      {/* Header */}
      <div className={variant === 'card' ? '' : 'pb-1 border-b border-emerald-200/50 mb-1'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`${formSectionBadgeClass} shrink-0 ${
                variant === 'card' ? 'bg-violet-100 text-violet-700' : 'bg-white/90 text-violet-700 border border-violet-100'
              }`}
            >
              <Calculator size={14} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight leading-snug">
                Premium &amp; CD impact (est.)
              </h3>
              {policyDaysRemaining != null && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {policyDaysRemaining} day{policyDaysRemaining === 1 ? '' : 's'} remaining in policy
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">Pro-rata estimate — updates as you edit.</p>
      </div>

      {/* Section A — Premium breakdown */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Estimated premium (pro-rata)
        </p>
        <PremiumLinesGrouped lines={lines} primaryBatchCount={primaryBatchCount} />
        <div className="flex items-end justify-between gap-3 pt-3 mt-3 border-t border-gray-200">
          <span className="text-xs font-bold text-gray-900 leading-tight">Total premium (pro-rata)</span>
          <AnimatedCdAmount
            value={totalPremium}
            className="text-base font-bold text-violet-700 tabular-nums leading-none"
          >
            {formatInr(totalPremium)}
          </AnimatedCdAmount>
        </div>
      </div>

      {/* Section B — CD wallet (nested) */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-slate-50/90 p-3 space-y-2 shadow-inner">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <Wallet size={13} className="text-gray-500 shrink-0" aria-hidden />
            Current CD balance
          </span>
          <AnimatedCdAmount value={currentCd} className="font-semibold text-gray-900 tabular-nums shrink-0">
            {formatInr(currentCd)}
          </AnimatedCdAmount>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
            <TrendingDown size={13} className="text-slate-500 shrink-0" aria-hidden />
            Est. deduction
          </span>
          <AnimatedCdAmount value={estimatedCdDraw} className="font-semibold text-slate-800 tabular-nums shrink-0">
            −{formatInr(estimatedCdDraw)}
          </AnimatedCdAmount>
        </div>
        <hr className="border-gray-200 my-1" />
        <div className="flex items-end justify-between gap-2">
          <span className="text-xs font-bold text-gray-900 leading-tight pr-2">New balance</span>
          <AnimatedCdAmount
            value={cdAfterSubmit}
            className={`text-lg font-bold tabular-nums leading-none shrink-0 ${cdAfterSubmit < 0 ? 'text-red-600' : 'text-gray-900'}`}
          >
            {formatInrSigned(cdAfterSubmit)}
          </AnimatedCdAmount>
        </div>
      </div>

      {/* Section C — Status */}
      <div
        className={`rounded-lg px-3 py-2.5 text-[11px] font-medium flex items-start gap-2 leading-snug border ${
          isSufficient
            ? 'bg-violet-50/95 text-violet-900 border-violet-200/80'
            : 'bg-red-50/95 text-red-900 border-red-200/80'
        }`}
      >
        {isSufficient ? (
          <>
            <CheckCircle size={14} className="text-violet-600 shrink-0 mt-0.5" aria-hidden />
            <span>Enough CD for this batch (est.).</span>
          </>
        ) : (
          <>
            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" aria-hidden />
            <span>Not enough CD (est.) — adjust plans or funding.</span>
          </>
        )}
      </div>
    </>
  )

  if (variant === 'embedded') {
    return (
      <div className={`space-y-4 ${className}`}>
        {inner}
      </div>
    )
  }

  return (
    <section
      className={`rounded-xl border border-violet-200/90 bg-white shadow-sm p-4 pl-3.5 border-l-[3px] border-l-violet-500 transition-shadow duration-300 ${panelFlash ? 'cd-balance-widget-flash' : ''} ${className}`}
    >
      <div className="space-y-4">{inner}</div>
    </section>
  )
}
