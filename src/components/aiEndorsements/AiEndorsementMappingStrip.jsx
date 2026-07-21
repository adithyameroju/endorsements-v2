import { Columns3, ArrowRight } from 'lucide-react'

export default function AiEndorsementMappingStrip({
  fileName,
  mappedCount,
  totalHeaders,
  onAdjustMapping,
}) {
  if (!fileName) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
          <Columns3 size={16} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Column mapping</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            <span className="font-medium text-gray-700">{fileName}</span>
            {' · '}
            {mappedCount} of {totalHeaders} matched
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdjustMapping}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
      >
        Adjust mapping
        <ArrowRight size={14} aria-hidden />
      </button>
    </div>
  )
}
