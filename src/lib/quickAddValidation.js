/**
 * Quick Add — validation buckets for banner, tabs, and section highlights.
 */

export function validateBasicFields(emp) {
  const errors = {}
  if (!emp.name?.trim()) errors.name = 'Name is required'
  if (!emp.empId?.trim()) errors.empId = 'Employee ID is required'
  if (!emp.email?.trim()) errors.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(emp.email)) errors.email = 'Invalid email format'
  if (!emp.dob) errors.dob = 'Date of birth is required'
  if (!emp.gender) errors.gender = 'Gender is required'
  if (!emp.doj) errors.doj = 'Date of joining is required'
  if (emp.mobile?.trim() && !/^\d{10}$/.test(emp.mobile.trim())) {
    errors.mobile = 'Must be 10 digits'
  }
  return errors
}

export function hasPlans(emp) {
  return !!(emp.plans && (emp.plans.gmcBasePlan || emp.plans.gpaBasePlan))
}

export function validatePlanFields(emp) {
  const errors = {}
  if (!hasPlans(emp)) {
    errors.plans = 'Select at least one base plan (GMC or GPA).'
  }
  return errors
}

export function validateDependentFields(emp) {
  const errors = {}
  ;(emp.dependents || []).forEach((dep, i) => {
    if (!dep.name?.trim()) errors[`dep_${i}_name`] = 'Dependent name is required'
    if (!dep.dob) errors[`dep_${i}_dob`] = 'Dependent date of birth is required'
    if (!dep.gender) errors[`dep_${i}_gender`] = 'Dependent gender is required'
  })
  return errors
}

export function validateEmployeeSections(emp) {
  return {
    basic: validateBasicFields(emp),
    plans: validatePlanFields(emp),
    dependents: validateDependentFields(emp),
  }
}

export function employeeHasAnyValidationIssue(emp) {
  const v = validateEmployeeSections(emp)
  return (
    Object.keys(v.basic).length + Object.keys(v.plans).length + Object.keys(v.dependents).length > 0
  )
}

export function sectionErrorFlags(emp) {
  const v = validateEmployeeSections(emp)
  return {
    basic: Object.keys(v.basic).length > 0,
    plans: Object.keys(v.plans).length > 0,
    dependents: Object.keys(v.dependents).length > 0,
  }
}

/** Short tooltip for employee tab (hover). */
export function formatEmployeeIssueTooltip(emp) {
  if (!employeeHasAnyValidationIssue(emp)) return ''
  const v = validateEmployeeSections(emp)
  const parts = []
  if (Object.keys(v.basic).length) {
    const msgs = Object.values(v.basic).slice(0, 2)
    parts.push(`Basic info: ${msgs.join('; ')}${Object.keys(v.basic).length > 2 ? '…' : ''}`)
  }
  if (Object.keys(v.plans).length) {
    parts.push(`Plans: ${Object.values(v.plans)[0]}`)
  }
  if (Object.keys(v.dependents).length) {
    parts.push(
      `Dependents: ${Object.keys(v.dependents).length} field(s) need attention`,
    )
  }
  return parts.join(' · ')
}

/**
 * One-line alert copy for the top strip (does not grow with error count).
 * @returns {{ affectedCount: number, line: string }}
 */
export function buildQuickAddErrorBannerSummary(employees) {
  const withIssues = employees.filter(employeeHasAnyValidationIssue)
  if (withIssues.length === 0) {
    return { affectedCount: 0, line: '' }
  }

  let anyBasic = false
  let anyPlans = false
  let anyDeps = false
  for (const emp of withIssues) {
    const f = sectionErrorFlags(emp)
    if (f.basic) anyBasic = true
    if (f.plans) anyPlans = true
    if (f.dependents) anyDeps = true
  }

  const areas = []
  if (anyBasic) areas.push('Basic')
  if (anyPlans) areas.push('Plans')
  if (anyDeps) areas.push('Dependents')

  const n = withIssues.length
  const who = n === 1 ? '1 employee has errors' : `${n} employees have errors`
  const where = areas.length ? ` · ${areas.join(', ')}` : ''
  const line = `${who}${where}.`

  return { affectedCount: n, line }
}
