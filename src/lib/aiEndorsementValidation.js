import { hasPlans, validateBasicFields } from './quickAddValidation'
import { ENDORSEMENT_TYPE_LABELS, getGridField } from './aiEndorsementSchema'

/**
 * @param {import('./aiEndorsementMapper').AiEndorsementRow} row
 * @returns {Record<string, string>}
 */
export function validateAiRow(row) {
  if (row.excluded) return {}

  const type = row.endorsementType || 'onboarding'
  const errors = {}

  if (!type) errors.endorsementType = 'Endorsement type is required'

  if (type === 'onboarding') {
    Object.assign(errors, validateBasicFields(rowToEmployeeShape(row)))
    if (!hasPlans(rowToEmployeeShape(row))) {
      errors.plans = 'Select at least one base plan (GMC or GPA).'
    }
    if (row.relation && row.relation !== 'Self') {
      errors.relation = 'Onboarding rows should use relation Self'
    }
  }

  if (type === 'add_dependent') {
    if (!row.empId?.trim()) errors.empId = 'Employee ID is required to link dependent'
    if (!row.memberName?.trim()) errors.memberName = 'Member name is required'
    if (!row.relation?.trim() || row.relation === 'Self') {
      errors.relation = 'Select dependent relation'
    }
    if (!row.dob) errors.dob = 'Date of birth is required'
    if (!row.gender) errors.gender = 'Gender is required'
  }

  if (type === 'update') {
    if (!row.empId?.trim()) errors.empId = 'Employee ID is required'
    if (!row.memberName?.trim() && !row.email?.trim()) {
      errors.memberName = 'Member name or email required for update'
    }
  }

  if (type === 'delete') {
    if (!row.empId?.trim()) errors.empId = 'Employee ID is required'
  }

  if (type === 'offboard') {
    if (!row.empId?.trim()) errors.empId = 'Employee ID is required'
    if (!row.dateOfLeaving) errors.dateOfLeaving = 'Date of leaving is required'
  }

  return errors
}

/**
 * @param {import('./aiEndorsementMapper').AiEndorsementRow[]} rows
 */
export function validateAllAiRows(rows) {
  const onboardingIds = rows
    .filter((r) => !r.excluded && r.endorsementType === 'onboarding')
    .map((r) => r.empId?.trim())
    .filter(Boolean)

  const dupes = new Set()
  const seen = new Set()
  for (const id of onboardingIds) {
    if (seen.has(id)) dupes.add(id)
    seen.add(id)
  }

  return rows.map((row) => {
    const errors = validateAiRow(row)
    if (
      !row.excluded &&
      row.endorsementType === 'onboarding' &&
      row.empId?.trim() &&
      dupes.has(row.empId.trim())
    ) {
      errors.empId = 'Duplicate employee ID in this file'
    }
    const valid = row.excluded || Object.keys(errors).length === 0
    const status = row.excluded ? 'excluded' : valid ? 'ready' : 'error'
    return {
      rowIndex: row.rowIndex,
      rowId: row.id,
      errors,
      valid,
      status,
      errorCount: Object.keys(errors).length,
    }
  })
}

export function countReadyRows(validation) {
  return validation.filter((v) => v.valid && v.status === 'ready').length
}

export function countErrorRows(validation) {
  return validation.filter((v) => v.status === 'error').length
}

export function buildGridErrorBannerSummary(validation) {
  const errorRows = validation.filter((v) => v.status === 'error')
  if (!errorRows.length) return { affectedCount: 0, fieldLabels: [] }

  const fieldIds = new Set()
  for (const row of errorRows) {
    Object.keys(row.errors).forEach((k) => fieldIds.add(k))
  }
  const fieldLabels = [...fieldIds]
    .map((id) => getGridField(id)?.label ?? id)
    .slice(0, 4)

  return {
    affectedCount: errorRows.length,
    fieldLabels,
    message: `${errorRows.length} row${errorRows.length === 1 ? '' : 's'} need fixes${fieldLabels.length ? ` · ${fieldLabels.join(', ')}` : ''}`,
  }
}

/** Aggregate errors by column for side panel. */
export function columnErrorCounts(validation) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const row of validation) {
    if (row.status !== 'error') continue
    for (const fieldId of Object.keys(row.errors)) {
      counts[fieldId] = (counts[fieldId] || 0) + 1
    }
  }
  return counts
}

const SHORT_STATUS_BY_FIELD = {
  memberName: 'Invalid full name',
  dob: 'Invalid DOB',
  email: 'Invalid email',
  empId: 'Invalid Emp ID',
  relation: 'Invalid relation',
  gender: 'Invalid gender',
  doj: 'Invalid DOJ',
  mobile: 'Invalid mobile',
  endorsementType: 'Invalid type',
  gmcBasePlan: 'Add GMC base',
  gpaBasePlan: 'Add GPA base',
  gmcTopup: 'Add GMC top-up',
  gmcAddons: 'Add GMC add-on',
  gmcSecondaryPlan: 'Add GMC secondary',
  plans: 'Add GMC base',
  uhid: 'Invalid UHID',
}

/** One-line status copy for the grid Status column. */
export function shortStatusForRow(validation) {
  if (!validation) return ''
  if (validation.status === 'ready') return 'Good to go'
  if (validation.status === 'excluded') return 'Skipped'
  const firstField = Object.keys(validation.errors || {})[0]
  if (!firstField) return 'Needs fix'
  if (SHORT_STATUS_BY_FIELD[firstField]) return SHORT_STATUS_BY_FIELD[firstField]
  const label = getGridField(firstField)?.label ?? firstField
  return `Fix ${label}`
}

function rowToEmployeeShape(row) {
  return {
    name: row.memberName,
    empId: row.empId,
    email: row.email,
    dob: row.dob,
    gender: row.gender,
    doj: row.doj,
    mobile: row.mobile,
    plans: row.plans || {},
    dependents: [],
  }
}

export function rowToPremiumEmployee(row) {
  const plans = { ...(row.plans || {}) }
  if (plans.gmcAddons && typeof plans.gmcAddons === 'string') {
    plans.gmcAddons = plans.gmcAddons ? [plans.gmcAddons] : []
  }
  return {
    name: row.memberName,
    empId: row.empId,
    email: row.email,
    dob: row.dob,
    gender: row.gender,
    doj: row.doj,
    mobile: row.mobile,
    plans,
    dependents: row.endorsementType === 'add_dependent' ? [{ name: row.memberName }] : [],
    endorsementType: row.endorsementType,
  }
}

export function endorsementTypeLabel(type) {
  return ENDORSEMENT_TYPE_LABELS[type] ?? type
}
