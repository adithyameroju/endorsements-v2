import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import { getFieldById } from '../../lib/aiEndorsementSchema'

export default function AiEndorsementAnalysisSummary({ parseResult, analysis, actionType }) {
  if (!parseResult || !analysis) return null

  const sampleRows = parseResult.rows.slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 flex items-start gap-3">
        <Sparkles size={20} className="text-violet-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-violet-950">AI file summary</p>
          <p className="text-xs text-violet-900/80 mt-1 leading-relaxed">
            Read <span className="font-semibold">{parseResult.fileName}</span> — sheet &quot;{parseResult.sheetName}&quot; with{' '}
            <span className="font-semibold tabular-nums">{parseResult.rows.length}</span> data rows and{' '}
            <span className="font-semibold tabular-nums">{parseResult.headers.length}</span> columns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Unmapped columns" value={analysis.unmappedHeaders.length} tone="amber" />
        <StatCard
          label="Mapped fields"
          value={analysis.mappedCount}
          tone="emerald"
        />
      </div>

      {analysis.suggestions.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Suggested mappings</p>
          <ul className="space-y-1.5">
            {analysis.suggestions.map((s) => (
              <li key={s.header} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" aria-hidden />
                <span className="font-medium text-gray-800">{s.header}</span>
                <span className="text-gray-400">→</span>
                <span>{getFieldById(actionType, s.fieldId)?.label ?? s.fieldId}</span>
                <span className="text-gray-400 tabular-nums">({Math.round(s.confidence * 100)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.missingRequired.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-xs text-amber-950">
          <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
          <p>
            Required fields not yet mapped:{' '}
            {analysis.missingRequired
              .map((id) => getFieldById(actionType, id)?.label ?? id)
              .join(', ')}
            . You can map them on the next step.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <p className="text-sm font-semibold text-gray-900 px-4 py-3 border-b border-gray-100">Sample rows</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                {parseResult.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sampleRows.map((row, i) => (
                <tr key={i}>
                  {parseResult.headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[12rem] truncate">
                      {row[h] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-950',
    red: 'border-red-200 bg-red-50/50 text-red-900',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone] ?? tones.emerald}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  )
}
