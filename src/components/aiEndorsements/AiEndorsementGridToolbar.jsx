import { Undo2, Redo2, Maximize2 } from 'lucide-react'
import { countErrorRows, countReadyRows } from '../../lib/aiEndorsementValidation'
import { portalFilterChipClass } from '../../lib/portalChipTokens'

function countBySource(rows, source) {
  return rows.filter((r) => (r.rowSource ?? 'upload') === source).length
}

export default function AiEndorsementGridToolbar({
  rows,
  rowValidation,
  rowFilter,
  rowSourceFilter = 'all',
  readOnly = false,
  canUndo,
  canRedo,
  hideExpand = false,
  onRowFilterChange,
  onRowSourceFilterChange,
  onUndo,
  onRedo,
  onExpand,
}) {
  const ready = countReadyRows(rowValidation)
  const errors = countErrorRows(rowValidation)
  const uploadCount = countBySource(rows, 'upload')
  const manualCount = countBySource(rows, 'manual')
  const showSourceChips = !readOnly && manualCount > 0

  const toggleFilter = (filter) => {
    onRowFilterChange?.(rowFilter === filter ? 'all' : filter)
  }

  const toggleSourceFilter = (filter) => {
    onRowSourceFilterChange?.(rowSourceFilter === filter ? 'all' : filter)
  }

  if (readOnly) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
          {rows.length} row{rows.length === 1 ? '' : 's'} ready to submit
        </span>
        {uploadCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600">
            From file: {uploadCount}
          </span>
        ) : null}
        {manualCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1.5 text-[11px] font-medium text-violet-800">
            Added manually: {manualCount}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onRowFilterChange?.('all')
            onRowSourceFilterChange?.('all')
          }}
          className={portalFilterChipClass(rowFilter === 'all' && rowSourceFilter === 'all')}
          aria-pressed={rowFilter === 'all' && rowSourceFilter === 'all'}
        >
          All rows ({rows.length})
        </button>
        <button
          type="button"
          onClick={() => toggleFilter('ready')}
          className={portalFilterChipClass(rowFilter === 'ready')}
          aria-pressed={rowFilter === 'ready'}
        >
          Ready rows ({ready})
        </button>
        <button
          type="button"
          onClick={() => toggleFilter('error')}
          className={portalFilterChipClass(rowFilter === 'error')}
          aria-pressed={rowFilter === 'error'}
        >
          Error rows ({errors})
        </button>
        {showSourceChips ? (
          <>
            <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
            <button
              type="button"
              onClick={() => toggleSourceFilter('upload')}
              className={portalFilterChipClass(rowSourceFilter === 'upload')}
              aria-pressed={rowSourceFilter === 'upload'}
            >
              From file ({uploadCount})
            </button>
            <button
              type="button"
              onClick={() => toggleSourceFilter('manual')}
              className={portalFilterChipClass(rowSourceFilter === 'manual')}
              aria-pressed={rowSourceFilter === 'manual'}
            >
              Added manually ({manualCount})
            </button>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          title="Undo"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          title="Redo"
        >
          <Redo2 size={14} />
        </button>
        {!hideExpand ? (
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Maximize2 size={14} aria-hidden />
            Expand
          </button>
        ) : null}
      </div>
    </div>
  )
}
