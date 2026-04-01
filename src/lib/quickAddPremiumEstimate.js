/**
 * Mock pro-rata premium breakdown for Quick Add CD widget (plan bases + GST).
 * Amounts are illustrative; replace with API pricing when available.
 */

const GST_RATE = 0.18

/** Per-employee GMC base (excl. dependents on that line) */
const GMC_BASE_COMPLETE = 28_000
const GMC_BASE_PARTIAL = 12_000
/** Per dependent on GMC */
const GMC_DEP_COMPLETE = 14_000
const GMC_DEP_PARTIAL = 6_000

const GPA_COMPLETE = 14_000
const GPA_PARTIAL = 6_000

const SECONDARY_BUMP = 6_000
const ADDON_PER_SELECTED = 3_500

function isFilled(emp) {
  return emp.name?.trim() && emp.empId?.trim() && emp.email?.trim()
}

function isBasicComplete(emp) {
  const rf = ['name', 'empId', 'email', 'dob', 'gender', 'doj']
  return rf.every((f) => emp[f] && String(emp[f]).trim())
}

function hasGmcBase(emp) {
  return !!(emp.plans?.gmcBasePlan)
}

function hasGpaBase(emp) {
  return !!(emp.plans?.gpaBasePlan)
}

function hasSecondary(emp) {
  const s = emp.plans?.gmcSecondaryPlan
  return !!(s && s !== 'none')
}

function addonCount(emp) {
  return emp.plans?.gmcAddons?.length || 0
}

/**
 * @returns {{
 *   subtotalExGst: number,
 *   gstAmount: number,
 *   gstRatePercent: number,
 *   totalInclGst: number,
 *   lines: { id: string, label: string, amount: number }[],
 * }}
 */
export function buildQuickAddPremiumBreakdown(employees) {
  let gmcBaseAmt = 0
  let gmcLives = 0
  let gpaAmt = 0
  let gpaLives = 0
  let secondaryAmt = 0
  let secondaryLives = 0
  let addonsAmt = 0
  let addonEmployees = 0

  for (const emp of employees) {
    const deps = emp.dependents?.length || 0

    if (hasGmcBase(emp)) {
      if (isBasicComplete(emp)) {
        gmcLives += 1 + deps
        gmcBaseAmt += GMC_BASE_COMPLETE + deps * GMC_DEP_COMPLETE
      } else if (isFilled(emp)) {
        gmcLives += 1 + deps
        gmcBaseAmt += GMC_BASE_PARTIAL + deps * GMC_DEP_PARTIAL
      }
    }

    if (hasGpaBase(emp)) {
      if (isBasicComplete(emp)) {
        gpaLives += 1
        gpaAmt += GPA_COMPLETE
      } else if (isFilled(emp)) {
        gpaLives += 1
        gpaAmt += GPA_PARTIAL
      }
    }

    if (hasSecondary(emp) && (isBasicComplete(emp) || isFilled(emp))) {
      secondaryLives += 1
      secondaryAmt += SECONDARY_BUMP
    }

    const ac = addonCount(emp)
    if (ac > 0 && (isBasicComplete(emp) || isFilled(emp))) {
      addonEmployees += 1
      addonsAmt += ac * ADDON_PER_SELECTED
    }
  }

  const planRows = []
  const lifeWord = (n) => (n === 1 ? 'life' : 'lives')

  if (gmcBaseAmt > 0) {
    planRows.push({
      id: 'gmc_base',
      label: `GMC base plan (${gmcLives} ${lifeWord(gmcLives)})`,
      amount: gmcBaseAmt,
    })
  }
  if (gpaAmt > 0) {
    planRows.push({
      id: 'gpa_base',
      label: `GPA base (${gpaLives} ${lifeWord(gpaLives)})`,
      amount: gpaAmt,
    })
  }
  if (secondaryAmt > 0) {
    planRows.push({
      id: 'gmc_secondary',
      label: `GMC secondary (${secondaryLives} ${lifeWord(secondaryLives)})`,
      amount: secondaryAmt,
    })
  }
  if (addonsAmt > 0) {
    planRows.push({
      id: 'gmc_addons',
      label: `GMC add-ons (${addonEmployees} ${lifeWord(addonEmployees)})`,
      amount: addonsAmt,
    })
  }

  const subtotalExGst = planRows.reduce((s, r) => s + r.amount, 0)
  const gstAmount = Math.round(subtotalExGst * GST_RATE)
  const totalInclGst = subtotalExGst + gstAmount

  const lines = [
    ...planRows,
    { id: 'subtotal_ex_gst', label: 'Subtotal (excl. GST)', amount: subtotalExGst },
    { id: 'gst', label: `GST (${Math.round(GST_RATE * 100)}%)`, amount: gstAmount },
    { id: 'total', label: 'Total premium (incl. GST)', amount: totalInclGst },
  ]

  return {
    subtotalExGst,
    gstAmount,
    gstRatePercent: Math.round(GST_RATE * 100),
    totalInclGst,
    lines,
  }
}

const PLAN_LINE_IDS = ['gmc_base', 'gpa_base', 'gmc_secondary', 'gmc_addons']

/**
 * Premium/CD lines for the **difference** between current and baseline employees
 * (e.g. new dependents or changed plans vs HR snapshot). Tax lines are recomputed on the delta subtotal.
 *
 * @returns {ReturnType<typeof buildQuickAddPremiumBreakdown>}
 */
export function buildQuickAddPremiumDeltaBreakdown(currentEmployees, baselineEmployees) {
  const cur = buildQuickAddPremiumBreakdown(currentEmployees)
  const base = buildQuickAddPremiumBreakdown(baselineEmployees)
  const baseById = Object.fromEntries(
    base.lines.filter((l) => PLAN_LINE_IDS.includes(l.id)).map((l) => [l.id, l.amount]),
  )

  const deltaRows = []
  for (const id of PLAN_LINE_IDS) {
    const curLine = cur.lines.find((l) => l.id === id)
    const curAmt = curLine?.amount ?? 0
    const baseAmt = baseById[id] ?? 0
    const d = curAmt - baseAmt
    if (d === 0) continue
    const srcLabel = curLine?.label || id
    deltaRows.push({
      id,
      label: `Incremental · ${srcLabel}`,
      amount: d,
    })
  }

  const subtotalExGst = deltaRows.reduce((s, r) => s + r.amount, 0)
  const gstAmount = Math.round(subtotalExGst * GST_RATE)
  const totalInclGst = subtotalExGst + gstAmount

  const lines = [
    ...(deltaRows.length > 0
      ? deltaRows
      : [
          {
            id: 'incremental_none',
            label: 'No incremental premium vs HR record for this endorsement',
            amount: 0,
          },
        ]),
    { id: 'subtotal_ex_gst', label: 'Subtotal (excl. GST)', amount: subtotalExGst },
    { id: 'gst', label: `GST (${Math.round(GST_RATE * 100)}%)`, amount: gstAmount },
    { id: 'total', label: 'Total CD draw (incl. GST)', amount: totalInclGst },
  ]

  return {
    subtotalExGst,
    gstAmount,
    gstRatePercent: Math.round(GST_RATE * 100),
    totalInclGst,
    lines,
  }
}
