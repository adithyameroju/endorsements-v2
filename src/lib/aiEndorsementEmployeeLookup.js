import { mockEmployees } from '../data/mockData'
import { createEmptyRow } from './aiEndorsementSchema'

const LOOKUP_INTENT_LABELS = {
  update: 'Find employee to update',
  delete: 'Find employee to delete',
  offboard: 'Find employee to offboard',
}

export function lookupIntentLabel(intent) {
  return LOOKUP_INTENT_LABELS[intent] ?? 'Find employee'
}

/** Search roster by EMP ID (priority), name, or email. */
export function searchEmployeesByQuery(query) {
  const q = query.trim()
  if (!q) return mockEmployees

  const lower = q.toLowerCase()
  const exactId = mockEmployees.filter((emp) => emp.id.toLowerCase() === lower)
  if (exactId.length) return exactId

  return mockEmployees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(lower) ||
      emp.name.toLowerCase().includes(lower) ||
      emp.email.toLowerCase().includes(lower),
  )
}

export function mapMockEmployeeToAiRow(employee, endorsementType, rowIndex) {
  return createEmptyRow(rowIndex, {
    rowSource: 'manual',
    endorsementType,
    relation: 'Self',
    memberName: employee.name ?? '',
    empId: employee.id ?? '',
    email: employee.email ?? '',
    dob: employee.dob ?? '',
    gender: employee.gender ?? '',
    doj: employee.doj ?? '',
    dateOfLeaving: '',
    mobile: employee.mobile ?? '',
    plans: employee.plans ? { ...employee.plans } : {},
  })
}

export function isEmployeeAlreadyInGrid(rows, empId, endorsementType) {
  const normalized = (empId || '').trim().toLowerCase()
  if (!normalized) return false
  return rows.some(
    (r) =>
      (r.empId || '').trim().toLowerCase() === normalized &&
      (r.endorsementType || 'onboarding') === endorsementType,
  )
}
