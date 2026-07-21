import {
  helpBadgeBeta,
  helpBadgeMajor,
  helpBadgeMinor,
  helpBadgeNew,
} from '../../lib/helpUiTokens'

const STATUS_CLASS = {
  active: helpBadgeNew,
  paused: 'inline-flex rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600',
  critical: helpBadgeMajor,
  warning: helpBadgeBeta,
  info: helpBadgeMinor,
}

const STATUS_LABEL = {
  active: 'Active',
  paused: 'Paused',
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

/** Semantic status badge for alert rules and triggered items. */
export default function AlertStatusBadge({ status, label, className = '' }) {
  const key = status?.toLowerCase?.() ?? 'info'
  const classes = STATUS_CLASS[key] ?? STATUS_CLASS.info
  const text = label ?? STATUS_LABEL[key] ?? status

  return <span className={`${classes} ${className}`.trim()}>{text}</span>
}
