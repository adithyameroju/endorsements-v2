import {
  addonPlans,
  basePlans,
  gpaBasePlans,
  secondaryPlans,
  topupPlans,
} from '../data/mockData'

/** @typedef {'onboarding' | 'add_dependent' | 'update' | 'delete' | 'offboard'} EndorsementType */

export const ENDORSEMENT_TYPES = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'add_dependent', label: 'Add dependent' },
  { id: 'update', label: 'Update' },
  { id: 'delete', label: 'Delete' },
  { id: 'offboard', label: 'Offboard' },
]

export const RELATION_OPTIONS = ['Self', 'Spouse', 'Child', 'Parent', 'Father', 'Mother', 'Son', 'Daughter']
export const GENDER_OPTIONS = ['Male', 'Female', 'Other']

/**
 * @typedef {Object} AiFieldSchema
 * @property {string} id
 * @property {string} label
 * @property {boolean} required
 * @property {string[]} aliases
 * @property {'text' | 'email' | 'date' | 'gender' | 'plan' | 'endorsementType' | 'relation'} type
 * @property {'gmcBase' | 'gmcSecondary' | 'gpaBase' | 'gmcTopup' | 'gmcAddon'} [planKind]
 * @property {boolean} [gridEditable]
 * @property {boolean} [applyAllSupported]
 */

/** Unified field list for column mapping (mixed endorsement types per file). */
export const AI_GRID_FIELDS = [
  {
    id: 'endorsementType',
    label: 'Endorsement type',
    required: false,
    aliases: ['endorsement type', 'action', 'type', 'transaction type', 'activity'],
    type: 'endorsementType',
    gridEditable: true,
  },
  {
    id: 'relation',
    label: 'Relation',
    required: false,
    aliases: ['relation', 'relationship', 'member relation', 'dependent relation'],
    type: 'relation',
    gridEditable: true,
  },
  {
    id: 'memberName',
    label: 'Member',
    required: false,
    aliases: ['member', 'member name', 'full name', 'employee name', 'name'],
    type: 'text',
    gridEditable: true,
  },
  {
    id: 'empId',
    label: 'Emp ID',
    required: false,
    aliases: ['employee id', 'emp id', 'emp code', 'eid', 'employee code', 'staff id'],
    type: 'text',
    gridEditable: true,
  },
  {
    id: 'email',
    label: 'Email',
    required: false,
    aliases: ['email', 'work email', 'official email', 'company email'],
    type: 'email',
    gridEditable: true,
  },
  {
    id: 'dob',
    label: 'DOB',
    required: false,
    aliases: ['dob', 'date of birth', 'birth date', 'birthday'],
    type: 'date',
    gridEditable: true,
  },
  {
    id: 'gender',
    label: 'Gender',
    required: false,
    aliases: ['gender', 'sex'],
    type: 'gender',
    gridEditable: true,
  },
  {
    id: 'doj',
    label: 'DOJ',
    required: false,
    aliases: ['doj', 'date of joining', 'joining date', 'join date'],
    type: 'date',
    gridEditable: true,
  },
  {
    id: 'dateOfLeaving',
    label: 'Date of leaving',
    required: false,
    aliases: [
      'date of leaving',
      'leaving date',
      'last working day',
      'last working date',
      'dol',
      'date of exit',
      'exit date',
    ],
    type: 'date',
    gridEditable: true,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    required: false,
    aliases: ['mobile', 'phone', 'contact number', 'mobile number'],
    type: 'text',
    gridEditable: true,
  },
  {
    id: 'gmcBasePlan',
    label: 'GMC base',
    required: false,
    aliases: ['gmc plan', 'base plan', 'medical plan', 'health plan', 'gmc base'],
    type: 'plan',
    planKind: 'gmcBase',
    gridEditable: true,
    applyAllSupported: true,
  },
  {
    id: 'gmcTopup',
    label: 'GMC top-up',
    required: false,
    aliases: ['gmc top up', 'top up', 'topup', 'gmc top-up'],
    type: 'plan',
    planKind: 'gmcTopup',
    gridEditable: true,
    applyAllSupported: true,
  },
  {
    id: 'gmcAddons',
    label: 'GMC add-on',
    required: false,
    aliases: ['gmc addon', 'addon', 'add on', 'gmc add-on'],
    type: 'plan',
    planKind: 'gmcAddon',
    gridEditable: true,
    applyAllSupported: true,
  },
  {
    id: 'gmcSecondaryPlan',
    label: 'GMC secondary',
    required: false,
    aliases: ['secondary plan', 'gmc secondary', 'secondary'],
    type: 'plan',
    planKind: 'gmcSecondary',
    gridEditable: true,
    applyAllSupported: true,
  },
  {
    id: 'gpaBasePlan',
    label: 'GPA base',
    required: false,
    aliases: ['gpa plan', 'accident plan', 'gpa base'],
    type: 'plan',
    planKind: 'gpaBase',
    gridEditable: true,
    applyAllSupported: true,
  },
  {
    id: 'uhid',
    label: 'UHID',
    required: false,
    aliases: ['uhid', 'health id', 'member id', 'insurance id'],
    type: 'text',
    gridEditable: true,
  },
]

/** @deprecated use AI_GRID_FIELDS */
export const AI_ENDORSEMENT_FIELDS = { add: AI_GRID_FIELDS, update: [], delete: [] }

/** Columns shown in excel grid (in order). */
export const GRID_COLUMN_IDS = [
  'endorsementType',
  'relation',
  'memberName',
  'empId',
  'email',
  'dob',
  'gender',
  'doj',
  'dateOfLeaving',
  'mobile',
  'gmcBasePlan',
  'gmcTopup',
  'gmcAddons',
  'gmcSecondaryPlan',
  'gpaBasePlan',
  'uhid',
]

export function getFieldsForAction(_actionType) {
  return AI_GRID_FIELDS
}

export function getRequiredFieldIds(_actionType) {
  return []
}

export function getFieldById(_actionType, fieldId) {
  return AI_GRID_FIELDS.find((f) => f.id === fieldId)
}

export function getGridField(fieldId) {
  return AI_GRID_FIELDS.find((f) => f.id === fieldId)
}

export function planOptionsForKind(planKind) {
  if (planKind === 'gmcBase') return [{ id: '', name: '— None —' }, ...basePlans]
  if (planKind === 'gmcSecondary') return [{ id: 'none', name: '— None —' }, ...secondaryPlans]
  if (planKind === 'gpaBase') return [{ id: '', name: '— None —' }, ...gpaBasePlans]
  if (planKind === 'gmcTopup') return [{ id: '', name: '— None —' }, ...topupPlans]
  if (planKind === 'gmcAddon') return [{ id: '', name: '— None —' }, ...addonPlans]
  return []
}

export const ENDORSEMENT_TYPE_LABELS = Object.fromEntries(
  ENDORSEMENT_TYPES.map((t) => [t.id, t.label]),
)

export const PREVIEW_TABS = [
  { id: 'onboarding', label: 'Additions' },
  { id: 'add_dependent', label: 'Add dependents' },
  { id: 'update', label: 'Updates' },
  { id: 'delete', label: 'Deletions' },
  { id: 'offboard', label: 'Offboards' },
]

/** Wizard step indices. Column mapping is a modal on the review step, not a page. */
export const AI_STEP_UPLOAD = 0
export const AI_STEP_GRID = 1
export const AI_STEP_PREVIEW = 2
/** @deprecated Mapping is modal-only; kept for stepper helpers. */
export const AI_STEP_MAPPING = 'mapping'

export const AI_WIZARD_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'grid', label: 'Review & edit' },
  { id: 'preview', label: 'Preview impact' },
  { id: 'confirm', label: 'Confirm & submit' },
]

export const GRID_TABS = [
  { id: 'additions', label: 'Additions', types: ['onboarding', 'add_dependent'] },
  { id: 'updates', label: 'Updates', types: ['update'] },
  { id: 'removals', label: 'Deletions & offboards', types: ['delete', 'offboard'] },
]

const PLAN_COLUMN_IDS = [
  'gmcBasePlan',
  'gmcTopup',
  'gmcAddons',
  'gmcSecondaryPlan',
  'gpaBasePlan',
]

/** @type {Record<string, string[]>} */
export const COLUMNS_BY_ENDORSEMENT_TYPE = {
  onboarding: [
    'endorsementType',
    'memberName',
    'empId',
    'email',
    'dob',
    'gender',
    'doj',
    'mobile',
    ...PLAN_COLUMN_IDS,
    'uhid',
  ],
  add_dependent: [
    'endorsementType',
    'relation',
    'memberName',
    'empId',
    'dob',
    'gender',
    ...PLAN_COLUMN_IDS,
  ],
  update: ['endorsementType', 'empId', 'memberName', 'email', 'uhid', ...PLAN_COLUMN_IDS],
  delete: ['endorsementType', 'empId', 'memberName'],
  offboard: ['endorsementType', 'empId', 'memberName', 'dateOfLeaving'],
}

/** Union of columns for all types in a grid tab. */
export function getGridColumnsForTab(tabId) {
  const tab = GRID_TABS.find((t) => t.id === tabId)
  if (!tab) return GRID_COLUMN_IDS
  const colSet = new Set(['endorsementType'])
  for (const type of tab.types) {
    for (const col of COLUMNS_BY_ENDORSEMENT_TYPE[type] ?? []) {
      colSet.add(col)
    }
  }
  return GRID_COLUMN_IDS.filter((id) => colSet.has(id))
}

/** Preview table columns for an endorsement type. */
export function getPreviewColumnsForType(endorsementType) {
  const ids = COLUMNS_BY_ENDORSEMENT_TYPE[endorsementType] ?? ['memberName', 'empId']
  return ids
    .filter((id) => id !== 'endorsementType')
    .map((id) => ({
      key: id === 'memberName' ? 'memberName' : id,
      label: getGridField(id)?.label ?? id,
      isPlan: PLAN_COLUMN_IDS.includes(id),
    }))
}

export function createEmptyRow(rowIndex, partial = {}) {
  return {
    id: `ai-row-${Date.now()}-${rowIndex}`,
    rowIndex,
    excluded: false,
    rowSource: 'manual',
    endorsementType: 'onboarding',
    relation: 'Self',
    memberName: '',
    empId: '',
    email: '',
    dob: '',
    gender: '',
    doj: '',
    dateOfLeaving: '',
    mobile: '',
    uhid: '',
    plans: {},
    ...partial,
  }
}
