/** Summary chips for QuickAddBatchStickyFooter in update-employee flows. */

export function quickUpdateBatchSummary(formData) {
  if (!formData) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const req = ['name', 'email', 'dob', 'gender', 'doj']
  const basicsOk = req.every((f) => formData[f] && String(formData[f]).trim())
  const deps = formData.dependents || []
  const dependentsDatesOk =
    deps.length === 0 ||
    deps.every(
      (d) =>
        d.removalScheduled ||
        String(d.coverageEffectiveDate || '').trim(),
    )
  const ok = basicsOk && dependentsDatesOk
  return {
    count: 1,
    basicsComplete: ok ? 1 : 0,
    dependentCount: deps.length,
  }
}

export function spouseFlowBatchSummary(selectedEmployee, spouseData) {
  if (!selectedEmployee) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const ok =
    !!(
      spouseData?.name?.trim() &&
      spouseData?.dob &&
      spouseData?.dateOfMarriage &&
      String(spouseData?.coverageEffectiveDate || '').trim()
    )
  return { count: 1, basicsComplete: ok ? 1 : 0, dependentCount: ok ? 1 : 0 }
}

export function newbornFlowBatchSummary(selectedEmployee, children) {
  if (!selectedEmployee) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const kids = children || []
  const ok =
    kids.length > 0 &&
    kids.every(
      (c) =>
        c.name?.trim() &&
        c.dob &&
        c.gender &&
        String(c.coverageEffectiveDate || '').trim(),
    )
  return {
    count: 1,
    basicsComplete: ok ? 1 : 0,
    dependentCount: kids.length,
  }
}
