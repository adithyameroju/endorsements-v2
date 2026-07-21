import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, FileSpreadsheet, UserPlus } from 'lucide-react'
import { GRID_TABS, getGridColumnsForTab, getGridField } from '../../lib/aiEndorsementSchema'
import { PORTAL_TABLE_SECTION_GUTTER } from '../../lib/dataTableLayout'
import {
  AI_GRID_ACTIONS_INNER_W,
  AI_GRID_ACTIONS_PAD,
  AI_GRID_RIGHT_RAIL_W,
  AI_GRID_STATUS_INNER_W,
  AI_GRID_STICKY_LEFT,
  AI_GRID_STICKY_RIGHT_RAIL,
  dropdownChevronClass,
  headerChevronButtonClass,
  PORTAL_GRID_SCROLL_CLASS,
} from '../../lib/gridUi'
import { shortStatusForRow } from '../../lib/aiEndorsementValidation'
import AiEndorsementGridToolbar from './AiEndorsementGridToolbar'
import AiEndorsementGridCell from './AiEndorsementGridCell'
import AiEndorsementRowActionsMenu from './AiEndorsementRowActionsMenu'
import AiEndorsementColumnHeaderMenu from './AiEndorsementColumnHeaderMenu'

const ROW_H = 'h-9'
const ADDITIONS_TAB_ID = 'additions'

function RowStatusCell({ validation }) {
  if (!validation) return null
  const phrase = shortStatusForRow(validation)
  const errText = Object.values(validation.errors || {}).join('; ')
  if (validation.status === 'ready') {
    return <p className="truncate text-[10px] font-semibold leading-tight text-emerald-700">{phrase}</p>
  }
  return (
    <p className="truncate text-[10px] font-semibold leading-tight text-red-700" title={errText || phrase}>
      {phrase}
    </p>
  )
}

function filterLabel(rowFilter) {
  if (rowFilter === 'ready') return ' that are ready'
  if (rowFilter === 'error') return ' with errors'
  return ''
}

function RightRailCell({ validation, row, readOnly, onCopyRow, onDeleteRow, onAddDependent, onOpenDependent }) {
  return (
    <div className={`flex ${ROW_H} items-center`}>
      <div className={`${AI_GRID_STATUS_INNER_W} px-2`}>
        <RowStatusCell validation={validation} />
      </div>
      {!readOnly ? (
        <div className={AI_GRID_ACTIONS_INNER_W}>
          <AiEndorsementRowActionsMenu
            row={row}
            onCopy={onCopyRow}
            onDelete={onDeleteRow}
            onAddDependent={onAddDependent}
            onOpenDependent={onOpenDependent}
          />
        </div>
      ) : null}
    </div>
  )
}

function rowSourceOf(row) {
  return row.rowSource ?? 'upload'
}

export default function AiEndorsementGridCard({
  gridRef,
  rows,
  rowValidation,
  touchedCells,
  rowFilter = 'all',
  rowSourceFilter = 'all',
  mappedFieldIds = [],
  activeGridTab,
  onGridTabChange,
  canUndo,
  canRedo,
  hideExpand = false,
  fillHeight = false,
  readOnly = false,
  onRowFilterChange,
  onRowSourceFilterChange,
  onUndo,
  onRedo,
  onExpand,
  onUpdateRow,
  onUpdatePlan,
  onTouchCell,
  onCopyRow,
  onDeleteRow,
  onAddDependent,
  onOpenDependent,
  onApplyColumn,
  onAddEmployee,
  onOpenLookup,
}) {
  const [openApplyMenuFieldId, setOpenApplyMenuFieldId] = useState(null)
  const [underline, setUnderline] = useState({ left: 0, width: 0 })
  const tablistRef = useRef(null)
  const tabBtnRefs = useRef({})

  const validationByRowId = Object.fromEntries(rowValidation.map((v) => [v.rowId, v]))
  const tabDef = GRID_TABS.find((t) => t.id === activeGridTab) ?? GRID_TABS[0]
  const columnIds = getGridColumnsForTab(activeGridTab)
  const mappedSet = mappedFieldIds instanceof Set ? mappedFieldIds : new Set(mappedFieldIds)

  const tabRows = rows.filter((r) => tabDef.types.includes(r.endorsementType || 'onboarding'))
  const visibleRows = tabRows.filter((r) => {
    const status = validationByRowId[r.id]?.status
    if (rowFilter === 'ready' && status !== 'ready') return false
    if (rowFilter === 'error' && status !== 'error') return false
    const src = rowSourceOf(r)
    if (rowSourceFilter === 'upload' && src !== 'upload') return false
    if (rowSourceFilter === 'manual' && src !== 'manual') return false
    return true
  })

  const totalCols = 1 + columnIds.length + 1

  const updateUnderline = () => {
    const listEl = tablistRef.current
    const btn = tabBtnRefs.current[activeGridTab]
    if (!listEl || !btn) return
    const listRect = listEl.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const fromLeft = activeGridTab === ADDITIONS_TAB_ID
    setUnderline({
      left: fromLeft ? 0 : Math.max(0, btnRect.left - listRect.left),
      width: fromLeft
        ? Math.max(0, btnRect.right - listRect.left)
        : Math.max(0, btnRect.width),
    })
  }

  useLayoutEffect(() => {
    updateUnderline()
    const onResize = () => updateUnderline()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGridTab])

  const handleApply = ({ value }) => {
    if (!openApplyMenuFieldId) return
    onApplyColumn(
      openApplyMenuFieldId,
      value,
      visibleRows.map((r) => r.id),
    )
    setOpenApplyMenuFieldId(null)
  }

  const scrollMaxH = fillHeight ? undefined : 'max-h-[min(32rem,55vh)]'

  const stickyRailTh = `${AI_GRID_STICKY_RIGHT_RAIL} z-[4] ${AI_GRID_RIGHT_RAIL_W} ${AI_GRID_ACTIONS_PAD} bg-gray-50 py-2 pl-0`

  return (
    <div
      ref={gridRef}
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white ${
        fillHeight ? 'h-full min-h-0' : ''
      }`}
      data-testid="ai-endorsement-grid"
    >
      <div
        ref={tablistRef}
        className="relative flex shrink-0 border-b border-gray-200 pt-3"
        role="tablist"
        aria-label="Endorsement categories"
      >
        <div
          className="pointer-events-none absolute bottom-0 h-0.5 bg-indigo-600 transition-[left,width] duration-200 ease-out"
          style={{ left: underline.left, width: underline.width }}
          aria-hidden
        />
        <div className={`flex min-w-0 flex-1 gap-6 ${PORTAL_TABLE_SECTION_GUTTER}`}>
          {GRID_TABS.map((tab) => {
            const isActive = activeGridTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabBtnRefs.current[tab.id] = el
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onGridTabChange(tab.id)}
                className={`inline-flex cursor-pointer items-center px-1 pb-2.5 pt-0.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                  isActive ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`shrink-0 border-b border-gray-100 py-3 ${PORTAL_TABLE_SECTION_GUTTER}`}>
        <AiEndorsementGridToolbar
          rows={rows}
          rowValidation={rowValidation}
          rowFilter={rowFilter}
          rowSourceFilter={rowSourceFilter}
          readOnly={readOnly}
          canUndo={canUndo}
          canRedo={canRedo}
          hideExpand={hideExpand}
          onRowFilterChange={onRowFilterChange}
          onRowSourceFilterChange={onRowSourceFilterChange}
          onUndo={onUndo}
          onRedo={onRedo}
          onExpand={onExpand}
        />
      </div>

      <div className={`${PORTAL_GRID_SCROLL_CLASS} ${scrollMaxH}`}>
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <th
                className={`${AI_GRID_STICKY_LEFT} z-[4] w-14 bg-gray-50 py-2 pl-6 pr-2 lg:pl-8`}
              >
                #
              </th>
              {columnIds.map((fieldId) => {
                const field = getGridField(fieldId)
                const fromSource = mappedSet.has(fieldId)
                return (
                  <th key={fieldId} className="relative min-w-[7.5rem] border-b border-gray-200 bg-gray-50 px-0 py-0">
                    <div className="flex h-9 items-center gap-0.5 px-2">
                      <span className="truncate">{field?.label}</span>
                      {fromSource ? (
                        <FileSpreadsheet
                          size={11}
                          className="shrink-0 text-gray-400"
                          aria-label="From uploaded source"
                          title="From uploaded source"
                        />
                      ) : null}
                      {!readOnly && field?.applyAllSupported ? (
                        <button
                          type="button"
                          title="Apply to column"
                          onClick={() =>
                            setOpenApplyMenuFieldId((prev) => (prev === fieldId ? null : fieldId))
                          }
                          className={headerChevronButtonClass}
                        >
                          <ChevronDown size={12} className={dropdownChevronClass} aria-hidden />
                        </button>
                      ) : null}
                    </div>
                    {openApplyMenuFieldId === fieldId ? (
                      <AiEndorsementColumnHeaderMenu
                        fieldId={fieldId}
                        open
                        onClose={() => setOpenApplyMenuFieldId(null)}
                        onApply={handleApply}
                      />
                    ) : null}
                  </th>
                )
              })}
              <th className={stickyRailTh}>
                <div className="flex items-center">
                  <span className={`${AI_GRID_STATUS_INNER_W} px-2`}>Status</span>
                  <span className={`${AI_GRID_ACTIONS_INNER_W} sr-only`}>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="bg-white px-4 py-8 text-center text-sm text-gray-500">
                  No rows in this category{filterLabel(rowFilter)}.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const v = validationByRowId[row.id]
                const stickyRailTd = `${AI_GRID_STICKY_RIGHT_RAIL} z-[3] ${AI_GRID_RIGHT_RAIL_W} ${AI_GRID_ACTIONS_PAD} bg-white py-0 pl-0 align-middle`
                return (
                  <tr key={row.id} className="border-b border-gray-100" data-row-id={row.id}>
                    <td
                      className={`${AI_GRID_STICKY_LEFT} z-[3] w-14 bg-white py-0 pl-6 pr-2 tabular-nums text-xs text-gray-500 align-middle lg:pl-8`}
                    >
                      <span className={`flex ${ROW_H} items-center gap-1`}>
                        {rowSourceOf(row) === 'upload' ? (
                          <FileSpreadsheet
                            size={11}
                            className="shrink-0 text-gray-400"
                            title="From uploaded file"
                            aria-hidden
                          />
                        ) : (
                          <UserPlus
                            size={11}
                            className="shrink-0 text-violet-500"
                            title="Added manually"
                            aria-hidden
                          />
                        )}
                        {row.rowIndex + 1}
                      </span>
                    </td>
                    {columnIds.map((fieldId) => {
                      const error =
                        v?.errors?.[fieldId] ||
                        (fieldId === 'gmcBasePlan' && v?.errors?.plans ? v.errors.plans : undefined)
                      const touched = touchedCells[`${row.id}:${fieldId}`]
                      const hasCellError = Boolean(error)
                      return (
                        <td
                          key={fieldId}
                          className={`${ROW_H} min-w-[7.5rem] border-r border-gray-100 bg-white p-0 align-middle ${hasCellError ? 'bg-red-50' : ''}`}
                          data-cell={`${row.id}:${fieldId}`}
                        >
                          <AiEndorsementGridCell
                            fieldId={fieldId}
                            row={row}
                            error={error}
                            touched={touched || !!error}
                            readOnly={readOnly}
                            onChange={(patch) => onUpdateRow(row.id, patch)}
                            onPlanChange={(key, val) => onUpdatePlan(row.id, key, val)}
                            onBlur={() => onTouchCell(row.id, fieldId)}
                          />
                        </td>
                      )
                    })}
                    <td className={stickyRailTd}>
                      <RightRailCell
                        validation={v}
                        row={row}
                        readOnly={readOnly}
                        onCopyRow={onCopyRow}
                        onDeleteRow={onDeleteRow}
                        onAddDependent={onAddDependent}
                        onOpenDependent={onOpenDependent}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (onAddEmployee || onOpenLookup) ? (
        <div className={`shrink-0 border-t border-gray-200 bg-white py-2 ${PORTAL_TABLE_SECTION_GUTTER}`}>
          <div className="flex flex-wrap items-center gap-4">
            {activeGridTab === 'additions' && onAddEmployee ? (
              <button
                type="button"
                onClick={onAddEmployee}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <UserPlus size={14} aria-hidden />
                Add employee
              </button>
            ) : null}
            {activeGridTab === 'updates' && onOpenLookup ? (
              <button
                type="button"
                onClick={() => onOpenLookup('update')}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <UserPlus size={14} aria-hidden />
                Add update row
              </button>
            ) : null}
            {activeGridTab === 'removals' && onOpenLookup ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenLookup('delete')}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  <UserPlus size={14} aria-hidden />
                  Add deletion
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLookup('offboard')}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
                >
                  <UserPlus size={14} aria-hidden />
                  Add offboard
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
