/**
 * Dashboard KPI tile — matches CD Balance three-card strip pattern:
 * eyebrow, hero metric, subtext, divider, footer label/value, progress, footnote.
 */

import { useEffect, useState } from 'react'

function SplitProgressBar({ leftPct, leftClassName = 'bg-indigo-600', rightClassName = 'bg-teal-500', ariaLabel }) {
  const l = Math.min(100, Math.max(0, Number(leftPct)))
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100"
      role="img"
      aria-label={ariaLabel}
    >
      <div className={`h-full shrink-0 ${leftClassName}`} style={{ width: `${l}%` }} />
      <div className={`h-full shrink-0 ${rightClassName}`} style={{ width: `${100 - l}%` }} />
    </div>
  )
}

function SolidProgressBar({ pct, fillClassName = 'bg-emerald-500', ariaLabel }) {
  const p = Math.min(100, Math.max(0, Number(pct)))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="img" aria-label={ariaLabel}>
      <div className={`h-full rounded-full ${fillClassName}`} style={{ width: `${p}%` }} />
    </div>
  )
}

function formatPct(p) {
  const n = Number(p)
  if (!Number.isFinite(n)) return '0'
  return n >= 10 || n === Math.round(n) ? `${Math.round(n)}` : n.toFixed(1)
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

/** Two-slice donut (SVG strokes). Stroke draws clockwise with round caps so the leading edge reads as a dot following the ring. */
export function KeyMetricDonut({
  valueA,
  valueB,
  labelA = 'A',
  labelB = 'B',
  colorA = '#4f46e5',
  colorB = '#14b8a6',
  size = 92,
  animateOnMount = true,
  formatValue = (n) => String(Math.round(Number(n) || 0)),
  tooltipPlacement = 'top',
}) {
  const [drawT, setDrawT] = useState(0)

  const a = Math.max(0, Number(valueA))
  const b = Math.max(0, Number(valueB))
  const total = a + b || 1
  const pctA = (a / total) * 100
  const pctB = (b / total) * 100

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animateOnMount || reduced) {
      setDrawT(1)
      return undefined
    }
    setDrawT(0)
    let raf
    const start = performance.now()
    const dur = 820
    function tick(now) {
      const u = Math.min(1, (now - start) / dur)
      setDrawT(easeOutCubic(u))
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animateOnMount, a, b])

  const stroke = Math.max(3.25, size * 0.1)
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r
  const lenA = (pctA / 100) * C
  const lenB = (pctB / 100) * C
  /** Total arc length revealed along the ring (A first, then B) — classic stroke-dashoffset trick */
  const lenDrawn = drawT * C
  const visibleA = Math.min(Math.max(lenDrawn, 0), lenA)
  const visibleB = Math.min(Math.max(lenDrawn - lenA, 0), lenB)
  const dashOffsetA = C - visibleA
  const dashOffsetB = C - visibleB
  const holeR = Math.max(0, r - stroke * 0.55)
  const rotB = -90 + (pctA / 100) * 360

  const lineA = `${labelA}: ${formatPct(pctA)}% (${formatValue(a)})`
  const lineB = `${labelB}: ${formatPct(pctB)}% (${formatValue(b)})`
  const hoverSummary = `${lineA}\n${lineB}`

  const tooltipClass =
    tooltipPlacement === 'bottom'
      ? 'pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-[max-content] max-w-[14rem] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[11px] leading-snug text-gray-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover/donut:opacity-100 motion-reduce:transition-none max-sm:hidden'
      : 'pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[max-content] max-w-[14rem] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[11px] leading-snug text-gray-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover/donut:opacity-100 motion-reduce:transition-none max-sm:hidden'

  return (
    <div
      className="group/donut relative shrink-0 cursor-default overflow-visible"
      style={{ width: size, height: size }}
      aria-label={`${labelA} ${Math.round(pctA)} percent, ${labelB} ${Math.round(pctB)} percent`}
      title={`${lineA}; ${lineB}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block overflow-visible" aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colorA}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashOffsetA}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colorB}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashOffsetB}
          transform={`rotate(${rotB} ${cx} ${cy})`}
        />
      </svg>
      <div
        className="pointer-events-none absolute rounded-full border border-gray-100/80 bg-white shadow-inner"
        style={{
          width: holeR * 2,
          height: holeR * 2,
          left: cx - holeR,
          top: cy - holeR,
        }}
      />
      <div className={tooltipClass} role="tooltip">
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: colorA }} aria-hidden />
          <span>{lineA}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: colorB }} aria-hidden />
          <span>{lineB}</span>
        </div>
      </div>
      <span className="sr-only">{hoverSummary}</span>
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} props.eyebrow
 * @param {import('react').ReactNode} props.metric
 * @param {string} [props.metricClassName]
 * @param {import('react').ReactNode} [props.subtext]
 * @param {string} props.footerLabel
 * @param {import('react').ReactNode} props.footerValue
 * @param {import('react').ReactNode} [props.aside] — e.g. donut, placed right of metric column
 * @param {'split'|'solid'|'none'} [props.progressVariant='none']
 * @param {number} [props.splitLeftPct]
 * @param {string} [props.splitLeftClass]
 * @param {string} [props.splitRightClass]
 * @param {number} [props.solidPct]
 * @param {string} [props.solidFillClass]
 * @param {string} [props.progressAriaLabel]
 * @param {import('react').ReactNode} [props.belowProgress] — legend row under bar
 * @param {string} [props.footnote]
 */
export default function KeyMetricCard({
  eyebrow,
  metric,
  metricClassName = 'text-4xl font-bold tabular-nums tracking-tight leading-none text-gray-900',
  subtext,
  footerLabel,
  footerValue,
  aside = null,
  progressVariant = 'none',
  splitLeftPct = 50,
  splitLeftClass = 'bg-indigo-600',
  splitRightClass = 'bg-teal-500',
  solidPct = 0,
  solidFillClass = 'bg-emerald-500',
  progressAriaLabel,
  belowProgress = null,
  footnote,
}) {
  return (
    <div className="flex h-full flex-col rounded-[10px] border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{eyebrow}</p>

      <div className="mt-3 flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          <div className={metricClassName}>{metric}</div>
          {subtext ? <div className="mt-2 text-sm leading-snug text-gray-600">{subtext}</div> : null}
        </div>
        {aside ? <div className="flex shrink-0 flex-col items-center justify-start pt-1">{aside}</div> : null}
      </div>

      <div className="my-4 border-t border-gray-100" />

      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="leading-snug text-gray-500">{footerLabel}</span>
        <span className="shrink-0 text-right font-semibold tabular-nums text-gray-900">{footerValue}</span>
      </div>

      {progressVariant === 'split' ? (
        <div className="mt-3">
          <SplitProgressBar
            leftPct={splitLeftPct}
            leftClassName={splitLeftClass}
            rightClassName={splitRightClass}
            ariaLabel={progressAriaLabel}
          />
          {belowProgress ? <div className="mt-2">{belowProgress}</div> : null}
        </div>
      ) : null}

      {progressVariant === 'solid' ? (
        <div className="mt-3">
          <SolidProgressBar pct={solidPct} fillClassName={solidFillClass} ariaLabel={progressAriaLabel} />
          {belowProgress ? <div className="mt-2">{belowProgress}</div> : null}
        </div>
      ) : null}

      {progressVariant === 'none' && belowProgress ? <div className="mt-3">{belowProgress}</div> : null}

      {footnote ? <p className="mt-2 text-[11px] italic leading-relaxed text-gray-400">{footnote}</p> : null}
    </div>
  )
}
