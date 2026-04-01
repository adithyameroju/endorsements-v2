/** Summary chips for QuickAddBatchStickyFooter in update-employee flows. */

export function quickUpdateBatchSummary(formData) {
  if (!formData) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const req = ['name', 'email', 'dob', 'gender', 'doj']
  const ok = req.every((f) => formData[f] && String(formData[f]).trim())
  return {
    count: 1,
    basicsComplete: ok ? 1 : 0,
    dependentCount: formData.dependents?.length ?? 0,
  }
}

export function spouseFlowBatchSummary(selectedEmployee, spouseData) {
  if (!selectedEmployee) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const ok =
    !!(spouseData?.name?.trim() && spouseData?.dob && spouseData?.dateOfMarriage)
  return { count: 1, basicsComplete: ok ? 1 : 0, dependentCount: ok ? 1 : 0 }
}

export function newbornFlowBatchSummary(selectedEmployee, children) {
  if (!selectedEmployee) return { count: 0, basicsComplete: 0, dependentCount: 0 }
  const kids = children || []
  const ok =
    kids.length > 0 && kids.every((c) => c.name?.trim() && c.dob && c.gender)
  return {
    count: 1,
    basicsComplete: ok ? 1 : 0,
    dependentCount: kids.length,
  }
}
