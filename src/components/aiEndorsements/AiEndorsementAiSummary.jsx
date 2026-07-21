import { Sparkles, ArrowRight } from 'lucide-react'
import { buildAiSummaryCopy } from '../../lib/aiEndorsementAiFix'

export default function AiEndorsementAiSummary({
  rowValidation,
  onReviewFixes,
  embedded = false,
}) {
  const copy = buildAiSummaryCopy(rowValidation)
  if (!copy) return null

  const headline =
    copy.aiFixableCount > 0
      ? `AI can help with ${copy.aiFixableCount} of these issue${copy.aiFixableCount === 1 ? '' : 's'}`
      : copy.headline

  return (
    <div
      className={
        embedded
          ? 'border-l-4 border-l-violet-400 bg-violet-50/50'
          : 'overflow-hidden rounded-xl border border-violet-200 border-l-4 border-l-violet-400 bg-violet-50/50'
      }
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Sparkles size={15} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-violet-950">{headline}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-violet-900/70">{copy.detail}</p>
        </div>
        <button
          type="button"
          onClick={onReviewFixes}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-50"
        >
          Review fixes
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}
