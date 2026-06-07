/**
 * Shared derivation for endorsement history rows (dashboard + schedules).
 * Rows may set overrides: actionCategory, automationSource ('hrms' | 'app_enrolment'), actorType ('user' | 'system').
 */

/** @param {string} action */
export function deriveActionCategory(action) {
  const s = String(action || '').toLowerCase()
  if (s.includes('delete')) return 'Deletion'
  if (s.includes('update')) return 'Modification'
  return 'Addition'
}

/** @param {{ type?: string, action?: string }} row */
export function deriveRunModeLabel(row) {
  const t = row.type
  if (t === 'bulk') return 'Bulk'
  if (t === 'sync') return 'HRMS'
  if (t === 'enrollment') return 'App enrolment'
  return 'Quick'
}

/**
 * @param {{ doneBy?: string, actorType?: string, automationSource?: string | null, type?: string }} row
 * @returns {'user' | 'system'}
 */
export function deriveActorType(row) {
  if (row.actorType === 'system' || row.actorType === 'user') return row.actorType
  const name = String(row.doneBy || '').trim().toLowerCase()
  if (name === 'system') return 'system'
  return 'user'
}

/**
 * @param {{ automationSource?: string | null, type?: string }} row
 * @returns {'hrms' | 'app_enrolment' | null}
 */
export function deriveAutomationSource(row) {
  if (row.automationSource === 'hrms' || row.automationSource === 'app_enrolment') return row.automationSource
  if (deriveActorType(row) !== 'system') return null
  if (row.type === 'sync') return 'hrms'
  if (row.type === 'enrollment') return 'app_enrolment'
  return 'hrms'
}

/** Single-line summary for CSV / search */
export function formatDoneBySummary(row) {
  if (deriveActorType(row) === 'system') return 'System'
  return String(row.doneBy || '—').trim() || '—'
}
