import { buildQuickAddPremiumBreakdown, buildQuickAddPremiumDeltaBreakdown } from './quickAddPremiumEstimate'
import { cloneEmployeeGmcPlans } from './planHelpers'

/** Rich demo stack merged with HR record so GMC exists for “same as employee” on dependents. */
const DEMO_PLAN_FALLBACK = {
  gmcBasePlan: 'bp2',
  gmcSecondaryPlan: 'sp1',
  gmcAddons: ['ap1', 'ap3'],
  gpaBasePlan: 'gpa-bp2',
  gpaSiType: 'fixed',
}

export function mergeDemoEmployeePlans(selectedEmployee) {
  return { ...DEMO_PLAN_FALLBACK, ...(selectedEmployee?.plans || {}) }
}

/** Aligns with Quick Add premium estimator (`empId` required). */
export function normalizeEmployeeForPremium(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return {
    ...raw,
    empId: raw.empId ?? raw.id ?? '',
  }
}

const MOCK_CD_AVAILABLE_RUPEES = 48_50_000

/**
 * Rewrites premium line labels so the CD widget matches the active update flow.
 * @param {'quick-update'|'add-spouse'|'add-newborn'} flow
 * @param {{ spouseName?: string, childrenCount?: number, incrementalOnly?: boolean }} meta
 */
export function applyFlowLabelsToPremiumLines(lines, flow, meta = {}) {
  if (!lines?.length) return lines

  const inc = meta.incrementalOnly === true

  const flowTitle =
    flow === 'add-spouse'
      ? 'Add spouse'
      : flow === 'add-newborn'
        ? (meta.childrenCount ?? 1) > 1
          ? 'Add children'
          : 'Add child'
        : 'Quick update'

  return lines.map((line) => {
    if (line.id === 'subtotal_ex_gst') {
      const hint = inc
        ? ' · incremental vs HR (new dependents / plan changes only)'
        : flow === 'add-spouse'
          ? ' · incl. new spouse on GMC'
          : flow === 'add-newborn'
            ? ` · incl. ${meta.childrenCount ?? 0} child(ren) on GMC`
            : ' · employee & dependent updates'
      return {
        ...line,
        label: `Subtotal (excl. GST)${hint}`,
      }
    }
    if (line.id === 'gst') {
      return { ...line, label: `${line.label}${inc ? ' · incremental' : ` · ${flowTitle}`}` }
    }
    if (line.id === 'total') {
      return {
        ...line,
        label: inc
          ? `Total CD draw (incl. GST) · incremental`
          : `Total CD draw (incl. GST) · ${flowTitle}`,
      }
    }
    if (line.id === 'gmc_base') {
      if (inc) return line
      let extra = ` · ${flowTitle}`
      if (flow === 'add-spouse' && meta.spouseName?.trim()) {
        extra += ` · ${meta.spouseName.trim()}`
      }
      if (flow === 'add-newborn' && (meta.childrenCount ?? 0) > 0) {
        extra += ` · ${meta.childrenCount} child(ren)`
      }
      return { ...line, label: `${line.label}${extra}` }
    }
    if (line.id === 'gpa_base') {
      if (inc) return line
      return { ...line, label: `${line.label} · ${flowTitle} (employee)` }
    }
    if (line.id === 'gmc_secondary' || line.id === 'gmc_addons') {
      if (inc) return line
      return { ...line, label: `${line.label} · ${flowTitle}` }
    }
    return line
  })
}

/**
 * @param {object[]} employees — raw employee rows (id or empId ok)
 * @param {{
 *   flow?: 'quick-update'|'add-spouse'|'add-newborn',
 *   flowMeta?: object,
 *   baselineEmployees?: object[],
 * }} options
 */
export function computeUpdateFlowCdState(employees, options = {}) {
  const normalized = (employees || []).map(normalizeEmployeeForPremium)
  const baselineRaw = options.baselineEmployees
  const hasBaseline = Array.isArray(baselineRaw) && baselineRaw.length > 0
  const baselineNorm = hasBaseline ? baselineRaw.map(normalizeEmployeeForPremium) : null

  const { totalInclGst, lines: rawLines } = hasBaseline
    ? buildQuickAddPremiumDeltaBreakdown(normalized, baselineNorm)
    : buildQuickAddPremiumBreakdown(normalized)

  const flow = options.flow ?? 'quick-update'
  const flowMeta = { ...(options.flowMeta ?? {}), ...(hasBaseline ? { incrementalOnly: true } : {}) }
  const lines = applyFlowLabelsToPremiumLines(rawLines, flow, flowMeta)
  return {
    currentCd: MOCK_CD_AVAILABLE_RUPEES,
    estimatedCdDraw: totalInclGst,
    cdAfterSubmit: MOCK_CD_AVAILABLE_RUPEES - totalInclGst,
    cdBreakdownLines: lines,
  }
}

/** HR snapshot for quick update CD delta: same employee fields as form, HR-merged plans, no dependents. */
export function buildQuickUpdateCdBaselineEmployee(formData, selectedEmployee) {
  if (!formData || !selectedEmployee) return null
  const hrPlans = mergeDemoEmployeePlans(selectedEmployee)
  return normalizeEmployeeForPremium({
    ...formData,
    empId: formData.empId ?? formData.id ?? '',
    plans: hrPlans,
    dependents: [],
  })
}

/** Baseline before adding spouse / children: HR plans only, no new dependents on policy. */
export function buildLifeEventCdBaselineEmployee(selectedEmployee) {
  if (!selectedEmployee) return null
  const merged = mergeDemoEmployeePlans(selectedEmployee)
  return normalizeEmployeeForPremium({
    ...selectedEmployee,
    empId: selectedEmployee.id,
    plans: merged,
    dependents: [],
  })
}

/** Single-employee row for Quick Update (form uses `id` as employee id). */
export function buildQuickUpdatePremiumEmployees(formData) {
  if (!formData) return []
  return [normalizeEmployeeForPremium(formData)]
}

export function buildSpouseFlowPremiumEmployees(selectedEmployee, spouseData, employeePlansOverride) {
  if (!selectedEmployee) return []
  const merged = employeePlansOverride ?? mergeDemoEmployeePlans(selectedEmployee)
  const base = {
    ...selectedEmployee,
    empId: selectedEmployee.id,
    plans: merged,
    dependents: [],
  }
  if (spouseData?.name?.trim() && spouseData.dob) {
    base.dependents = [
      {
        id: 'new-spouse',
        name: spouseData.name,
        relation: 'Spouse',
        dob: spouseData.dob,
        gender: spouseData.gender,
        dateOfMarriage: spouseData.dateOfMarriage,
        samePlansAsEmployee: spouseData.samePlansAsEmployee !== false,
        plans: spouseData.samePlansAsEmployee !== false
          ? cloneEmployeeGmcPlans(merged)
          : { ...(spouseData.plans || {}) },
      },
    ]
  }
  return [normalizeEmployeeForPremium(base)]
}

export function buildNewbornFlowPremiumEmployees(selectedEmployee, children, employeePlansOverride) {
  if (!selectedEmployee) return []
  const merged = employeePlansOverride ?? mergeDemoEmployeePlans(selectedEmployee)
  const base = {
    ...selectedEmployee,
    empId: selectedEmployee.id,
    plans: merged,
    dependents: [],
  }
  const deps = (children || [])
    .filter((c) => c.name?.trim() && c.dob && c.gender)
    .map((c) => ({
      id: c.id,
      name: c.name,
      relation: c.gender === 'Female' ? 'Daughter' : 'Son',
      dob: c.dob,
      gender: c.gender,
      samePlansAsEmployee: c.samePlansAsEmployee !== false,
      plans: c.samePlansAsEmployee !== false ? cloneEmployeeGmcPlans(merged) : { ...(c.plans || {}) },
    }))
  base.dependents = deps
  return [normalizeEmployeeForPremium(base)]
}
