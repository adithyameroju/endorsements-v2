import { CheckCircle } from 'lucide-react'
import CdBalanceFormWidget from '../CdBalanceFormWidget'
import ReviewEmployeesPanel from '../ReviewEmployeesPanel'
import { buildQuickAddPremiumBreakdown } from '../../lib/quickAddPremiumEstimate'

const MOCK_CD_AVAILABLE_RUPEES = 48_50_000

export default function AiEndorsementPreview({ employees, onSubmit, submitting }) {
  const validEmployees = employees.filter((e) => e.name?.trim() && e.empId?.trim())
  const { totalInclGst, lines } = buildQuickAddPremiumBreakdown(validEmployees)
  const cdAfterSubmit = MOCK_CD_AVAILABLE_RUPEES - totalInclGst
  const cdSubmitBlocked = cdAfterSubmit < 0

  const batchSummary = {
    count: validEmployees.length,
    basicsComplete: validEmployees.filter((e) => e.dob && e.gender && e.doj).length,
    dependentCount: 0,
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Review mapped employees and estimated CD impact before submitting this AI endorsement batch.
      </p>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white p-4 max-h-[min(24rem,50vh)] overflow-y-auto">
          <ReviewEmployeesPanel employees={validEmployees} />
        </div>
        <aside className="w-full lg:w-[min(calc(19rem+10px),32vw)] shrink-0">
          <CdBalanceFormWidget
            cdAfterSubmit={cdAfterSubmit}
            currentCd={MOCK_CD_AVAILABLE_RUPEES}
            estimatedCdDraw={totalInclGst}
            lines={lines}
            estimateReady
          />
        </aside>
      </div>

      {cdSubmitBlocked ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Estimated CD after this batch would be negative. Recharge CD or remove employees before submitting.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={submitting || cdSubmitBlocked || validEmployees.length === 0}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <CheckCircle size={18} strokeWidth={2.25} aria-hidden />
          {submitting ? 'Submitting…' : 'Submit endorsement'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-right tabular-nums">
        {batchSummary.count} employee{batchSummary.count === 1 ? '' : 's'} in batch
      </p>
    </div>
  )
}
