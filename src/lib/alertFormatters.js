import { formatInr } from './currencyFormat'
import { ALERT_MODULES } from '../data/alertsMock'

export function formatAlertChannels(channels = []) {
  const parts = []
  if (channels.includes('email')) parts.push('Email')
  if (channels.includes('dashboard')) parts.push('Dashboard')
  return parts.join(' + ') || '—'
}

export function formatAlertCondition(rule) {
  const moduleLabel = ALERT_MODULES[rule?.module]?.label ?? 'Module'
  if (rule?.module === 'cd_balance' && rule.thresholdInr != null) {
    return `When CD balance drops below ${formatInr(rule.thresholdInr)}`
  }
  if (rule?.description?.trim()) {
    return rule.description.trim()
  }
  return `When a ${moduleLabel.toLowerCase()} event matches this rule`
}

export function formatAlertPreview(rule) {
  const condition = formatAlertCondition(rule)
  const channels = formatAlertChannels(rule?.channels)
  return `${condition} → notify via ${channels}.`
}

export function severityStyles(severity) {
  switch (severity) {
    case 'critical':
      return 'bg-rose-50 text-rose-700 ring-rose-200/80'
    case 'info':
      return 'bg-sky-50 text-sky-700 ring-sky-200/80'
    default:
      return 'bg-amber-50 text-amber-800 ring-amber-200/80'
  }
}
