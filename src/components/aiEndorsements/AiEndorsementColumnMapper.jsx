import { AlertCircle, ArrowRight } from 'lucide-react'
import { selectNativeChevronClass } from '../../lib/formUi'
import { getFieldById, getFieldsForAction } from '../../lib/aiEndorsementSchema'
import AiEndorsementMappingPreview from './AiEndorsementMappingPreview'

const compactSelectClass = `w-full appearance-none rounded-md border border-gray-200 bg-white px-2.5 py-1.5 pr-7 text-xs text-gray-900 min-h-[2.25rem] box-border ${selectNativeChevronClass}`

export default function AiEndorsementColumnMapper({
  headers,
  mappings,
  onMappingChange,
  actionType,
  missingRequired,
  compact = false,
  fillHeight = false,
}) {
  const fields = getFieldsForAction(actionType)
  const usedFieldIds = new Set(Object.values(mappings).filter(Boolean))
  const mappedCount = Object.values(mappings).filter(Boolean).length
  const totalHeaders = headers.length

  const mappingList = (
    <>
      <div className="sticky top-0 z-[1] grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
        <span>Your column</span>
        <span className="w-4" aria-hidden />
        <span>Maps to</span>
      </div>
      <div
        className={
          compact || fillHeight
            ? 'max-h-[min(18rem,38vh)] overflow-y-auto'
            : 'max-h-[min(22rem,45vh)] overflow-y-auto'
        }
      >
        {headers.map((header) => {
          const current = mappings[header] ?? ''
          const isUnmapped = !current
          return (
            <div
              key={header}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-gray-50 px-3 py-2 last:border-b-0 ${
                isUnmapped ? 'bg-amber-50/50' : 'bg-white'
              }`}
            >
              <p className="min-w-0 truncate text-xs font-medium text-gray-900" title={header}>
                {header}
              </p>
              <ArrowRight size={14} className="shrink-0 text-gray-300" aria-hidden />
              <select
                value={current}
                onChange={(e) => onMappingChange(header, e.target.value || null)}
                className={compactSelectClass}
                aria-label={`Map column ${header}`}
              >
                <option value="">— Do not import —</option>
                {fields.map((field) => {
                  const taken = usedFieldIds.has(field.id) && current !== field.id
                  return (
                    <option key={field.id} value={field.id} disabled={taken}>
                      {field.label}
                      {field.required ? ' *' : ''}
                      {taken ? ' (already mapped)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        })}
        {headers.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-gray-500">No columns found in this file.</p>
        ) : null}
      </div>
    </>
  )

  return (
    <div
      className={`${compact || fillHeight ? 'space-y-3' : 'space-y-4'} ${
        fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''
      }`}
    >
      {missingRequired.length > 0 ? (
        <div className="flex shrink-0 items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Still unmapped required:{' '}
            {missingRequired.map((id) => getFieldById(actionType, id)?.label ?? id).join(', ')}
          </p>
        </div>
      ) : null}

      <div
        className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${
          fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''
        }`}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Your columns → system fields</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Unmapped columns stay highlighted until you match them.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-indigo-800">
            {mappedCount} of {totalHeaders} matched
          </span>
        </div>

        {compact || fillHeight ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-gray-100">{mappingList}</div>
            <div className="flex min-h-[14rem] flex-1 flex-col bg-gray-50/50 px-4 py-4">
              <AiEndorsementMappingPreview mappings={mappings} headers={headers} expand />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
            <div className="min-w-0 border-b border-gray-100 lg:col-span-3 lg:border-b-0 lg:border-r">
              {mappingList}
            </div>
            <div className="min-w-0 bg-gray-50/50 px-4 py-4 lg:col-span-2">
              <AiEndorsementMappingPreview mappings={mappings} headers={headers} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
