import { basePlans, secondaryPlans, addonPlans, topupPlans } from '../data/mockData'

/** True when employee has an active GMC secondary plan (parents/in-laws depend on this). */
export function hasActiveSecondaryGmc(plans) {
  const s = plans?.gmcSecondaryPlan
  return typeof s === 'string' && s.length > 0 && s !== 'none'
}

/** Copy only GMC-related fields from employee plans onto a dependent. */
export function cloneEmployeeGmcPlans(plans) {
  if (!plans?.gmcBasePlan) return {}
  const out = { gmcBasePlan: plans.gmcBasePlan }
  if (plans.gmcSecondaryPlan && plans.gmcSecondaryPlan !== 'none') {
    out.gmcSecondaryPlan = plans.gmcSecondaryPlan
  }
  if (plans.gmcTopup && plans.gmcTopup !== 'none') {
    out.gmcTopup = plans.gmcTopup
  }
  if (plans.gmcAddons?.length) {
    out.gmcAddons = [...plans.gmcAddons]
  }
  return out
}

/** Human-readable GMC stack for read-only “same as employee” UI. */
export function formatInheritedGmcLines(plans) {
  const lines = []
  const gmcBase = basePlans.find(p => p.id === plans?.gmcBasePlan)
  if (gmcBase) lines.push(`Base: ${gmcBase.name}`)
  const sec = secondaryPlans.find(p => p.id === plans?.gmcSecondaryPlan)
  if (sec && plans?.gmcSecondaryPlan !== 'none') lines.push(`Secondary: ${sec.name}`)
  const top = topupPlans.find(p => p.id === plans?.gmcTopup)
  if (top && plans?.gmcTopup !== 'none') lines.push(`Top-up: ${top.name}`)
  if (plans?.gmcAddons?.length) {
    const names = addonPlans.filter(p => plans.gmcAddons.includes(p.id)).map(p => p.name)
    if (names.length) lines.push(`Add-ons: ${names.join(', ')}`)
  }
  return lines.length ? lines : ['No GMC plan configured']
}
