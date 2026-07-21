import { AI_STEP_GRID, AI_STEP_MAPPING, AI_STEP_PREVIEW, AI_STEP_UPLOAD, AI_WIZARD_STEPS } from './aiEndorsementSchema'
import { validateAllAiRows } from './aiEndorsementValidation'
import { reindexRows } from './aiEndorsementMapper'

const MAX_UNDO = 50

/** @typedef {'all' | 'ready' | 'error'} RowFilter */

export const initialAiWizardState = {
  stepIndex: 0,
  analyzing: false,
  actionType: 'add',
  file: null,
  parseResult: null,
  mappings: {},
  analysis: null,
  rows: [],
  rowValidation: [],
  submitDone: false,
  gridExpanded: false,
  rowFilter: 'all',
  rowSourceFilter: 'all',
  selectedRowIds: [],
  touchedCells: {},
  undoStack: [],
  redoStack: [],
  applyColumnModal: null,
  dependentDrawerRowId: null,
}

function snapshotRows(rows) {
  return JSON.parse(JSON.stringify(rows))
}

function pushUndo(state, rows) {
  const undoStack = [...state.undoStack, snapshotRows(state.rows)].slice(-MAX_UNDO)
  return { undoStack, redoStack: [] }
}

function withValidation(rows) {
  return { rows, rowValidation: validateAllAiRows(rows) }
}

export function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTION':
      return { ...state, actionType: action.actionType }
    case 'SET_FILE':
      return {
        ...state,
        file: action.file,
        parseResult: null,
        analysis: null,
        mappings: {},
        rows: [],
        rowValidation: [],
      }
    case 'START_ANALYZE':
      return { ...state, analyzing: true }
    case 'ANALYZE_FAIL':
      return { ...state, analyzing: false }
    case 'ANALYZE_DONE':
      return {
        ...state,
        analyzing: false,
        parseResult: action.parseResult,
        analysis: action.analysis,
        mappings: action.mappings,
        rows: action.rows ?? state.rows,
        rowValidation: action.rowValidation ?? state.rowValidation,
        stepIndex: action.stepIndex ?? AI_STEP_GRID,
      }
    case 'SET_MAPPINGS':
      return { ...state, mappings: action.mappings }
    case 'SET_ROWS': {
      const rows = reindexRows(action.rows)
      return { ...state, ...withValidation(rows) }
    }
    case 'SET_ROWS_WITH_UNDO': {
      const undo = pushUndo(state, state.rows)
      const rows = reindexRows(action.rows)
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'UPDATE_ROW': {
      const undo = action.skipUndo ? {} : pushUndo(state, state.rows)
      const rows = state.rows.map((r) =>
        r.id === action.rowId ? { ...r, ...action.patch } : r,
      )
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'UPDATE_ROW_PLAN': {
      const undo = action.skipUndo ? {} : pushUndo(state, state.rows)
      const rows = state.rows.map((r) =>
        r.id === action.rowId
          ? { ...r, plans: { ...r.plans, [action.planKey]: action.value } }
          : r,
      )
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'ADD_ROW': {
      const undo = pushUndo(state, state.rows)
      const newRow = action.row
      const rows = reindexRows([...state.rows, newRow])
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'DELETE_ROW': {
      const undo = pushUndo(state, state.rows)
      const rows = reindexRows(state.rows.filter((r) => r.id !== action.rowId))
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'COPY_ROW': {
      const undo = pushUndo(state, state.rows)
      const source = state.rows.find((r) => r.id === action.rowId)
      if (!source) return state
      const copy = {
        ...snapshotRows([source])[0],
        id: `ai-row-${Date.now()}`,
        rowIndex: state.rows.length,
        rowSource: source.rowSource ?? 'manual',
      }
      const rows = reindexRows([...state.rows, copy])
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'EXCLUDE_ROW': {
      const undo = pushUndo(state, state.rows)
      const rows = state.rows.map((r) =>
        r.id === action.rowId ? { ...r, excluded: !r.excluded } : r,
      )
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'APPLY_COLUMN_VALUE': {
      const undo = pushUndo(state, state.rows)
      const { fieldId, value, rowIds } = action
      const targetIds = rowIds?.length ? new Set(rowIds) : null
      const planKeys = ['gmcBasePlan', 'gmcSecondaryPlan', 'gpaBasePlan', 'gmcTopup', 'gmcAddons']
      const rows = state.rows.map((r) => {
        if (targetIds && !targetIds.has(r.id)) return r
        if (planKeys.includes(fieldId)) {
          return { ...r, plans: { ...r.plans, [fieldId]: value } }
        }
        return { ...r, [fieldId]: value }
      })
      return { ...state, ...undo, ...withValidation(rows) }
    }
    case 'UNDO': {
      if (!state.undoStack.length) return state
      const prev = state.undoStack[state.undoStack.length - 1]
      const undoStack = state.undoStack.slice(0, -1)
      const redoStack = [...state.redoStack, snapshotRows(state.rows)]
      return { ...state, undoStack, redoStack, ...withValidation(prev) }
    }
    case 'REDO': {
      if (!state.redoStack.length) return state
      const next = state.redoStack[state.redoStack.length - 1]
      const redoStack = state.redoStack.slice(0, -1)
      const undoStack = [...state.undoStack, snapshotRows(state.rows)]
      return { ...state, undoStack, redoStack, ...withValidation(next) }
    }
    case 'SET_STEP':
      return { ...state, stepIndex: action.stepIndex }
    case 'SET_GRID_EXPANDED':
      return { ...state, gridExpanded: action.expanded }
    case 'SET_ROW_FILTER':
      return { ...state, rowFilter: action.rowFilter }
    case 'SET_ROW_SOURCE_FILTER':
      return { ...state, rowSourceFilter: action.rowSourceFilter }
    case 'TOUCH_CELL': {
      const key = `${action.rowId}:${action.fieldId}`
      return { ...state, touchedCells: { ...state.touchedCells, [key]: true } }
    }
    case 'SET_APPLY_COLUMN_MODAL':
      return { ...state, applyColumnModal: action.modal }
    case 'SET_DEPENDENT_DRAWER':
      return { ...state, dependentDrawerRowId: action.rowId }
    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRowIds: action.rowIds }
    case 'SUBMIT_DONE':
      return { ...state, submitDone: true }
    case 'RESET':
      return { ...initialAiWizardState }
    default:
      return state
  }
}

/**
 * @param {number | string} stepIndex
 * @param {'grid' | 'summary'} [previewPhase]
 */
export function stepperCurrentStep(stepIndex, previewPhase = 'grid') {
  if (stepIndex === AI_STEP_UPLOAD) return 1
  if (stepIndex === AI_STEP_MAPPING || stepIndex === AI_STEP_GRID) return 2
  if (stepIndex === AI_STEP_PREVIEW) {
    return previewPhase === 'summary' ? 4 : 3
  }
  if (typeof stepIndex === 'number') {
    return Math.min(stepIndex + 1, AI_WIZARD_STEPS.length)
  }
  return 1
}

export { AI_STEP_UPLOAD, AI_STEP_GRID, AI_STEP_PREVIEW, AI_STEP_MAPPING }

export function canProceedFromMapping(_analysis, _mappings) {
  return true
}

/** @deprecated use rows */
export function getEmployeesFromState(state) {
  return state.rows
}
