import { ChevronRight } from 'lucide-react'
import { helpCardHover, helpCardPadding, helpCardSurface, helpCategoryLabel } from '../lib/helpUiTokens'

const METRIC_VALUE = 'text-2xl font-bold tabular-nums tracking-tight text-gray-900'
const METRIC_SUB = 'text-xs leading-relaxed text-gray-500'
const METRIC_BAR = 'h-1.5 w-full overflow-hidden rounded-full bg-gray-100'

/**
 * Minimal metric tile — matches CD Balance overview cards (CdBalancePrimaryCard pattern).
 */
export default function PortalMetricCard({
  label,
  value,
  sub,
  subClassName = '',
  barPct,
  barLabel,
  barValue,
  barColor = 'bg-emerald-500',
  footerLink,
  onClick,
  className = '',
}) {
  const Tag = onClick ? 'button' : 'div'
  const interactive = onClick
    ? `${helpCardHover} w-full cursor-pointer text-left transition-colors`
    : 'w-full'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${helpCardSurface} ${helpCardPadding} flex h-full flex-col ${interactive} ${className}`.trim()}
    >
      <p className={helpCategoryLabel}>{label}</p>
      <p className={`mt-1 ${METRIC_VALUE}`}>{value}</p>
      {sub ? <p className={`mt-1 ${METRIC_SUB} ${subClassName}`.trim()}>{sub}</p> : null}

      {barPct != null ? (
        <div className="mt-auto pt-4">
          {(barLabel || barValue) && (
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
              {barLabel ? <span>{barLabel}</span> : <span />}
              {barValue ? <span className="tabular-nums text-gray-900">{barValue}</span> : null}
            </div>
          )}
          <div className={METRIC_BAR} aria-hidden>
            <div
              className={`h-full rounded-full transition-[width] ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }}
            />
          </div>
        </div>
      ) : null}

      {footerLink ? (
        <span className="mt-3 inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600">
          {footerLink} <ChevronRight size={14} className="text-indigo-500" aria-hidden />
        </span>
      ) : null}
    </Tag>
  )
}
