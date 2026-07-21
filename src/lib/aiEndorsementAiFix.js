import { columnErrorCounts, countErrorRows } from './aiEndorsementValidation'
import { GENDER_OPTIONS, RELATION_OPTIONS, getGridField, planOptionsForKind } from './aiEndorsementSchema'
import { basePlans, gpaBasePlans } from '../data/mockData'

const CRITICAL_FIELDS = new Set(['empId', 'email', 'memberName', 'endorsementType'])
const WARNING_FIELDS = new Set([
  'relation',
  'gender',
  'dob',
  'doj',
  'dateOfLeaving',
  'mobile',
  'uhid',
])
const AI_FIXABLE_FIELDS = new Set(['plans', 'gmcBasePlan', 'gpaBasePlan'])

export function severityForField(fieldId) {
  if (AI_FIXABLE_FIELDS.has(fieldId) || fieldId === 'plans') return 'aiFixable'
  if (CRITICAL_FIELDS.has(fieldId)) return 'critical'
  if (WARNING_FIELDS.has(fieldId)) return 'warning'
  return 'warning'
}

function resolveFieldId(fieldId) {
  return fieldId === 'plans' ? 'gmcBasePlan' : fieldId
}

function cellDisplayValue(row, fieldId) {
  const resolved = resolveFieldId(fieldId)
  if (resolved === 'gmcBasePlan' || resolved === 'gpaBasePlan' || fieldId === 'plans') {
    const v = row.plans?.[resolved] || row.plans?.gmcBasePlan
    if (!v || v === 'none') return '—'
    const kind = resolved === 'gpaBasePlan' ? 'gpaBase' : 'gmcBase'
    const match = planOptionsForKind(kind).find((p) => p.id === v)
    return match?.name ?? v
  }
  const v = row[resolved] ?? row[fieldId]
  return v === '' || v == null ? '—' : String(v)
}

function rawEditValue(row, fieldId) {
  const resolved = resolveFieldId(fieldId)
  const field = getGridField(resolved)
  if (field?.type === 'plan') {
    return row.plans?.[resolved] ?? ''
  }
  if (resolved === 'endorsementType') return row.endorsementType || 'onboarding'
  return row[resolved] ?? ''
}

/**
 * AI/heuristic suggestion for a single cell error.
 * @returns {{ value: string, label: string } | null}
 */
export function suggestFixForError(row, errorFieldId, message) {
  const resolved = resolveFieldId(errorFieldId)
  const defaultGmc = basePlans[0]
  const defaultGpa = gpaBasePlans[0]

  if (resolved === 'gmcBasePlan' || errorFieldId === 'plans') {
    const id = defaultGmc?.id ?? 'bp1'
    return { value: id, label: defaultGmc?.name ?? 'Base Plan - 3L' }
  }
  if (resolved === 'gpaBasePlan') {
    const id = defaultGpa?.id ?? 'gpa1'
    return { value: id, label: defaultGpa?.name ?? 'GPA Base' }
  }
  if (resolved === 'relation') {
    if (row.endorsementType === 'onboarding' || message?.includes('Self')) {
      return { value: 'Self', label: 'Self' }
    }
    if (row.endorsementType === 'add_dependent') {
      const pick = RELATION_OPTIONS.find((r) => r !== 'Self') ?? 'Spouse'
      return { value: pick, label: pick }
    }
    return { value: 'Self', label: 'Self' }
  }
  if (resolved === 'gender') {
    return { value: GENDER_OPTIONS[0], label: GENDER_OPTIONS[0] }
  }
  if (resolved === 'email') {
    const trimmed = String(row.email ?? '').trim().toLowerCase()
    if (trimmed && trimmed.includes('@')) return { value: trimmed, label: trimmed }
    return null
  }
  if (resolved === 'empId' && message?.toLowerCase().includes('duplicate')) {
    const base = row.empId?.trim()
    if (base) {
      const next = `${base}-${row.rowIndex + 1}`
      return { value: next, label: next }
    }
  }
  if (resolved === 'memberName' && !row.memberName?.trim() && row.email?.trim()) {
    const local = row.email.split('@')[0]?.replace(/[._]/g, ' ')
    if (local) {
      const titled = local.replace(/\b\w/g, (c) => c.toUpperCase())
      return { value: titled, label: titled }
    }
  }
  if (resolved === 'endorsementType' && !row.endorsementType) {
    return { value: 'onboarding', label: 'Onboarding' }
  }
  return null
}

function enrichFixItem(row, errorFieldId, message, base) {
  const suggestion = suggestFixForError(row, errorFieldId, message)
  const severity = severityForField(errorFieldId)
  return {
    ...base,
    message,
    aiFixable: severity === 'aiFixable',
    suggestedValue: suggestion?.value ?? (severity === 'aiFixable' ? basePlans[0]?.id ?? 'bp1' : undefined),
    suggestedLabel: suggestion?.label ?? (severity === 'aiFixable' ? basePlans[0]?.name ?? 'Base Plan - 3L' : undefined),
    hasSuggestion: Boolean(suggestion?.value || severity === 'aiFixable'),
    severity,
  }
}

/**
 * Field-level aggregates (summary card / legacy).
 */
export function buildAiFixGroups(rowValidation, _rows) {
  const counts = columnErrorCounts(rowValidation)
  const groups = { critical: [], warning: [], aiFixable: [] }

  for (const [fieldId, count] of Object.entries(counts)) {
    const severity = severityForField(fieldId)
    const resolved = resolveFieldId(fieldId)
    const label = getGridField(resolved)?.label ?? fieldId
    const item = {
      fieldId: resolved,
      title: fieldId === 'plans' || fieldId === 'gmcBasePlan' ? 'Missing GMC base plan' : label,
      count,
      aiFixable: severity === 'aiFixable',
      suggestedValue: severity === 'aiFixable' ? basePlans[0]?.id ?? 'bp1' : undefined,
      severity,
      fixLabel:
        severity === 'aiFixable'
          ? `Apply ${basePlans[0]?.name ?? 'Base Plan - 3L'} to affected rows`
          : 'Go to first error',
    }
    groups[severity].push(item)
  }

  const sortByCount = (a, b) => b.count - a.count
  groups.critical.sort(sortByCount)
  groups.warning.sort(sortByCount)
  groups.aiFixable.sort(sortByCount)

  return groups
}

/**
 * Row-level error lines for the large AI fix modal tables.
 */
export function buildAiFixRowSections(rowValidation, rows) {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
  const sections = { aiFixable: [], critical: [], warning: [] }

  for (const v of rowValidation) {
    if (v.status !== 'error') continue
    const row = byId[v.rowId]
    if (!row) continue

    for (const [errorFieldId, message] of Object.entries(v.errors || {})) {
      const severity = severityForField(errorFieldId)
      const resolved = resolveFieldId(errorFieldId)
      const field = getGridField(resolved)
      const label = field?.label ?? errorFieldId
      const item = enrichFixItem(row, errorFieldId, message, {
        id: `${v.rowId}:${errorFieldId}`,
        rowId: v.rowId,
        rowIndex: row.rowIndex,
        memberName: row.memberName || '—',
        empId: row.empId || '—',
        errorFieldId,
        fieldId: resolved,
        fieldType: field?.type ?? 'text',
        fieldLabel: errorFieldId === 'plans' ? 'GMC base' : label,
        currentValue: cellDisplayValue(row, errorFieldId),
        editValue: rawEditValue(row, errorFieldId),
      })
      sections[severity].push(item)
    }
  }

  return sections
}

/**
 * Structured error tree for the expandable error banner.
 */
export function buildStructuredErrorSections(rowValidation, rows) {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
  const buckets = { critical: new Map(), warning: new Map(), aiFixable: new Map() }

  for (const v of rowValidation) {
    if (v.status !== 'error') continue
    const row = byId[v.rowId]
    if (!row) continue

    for (const [errorFieldId, message] of Object.entries(v.errors || {})) {
      const severity = severityForField(errorFieldId)
      const resolved = resolveFieldId(errorFieldId)
      const field = getGridField(resolved)
      const map = buckets[severity]
      if (!map.has(resolved)) {
        map.set(resolved, {
          fieldId: resolved,
          errorFieldId,
          fieldLabel: errorFieldId === 'plans' ? 'GMC base plan' : (field?.label ?? resolved),
          severity,
          rows: [],
        })
      }
      map.get(resolved).rows.push({
        rowId: v.rowId,
        rowIndex: row.rowIndex,
        memberName: row.memberName || '—',
        empId: row.empId || '—',
        message,
      })
    }
  }

  const toList = (map) =>
    [...map.values()]
      .map((g) => ({ ...g, count: g.rows.length }))
      .sort((a, b) => b.count - a.count)

  return {
    critical: toList(buckets.critical),
    warning: toList(buckets.warning),
    aiFixable: toList(buckets.aiFixable),
  }
}

/** Short AI summary copy for the summary card. */
export function buildAiSummaryCopy(rowValidation) {
  const errorRows = countErrorRows(rowValidation)
  if (!errorRows) return null

  const groups = buildAiFixGroups(rowValidation, [])
  const aiFixableCount = groups.aiFixable.reduce((sum, g) => sum + g.count, 0)
  const criticalCount = groups.critical.reduce((sum, g) => sum + g.count, 0)

  let detail = `${errorRows} row${errorRows === 1 ? '' : 's'} need attention.`
  if (aiFixableCount > 0) {
    detail += ` ${aiFixableCount} issue${aiFixableCount === 1 ? '' : 's'} can be fixed with one click.`
  }
  if (criticalCount > 0) {
    detail += ` ${criticalCount} critical field${criticalCount === 1 ? '' : 's'} need a manual review.`
  }

  return {
    headline: 'AI found quick ways to clear validation issues',
    detail,
    aiFixableCount,
    criticalCount,
    errorRows,
  }
}
