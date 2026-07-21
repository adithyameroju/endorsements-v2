import {
  portalRowActionGhost,
  portalRowActionGhostCompact,
  portalRowActionPrimary,
  portalRowActionPrimaryCompact,
  portalRowActionPrimarySolid,
} from '../../lib/portalChipTokens'

/** Compact CTA row for triggered alerts (panel, history, module nudges). */
export default function AlertInboxActions({
  primaryLabel,
  onPrimary,
  onDismiss,
  secondaryLabel,
  onSecondary,
  align = 'start',
  size = 'default',
  primaryVariant = 'default',
}) {
  const compact = size === 'compact'
  const primaryClass =
    primaryVariant === 'solid'
      ? portalRowActionPrimarySolid
      : compact
        ? portalRowActionPrimaryCompact
        : portalRowActionPrimary
  const ghostClass = compact ? portalRowActionGhostCompact : portalRowActionGhost

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${align === 'end' ? 'justify-end' : 'justify-start'}`}>
      {primaryLabel && onPrimary ? (
        <button type="button" onClick={onPrimary} className={`inline-flex ${primaryClass}`}>
          {primaryLabel}
        </button>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <button type="button" onClick={onSecondary} className={ghostClass}>
          {secondaryLabel}
        </button>
      ) : null}
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className={ghostClass}>
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
