import { GRID_COLUMN_IDS, getGridField } from '../../lib/aiEndorsementSchema'

/**
 * Build ordered mapped pairs: system field (grid order) + original file column.
 */
export function buildMappedColumnPairs(mappings = {}, headers = []) {
  const headerList = headers.length
    ? headers
    : Object.keys(mappings)

  const pairs = []
  for (const fieldId of GRID_COLUMN_IDS) {
    const sourceHeader = headerList.find((h) => mappings[h] === fieldId)
    if (!sourceHeader) continue
    pairs.push({
      fieldId,
      fieldLabel: getGridField(fieldId)?.label ?? fieldId,
      sourceHeader,
    })
  }
  return pairs
}

/**
 * Empty excel-style preview: system field + original column per header.
 */
export default function AiEndorsementMappingPreview({
  mappings = {},
  headers = [],
  expand = false,
}) {
  const pairs = buildMappedColumnPairs(mappings, headers)

  if (!pairs.length) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-5 ${
          expand ? 'flex min-h-[14rem] flex-1 flex-col justify-center' : ''
        }`}
      >
        <p className="text-sm font-semibold text-gray-800">How your columns will look</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Map columns above to preview system fields with your original headers underneath.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${expand ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
      <div className="shrink-0">
        <p className="text-sm font-semibold text-gray-900">How your columns will look</p>
        <p className="mt-0.5 text-xs text-gray-500">
          System field on top · your file column below
        </p>
      </div>
      <div
        className={`overflow-auto rounded-xl border border-gray-200 bg-white ${
          expand ? 'min-h-[14rem] flex-1' : ''
        }`}
      >
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="w-10 px-2.5 py-2 align-bottom">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">#</span>
              </th>
              {pairs.map((p) => (
                <th key={p.fieldId} className="min-w-[6.5rem] max-w-[9rem] px-2.5 py-2 align-bottom">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-700">
                    {p.fieldLabel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[10px] font-normal normal-case tracking-normal text-gray-400"
                    title={p.sourceHeader}
                  >
                    {p.sourceHeader}
                  </span>
                </th>
              ))}
              <th className="min-w-[4.5rem] px-2.5 py-2 align-bottom">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Status
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-2.5 py-2 tabular-nums text-xs text-gray-400">1</td>
              {pairs.map((p) => (
                <td key={p.fieldId} className="px-2.5 py-2 text-xs text-gray-300">
                  —
                </td>
              ))}
              <td className="px-2.5 py-2 text-xs text-gray-300">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
