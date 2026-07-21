import * as XLSX from 'xlsx'
import { basePlans, gpaBasePlans, secondaryPlans, addonPlans, topupPlans } from '../data/mockData'
import {
  AI_GRID_FIELDS,
  createEmptyRow,
  getFieldsForAction,
  planOptionsForKind,
} from './aiEndorsementSchema'
import { validateAllAiRows } from './aiEndorsementValidation'

const defaultGmcBaseId = basePlans[0]?.id || ''

/** @typedef {import('./aiEndorsementSchema').createEmptyRow extends (...args: any) => infer R ? R : never} AiEndorsementRow */

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i += 1) dp[i][0] = i
  for (let j = 0; j <= n; j += 1) dp[0][j] = j
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function scoreHeaderToField(header, field) {
  const h = normalizeHeader(header)
  if (!h) return 0
  const label = normalizeHeader(field.label)
  if (h === label) return 1
  if (field.aliases.some((a) => h === a || h.includes(a) || a.includes(h))) return 0.92
  const labelDist = levenshtein(h, label)
  const aliasBest = field.aliases.reduce(
    (best, alias) => Math.min(best, levenshtein(h, alias)),
    labelDist,
  )
  const maxLen = Math.max(h.length, label.length, 1)
  const similarity = 1 - aliasBest / maxLen
  return similarity >= 0.72 ? similarity * 0.85 : 0
}

function parseDateValue(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'number' && XLSX.SSF?.parse_date_code) {
    const d = XLSX.SSF.parse_date_code(raw)
    if (d) {
      const mm = String(d.m).padStart(2, '0')
      const dd = String(d.d).padStart(2, '0')
      return `${d.y}-${mm}-${dd}`
    }
  }
  const s = String(raw).trim()
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) {
    return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`
  }
  return s
}

function normalizeGender(raw) {
  const g = String(raw ?? '').trim().toLowerCase()
  if (g.startsWith('m')) return 'Male'
  if (g.startsWith('f')) return 'Female'
  if (g === 'other' || g === 'o') return 'Other'
  return String(raw ?? '').trim()
}

function normalizeEndorsementType(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return 'onboarding'
  if (s.includes('dependent') || s.includes('dep')) return 'add_dependent'
  if (s.includes('offboard') || s.includes('exit') || s.includes('resign')) return 'offboard'
  if (s.includes('delete') || s.includes('remove')) return 'delete'
  if (s.includes('update') || s.includes('change')) return 'update'
  if (s.includes('onboard') || s.includes('add') || s.includes('new') || s.includes('join')) {
    return 'onboarding'
  }
  return 'onboarding'
}

function resolvePlanId(raw, planKind) {
  const text = String(raw ?? '').trim()
  if (!text) return planKind === 'gmcSecondary' ? 'none' : ''
  const options = planOptionsForKind(planKind).filter((p) => p.id)
  const lower = text.toLowerCase()
  const exact = options.find(
    (p) => p.id === text || p.name.toLowerCase() === lower || p.name.toLowerCase().includes(lower),
  )
  if (exact) return exact.id
  if (planKind === 'gmcBase') {
    if (lower.includes('10')) return 'bp3'
    if (lower.includes('5')) return 'bp2'
    if (lower.includes('3')) return 'bp1'
    return defaultGmcBaseId
  }
  if (planKind === 'gmcSecondary') return secondaryPlans[0]?.id ?? 'none'
  if (planKind === 'gpaBase') return gpaBasePlans[0]?.id ?? ''
  if (planKind === 'gmcTopup') return topupPlans[0]?.id ?? ''
  if (planKind === 'gmcAddon') return addonPlans[0]?.id ?? ''
  return ''
}

function rowHasData(row) {
  return Object.values(row).some((v) => String(v ?? '').trim() !== '')
}

export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('No sheets found in this file.')
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (!matrix.length) throw new Error('The file appears to be empty.')

  let headerRowIndex = 0
  for (let i = 0; i < Math.min(matrix.length, 5); i += 1) {
    const nonEmpty = matrix[i].filter((c) => String(c ?? '').trim()).length
    if (nonEmpty >= 2) {
      headerRowIndex = i
      break
    }
  }

  const headers = matrix[headerRowIndex].map((h, idx) => {
    const label = String(h ?? '').trim()
    return label || `Column ${idx + 1}`
  })

  const rows = matrix
    .slice(headerRowIndex + 1)
    .map((cells) => {
      const row = {}
      headers.forEach((header, idx) => {
        row[header] = String(cells[idx] ?? '').trim()
      })
      return row
    })
    .filter(rowHasData)

  if (!rows.length) throw new Error('No data rows found below the header row.')

  return { sheetName, headers, rows, fileName: file.name }
}

export function analyzeColumnMappings(headers, actionType = 'add') {
  const fields = getFieldsForAction(actionType)
  const mappings = {}
  const suggestions = []
  const usedFields = new Set()

  for (const header of headers) {
    let best = { fieldId: null, confidence: 0 }
    for (const field of fields) {
      if (usedFields.has(field.id)) continue
      const score = scoreHeaderToField(header, field)
      if (score > best.confidence) best = { fieldId: field.id, confidence: score }
    }
    if (best.fieldId && best.confidence >= 0.72) {
      mappings[header] = best.fieldId
      usedFields.add(best.fieldId)
      suggestions.push({ header, fieldId: best.fieldId, confidence: best.confidence })
    } else {
      mappings[header] = null
    }
  }

  const mappedCount = Object.values(mappings).filter(Boolean).length
  const unmappedHeaders = headers.filter((h) => !mappings[h])
  const mappedFieldIds = new Set(Object.values(mappings).filter(Boolean))

  return {
    mappings,
    suggestions,
    mappedCount,
    unmappedHeaders,
    missingRequired: [],
    ambiguous: [],
    mappedFieldIds: [...mappedFieldIds],
  }
}

const PLAN_FIELD_MAP = {
  gmcBasePlan: 'gmcBase',
  gmcSecondaryPlan: 'gmcSecondary',
  gpaBasePlan: 'gpaBase',
  gmcTopup: 'gmcTopup',
  gmcAddons: 'gmcAddon',
}

export function applyMappingsToRows(rawRows, mappings) {
  const fieldById = Object.fromEntries(AI_GRID_FIELDS.map((f) => [f.id, f]))

  return rawRows.map((raw, rowIndex) => {
    const flat = {}
    for (const [header, fieldId] of Object.entries(mappings)) {
      if (!fieldId) continue
      flat[fieldId] = raw[header] ?? ''
    }

    const plans = {}
    for (const [fieldId, planKind] of Object.entries(PLAN_FIELD_MAP)) {
      if (!flat[fieldId]) continue
      const resolved = resolvePlanId(flat[fieldId], planKind)
      if (fieldId === 'gmcSecondaryPlan' && resolved === 'none') continue
      if (fieldId === 'gmcAddons') {
        if (resolved) plans.gmcAddons = resolved
      } else if (resolved) {
        plans[fieldId] = resolved
      }
    }

    if (!plans.gmcBasePlan && !plans.gpaBasePlan && flat.endorsementType !== 'delete') {
      if (defaultGmcBaseId && normalizeEndorsementType(flat.endorsementType) === 'onboarding') {
        plans.gmcBasePlan = defaultGmcBaseId
      }
    }

    const endorsementType = normalizeEndorsementType(flat.endorsementType)
    const memberName = flat.memberName || flat.name || ''

    return createEmptyRow(rowIndex, {
      id: `ai-row-${rowIndex}`,
      rowSource: 'upload',
      endorsementType,
      relation: flat.relation || (endorsementType === 'add_dependent' ? '' : 'Self'),
      memberName,
      empId: flat.empId ?? '',
      email: flat.email ?? '',
      dob: parseDateValue(flat.dob),
      gender: normalizeGender(flat.gender),
      doj: parseDateValue(flat.doj),
      dateOfLeaving: parseDateValue(flat.dateOfLeaving),
      mobile: flat.mobile ?? '',
      uhid: flat.uhid ?? '',
      plans,
    })
  })
}

/** @deprecated */
export function applyMappingsToEmployees(rows, mappings, actionType) {
  return applyMappingsToRows(rows, mappings)
}

export function validateMappedEmployees(rows) {
  return validateAllAiRows(rows)
}

export function countValidRows(validation) {
  return validation.filter((v) => v.valid && v.status === 'ready').length
}

export function simulateAnalyzeDelay(ms = 1500) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function reindexRows(rows) {
  return rows.map((row, idx) => ({ ...row, rowIndex: idx }))
}
