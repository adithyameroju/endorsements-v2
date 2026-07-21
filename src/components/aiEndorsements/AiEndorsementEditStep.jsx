import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AiEndorsementAiSummary from './AiEndorsementAiSummary'
import AiEndorsementAiFixModal from './AiEndorsementAiFixModal'
import AiEndorsementErrorBanner from './AiEndorsementErrorBanner'
import AiEndorsementMappingStrip from './AiEndorsementMappingStrip'
import AiEndorsementMappingModal from './AiEndorsementMappingModal'
import AiEndorsementGridCard from './AiEndorsementGridCard'
import AiEndorsementFullScreenGrid from './AiEndorsementFullScreenGrid'
import AiEndorsementDependentDrawer from './AiEndorsementDependentDrawer'
import AiEndorsementEmployeeLookupModal from './AiEndorsementEmployeeLookupModal'
import { createEmptyRow } from '../../lib/aiEndorsementSchema'
import { mapMockEmployeeToAiRow } from '../../lib/aiEndorsementEmployeeLookup'
import { applyMappingsToRows } from '../../lib/aiEndorsementMapper'
import { buildAiSummaryCopy } from '../../lib/aiEndorsementAiFix'
import { countErrorRows } from '../../lib/aiEndorsementValidation'

export default function AiEndorsementEditStep({
  state,
  dispatch,
  onContinue,
  onStartOver,
  continueDisabled,
}) {
  const gridRef = useRef(null)
  const [bannerEmphasis, setBannerEmphasis] = useState(false)
  const [activeGridTab, setActiveGridTab] = useState('additions')
  const [aiFixOpen, setAiFixOpen] = useState(false)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupIntent, setLookupIntent] = useState('update')

  const mappedFieldIds = useMemo(
    () => Object.values(state.mappings || {}).filter(Boolean),
    [state.mappings],
  )

  const mappedCount = useMemo(
    () => Object.values(state.mappings || {}).filter(Boolean).length,
    [state.mappings],
  )

  const handleContinue = () => {
    const firstError = state.rowValidation.find((v) => v.status === 'error')
    if (firstError) {
      setBannerEmphasis(true)
      setTimeout(() => setBannerEmphasis(false), 800)
      document.getElementById('ai-grid-error-banner')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
      const el = gridRef.current?.querySelector(`[data-row-id="${firstError.rowId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.classList.add('quickadd-section-shake')
      setTimeout(() => el?.classList.remove('quickadd-section-shake'), 700)
      return
    }
    onContinue()
  }

  const handleUpdateRow = useCallback(
    (rowId, patch) => dispatch({ type: 'UPDATE_ROW', rowId, patch }),
    [dispatch],
  )

  const handleModalUpdateRow = useCallback(
    (rowId, patch) => dispatch({ type: 'UPDATE_ROW', rowId, patch, skipUndo: true }),
    [dispatch],
  )

  const handleUpdatePlan = useCallback(
    (rowId, planKey, value) => dispatch({ type: 'UPDATE_ROW_PLAN', rowId, planKey, value }),
    [dispatch],
  )

  const handleModalUpdatePlan = useCallback(
    (rowId, planKey, value) =>
      dispatch({ type: 'UPDATE_ROW_PLAN', rowId, planKey, value, skipUndo: true }),
    [dispatch],
  )

  const handleAddEmployee = () => {
    const last = state.rows[state.rows.length - 1]
    const newRow = createEmptyRow(state.rows.length, {
      endorsementType: 'onboarding',
      relation: 'Self',
      rowSource: 'manual',
      plans: last?.plans ? { ...last.plans } : {},
    })
    dispatch({ type: 'ADD_ROW', row: newRow })
  }

  const handleOpenLookup = (intent) => {
    setLookupIntent(intent)
    setLookupOpen(true)
  }

  const handleLookupConfirm = (employee) => {
    const newRow = mapMockEmployeeToAiRow(employee, lookupIntent, state.rows.length)
    dispatch({ type: 'ADD_ROW', row: newRow })
    dispatch({ type: 'SET_ROW_SOURCE_FILTER', rowSourceFilter: 'manual' })
    setLookupOpen(false)
    requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(`[data-row-id="${newRow.id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleAddDependent = (rowId) => {
    const source = state.rows.find((r) => r.id === rowId)
    const idx = source ? source.rowIndex + 1 : state.rows.length
    const newRow = createEmptyRow(idx, {
      endorsementType: 'add_dependent',
      rowSource: 'manual',
      empId: source?.empId ?? '',
      relation: '',
      memberName: '',
    })
    const before = state.rows.slice(0, idx)
    const after = state.rows.slice(idx)
    dispatch({ type: 'SET_ROWS_WITH_UNDO', rows: [...before, newRow, ...after] })
  }

  const handleApplyColumn = (fieldId, value, rowIds) => {
    dispatch({
      type: 'APPLY_COLUMN_VALUE',
      fieldId,
      value,
      rowIds,
    })
  }

  const scrollToCell = (fieldId, rowId, errorFieldId) => {
    const resolved = errorFieldId || fieldId
    const candidates =
      resolved === 'gmcBasePlan' || resolved === 'plans' || resolved === 'gpaBasePlan'
        ? ['gmcBasePlan', 'gpaBasePlan', 'plans', fieldId]
        : [fieldId, resolved]
    let cell = null
    for (const f of candidates) {
      cell = gridRef.current?.querySelector(`[data-cell="${rowId}:${f}"]`)
      if (cell) break
    }
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    setAiFixOpen(false)
  }

  const handleApplyAllAiFixes = (items) => {
    const byField = new Map()
    for (const item of items || []) {
      if (!item.suggestedValue) continue
      const key = `${item.fieldId}:${item.suggestedValue}`
      if (!byField.has(key)) {
        byField.set(key, { fieldId: item.fieldId, value: item.suggestedValue, rowIds: [] })
      }
      byField.get(key).rowIds.push(item.rowId)
    }
    for (const batch of byField.values()) {
      dispatch({
        type: 'APPLY_COLUMN_VALUE',
        fieldId: batch.fieldId,
        value: batch.value,
        rowIds: [...new Set(batch.rowIds)],
      })
    }
  }

  const handleApplyAllSuggestions = (items) => {
    for (const item of items || []) {
      if (!item.suggestedValue) continue
      const planKeys = ['gmcBasePlan', 'gmcSecondaryPlan', 'gpaBasePlan', 'gmcTopup', 'gmcAddons']
      if (planKeys.includes(item.fieldId)) {
        dispatch({
          type: 'UPDATE_ROW_PLAN',
          rowId: item.rowId,
          planKey: item.fieldId,
          value: item.suggestedValue,
          skipUndo: true,
        })
      } else if (item.fieldId === 'endorsementType') {
        dispatch({
          type: 'UPDATE_ROW',
          rowId: item.rowId,
          patch: { endorsementType: item.suggestedValue },
          skipUndo: true,
        })
      } else {
        dispatch({
          type: 'UPDATE_ROW',
          rowId: item.rowId,
          patch: { [item.fieldId]: item.suggestedValue },
          skipUndo: true,
        })
      }
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
      }
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const cardProps = {
    gridRef,
    rows: state.rows,
    rowValidation: state.rowValidation,
    touchedCells: state.touchedCells,
    rowFilter: state.rowFilter,
    rowSourceFilter: state.rowSourceFilter,
    mappedFieldIds,
    activeGridTab,
    onGridTabChange: setActiveGridTab,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    onRowFilterChange: (rowFilter) => dispatch({ type: 'SET_ROW_FILTER', rowFilter }),
    onRowSourceFilterChange: (rowSourceFilter) =>
      dispatch({ type: 'SET_ROW_SOURCE_FILTER', rowSourceFilter }),
    onUndo: () => dispatch({ type: 'UNDO' }),
    onRedo: () => dispatch({ type: 'REDO' }),
    onExpand: () => dispatch({ type: 'SET_GRID_EXPANDED', expanded: true }),
    onUpdateRow: handleUpdateRow,
    onUpdatePlan: handleUpdatePlan,
    onTouchCell: (rowId, fieldId) => dispatch({ type: 'TOUCH_CELL', rowId, fieldId }),
    onCopyRow: (id) => dispatch({ type: 'COPY_ROW', rowId: id }),
    onDeleteRow: (id) => dispatch({ type: 'DELETE_ROW', rowId: id }),
    onAddDependent: handleAddDependent,
    onOpenDependent: (id) => dispatch({ type: 'SET_DEPENDENT_DRAWER', rowId: id }),
    onApplyColumn: handleApplyColumn,
    onAddEmployee: handleAddEmployee,
    onOpenLookup: handleOpenLookup,
  }

  const drawerRow = state.rows.find((r) => r.id === state.dependentDrawerRowId)

  const hasAiSummary = Boolean(buildAiSummaryCopy(state.rowValidation))
  const hasErrorBanner = countErrorRows(state.rowValidation) > 0

  const alertStack =
    hasAiSummary || hasErrorBanner ? (
      <div className="overflow-hidden divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {hasAiSummary ? (
          <AiEndorsementAiSummary
            rowValidation={state.rowValidation}
            onReviewFixes={() => setAiFixOpen(true)}
            embedded
          />
        ) : null}
        {hasErrorBanner ? (
          <AiEndorsementErrorBanner
            rowValidation={state.rowValidation}
            rows={state.rows}
            emphasis={bannerEmphasis}
            embedded
            onCellClick={scrollToCell}
            onOpenAiFix={() => setAiFixOpen(true)}
          />
        ) : null}
      </div>
    ) : null

  const handleSaveMapping = (nextMappings) => {
    dispatch({ type: 'SET_MAPPINGS', mappings: nextMappings })
    if (state.parseResult?.rows) {
      const rows = applyMappingsToRows(state.parseResult.rows, nextMappings)
      dispatch({ type: 'SET_ROWS', rows })
    }
    setMappingOpen(false)
  }

  return (
    <div className="space-y-4">
      <AiEndorsementMappingStrip
        fileName={state.file?.name}
        mappedCount={mappedCount}
        totalHeaders={state.parseResult?.headers?.length ?? 0}
        onAdjustMapping={() => setMappingOpen(true)}
      />
      {alertStack}
      <AiEndorsementGridCard {...cardProps} hideExpand={false} />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {onStartOver ? (
          <button
            type="button"
            onClick={onStartOver}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Start over
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={continueDisabled}
          onClick={handleContinue}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Preview impact
        </button>
      </div>

      <AiEndorsementFullScreenGrid
        open={state.gridExpanded}
        onClose={() => dispatch({ type: 'SET_GRID_EXPANDED', expanded: false })}
      >
        <div className="flex h-full min-h-0 flex-col gap-3">
          {alertStack ? (
            <div className="max-h-[min(40vh,22rem)] shrink-0 overflow-y-auto overflow-x-auto">
              {alertStack}
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <AiEndorsementGridCard {...cardProps} hideExpand fillHeight />
          </div>
        </div>
      </AiEndorsementFullScreenGrid>

      <AiEndorsementAiFixModal
        open={aiFixOpen}
        onClose={() => setAiFixOpen(false)}
        rowValidation={state.rowValidation}
        rows={state.rows}
        onApplyAllAiFixes={handleApplyAllAiFixes}
        onApplyAllSuggestions={handleApplyAllSuggestions}
        onUpdateRow={handleModalUpdateRow}
        onUpdatePlan={handleModalUpdatePlan}
        onScrollToCell={scrollToCell}
      />

      <AiEndorsementDependentDrawer
        row={drawerRow}
        open={!!state.dependentDrawerRowId}
        onClose={() => dispatch({ type: 'SET_DEPENDENT_DRAWER', rowId: null })}
        onSave={(patch) => {
          if (drawerRow) dispatch({ type: 'UPDATE_ROW', rowId: drawerRow.id, patch })
        }}
      />

      <AiEndorsementEmployeeLookupModal
        open={lookupOpen}
        intent={lookupIntent}
        existingRows={state.rows}
        onClose={() => setLookupOpen(false)}
        onConfirm={handleLookupConfirm}
      />

      <AiEndorsementMappingModal
        open={mappingOpen}
        headers={state.parseResult?.headers ?? []}
        mappings={state.mappings}
        actionType={state.actionType || 'add'}
        onClose={() => setMappingOpen(false)}
        onSave={handleSaveMapping}
      />
    </div>
  )
}
