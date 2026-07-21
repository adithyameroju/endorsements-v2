/** Global alert modules — employer portal. */
export const ALERT_MODULES = {
  cd_balance: {
    id: 'cd_balance',
    label: 'CD Balance',
    description: 'Wallet balance, runway, and top-up thresholds.',
    path: '/cd-balance',
  },
  endorsements: {
    id: 'endorsements',
    label: 'Endorsements',
    description: 'Batch completion, failures, and schedule milestones.',
    path: '/',
  },
  claims: {
    id: 'claims',
    label: 'Claims',
    description: 'Document requests, assessments, and settlement delays.',
    path: '/claims',
  },
  policy: {
    id: 'policy',
    label: 'Policy coverage',
    description: 'Renewal windows and coverage changes.',
    path: '/policy-management/coverage',
  },
}

export const ALERT_MODULE_LIST = Object.values(ALERT_MODULES)

/** Default primary CTA when a triggered alert is shown on its module page (avoids noop navigation). */
export const ALERT_MODULE_IN_PAGE_ACTIONS = {
  cd_balance: { label: 'Reconcile' },
  endorsements: { label: 'View queue' },
  claims: { label: 'View claims' },
  policy: { label: 'View coverage' },
}

/** Starter templates — one-click rule creation. */
export const ALERT_TEMPLATES = [
  {
    id: 'tpl-cd-low',
    module: 'cd_balance',
    title: 'Low balance warning',
    description: 'Notify when CD wallet drops below your buffer threshold.',
    thresholdInr: 10_00_000,
    severity: 'warning',
    channels: ['email', 'dashboard'],
  },
  {
    id: 'tpl-cd-critical',
    module: 'cd_balance',
    title: 'Critical balance',
    description: 'Urgent notice before policy buffer is breached.',
    thresholdInr: 5_00_000,
    severity: 'critical',
    channels: ['email'],
  },
  {
    id: 'tpl-endorse-fail',
    module: 'endorsements',
    title: 'Batch failure',
    description: 'When an endorsement batch fails validation or posting.',
    thresholdInr: null,
    severity: 'critical',
    channels: ['email', 'dashboard'],
  },
  {
    id: 'tpl-claims-docs',
    module: 'claims',
    title: 'Documents pending',
    description: 'When claims await employer document upload beyond 3 days.',
    thresholdInr: null,
    severity: 'warning',
    channels: ['dashboard'],
  },
  {
    id: 'tpl-policy-renewal',
    module: 'policy',
    title: 'Renewal window',
    description: '60 days before policy renewal — review coverage and CD buffer.',
    thresholdInr: null,
    severity: 'info',
    channels: ['email', 'dashboard'],
  },
]

/** User-configured alert rules (global). */
export const initialAlertRulesSeed = [
  {
    id: 'alert-1',
    module: 'cd_balance',
    title: 'Low balance warning',
    description: 'Notify when CD wallet drops below threshold.',
    thresholdInr: 10_00_000,
    channels: ['email', 'dashboard'],
    status: 'active',
    severity: 'warning',
    lastTriggeredAt: '2h ago',
  },
  {
    id: 'alert-2',
    module: 'cd_balance',
    title: 'Critical balance',
    description: 'Urgent notice before policy buffer is breached.',
    thresholdInr: 5_00_000,
    channels: ['email'],
    status: 'paused',
    severity: 'critical',
    lastTriggeredAt: null,
  },
  {
    id: 'alert-3',
    module: 'endorsements',
    title: 'Batch failure',
    description: 'When an endorsement batch fails validation or posting.',
    thresholdInr: null,
    channels: ['email', 'dashboard'],
    status: 'active',
    severity: 'critical',
    lastTriggeredAt: '5h ago',
  },
  {
    id: 'alert-4',
    module: 'claims',
    title: 'Documents pending',
    description: 'When claims await employer document upload beyond 3 days.',
    thresholdInr: null,
    channels: ['dashboard'],
    status: 'active',
    severity: 'warning',
    lastTriggeredAt: 'Yesterday',
  },
]

/** Triggered alert instances — actionable inbox (header panel Alerts tab). */
export const initialAlertInboxSeed = [
  {
    id: 'inbox-1',
    alertRuleId: 'alert-1',
    module: 'cd_balance',
    title: 'CD balance below ₹10L',
    body: 'Acme India wallet is at ₹48.5L but your alert threshold is ₹10L buffer check recommended before the next endorsement batch.',
    severity: 'warning',
    actionLabel: 'Review CD balance',
    actionPath: '/cd-balance',
    unread: true,
    triggeredAt: '2h ago',
    status: 'open',
  },
  {
    id: 'inbox-2',
    alertRuleId: 'alert-3',
    module: 'endorsements',
    title: 'Endorsement batch needs review',
    body: 'Batch #8842 has 2 rows with validation errors. Fix before cutoff to avoid premium drift.',
    severity: 'critical',
    actionLabel: 'Open endorsements',
    actionPath: '/',
    unread: true,
    triggeredAt: '5h ago',
    status: 'open',
  },
  {
    id: 'inbox-3',
    alertRuleId: 'alert-4',
    module: 'claims',
    title: '3 claims awaiting documents',
    body: 'Employees have pending document requests older than 3 days.',
    severity: 'warning',
    actionLabel: 'View claims',
    actionPath: '/claims',
    unread: false,
    triggeredAt: 'Yesterday',
    status: 'acknowledged',
  },
]
