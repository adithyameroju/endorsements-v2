import { CheckCircle, Pencil, Trash2 } from 'lucide-react'
import PageHeader from './PageHeader'
import Stepper from './Stepper'
import CdBalanceFormWidget from './CdBalanceFormWidget'
import QuickAddBatchStickyFooter from './QuickAddBatchStickyFooter'
import ReviewEmployeesPanel from './ReviewEmployeesPanel'

/**
 * Quick Add — step 2 “Preview & Submit” (in-app review, not `vite preview`).
 */
export default function QuickAddReviewScreen({
  employees,
  onExitReview,
  onSubmit,
  onClearDraft,
  hasDraftOnDisk = false,
  batchSummary,
  cdBreakdownLines,
  estimatedCdDraw,
  cdAfterSubmit,
  currentCd,
  draftBanner = '',
  cdSubmitBlocked = false,
  onRechargeDemo,
}) {
  return (
    <div
      className="h-full flex flex-col min-h-0 px-6 lg:px-8 pt-4 pb-0"
      data-testid="quick-add-review-screen"
    >
      <PageHeader
        title="Review & Submit"
        subtitle="Confirm details and CD impact before you submit"
        breadcrumbs={[
          { label: 'Add Employee', path: '/add' },
          { label: 'Quick Add', onClick: onExitReview },
          { label: 'Preview' },
        ]}
        trailing={<Stepper steps={['Employee Details', 'Preview & Submit']} currentStep={2} compact />}
        onBack={onExitReview}
        backLabel="Back"
        hideBackButton={false}
      />

      {draftBanner && (
        <div
          className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
          role="status"
        >
          {draftBanner}
        </div>
      )}

      {cdSubmitBlocked && (
        <div
          className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-950"
          role="alert"
        >
          Submit is disabled: estimated CD after this batch is negative. Go back, recharge CD, or remove employees / dependents.
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col order-1 lg:min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pb-2">
            <ReviewEmployeesPanel employees={employees} />
          </div>
        </div>
        <aside className="w-full lg:w-[min(calc(19rem+10px),32vw)] lg:max-w-[calc(21rem+10px)] shrink-0 order-2 lg:min-h-0 flex flex-col lg:justify-start">
          <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto overscroll-contain pb-2">
            <CdBalanceFormWidget
              cdAfterSubmit={cdAfterSubmit}
              currentCd={currentCd}
              estimatedCdDraw={estimatedCdDraw}
              lines={cdBreakdownLines}
              primaryBatchCount={employees.length}
              estimateReady
              {...(typeof onRechargeDemo === 'function'
                ? { rechargeCtaLabel: 'Recharge CD (demo)', onRechargeClick: onRechargeDemo }
                : {})}
            />
          </div>
        </aside>
      </div>

      <QuickAddBatchStickyFooter
        batchSummary={batchSummary}
        actions={
          <>
            {typeof onClearDraft === 'function' && hasDraftOnDisk && (
              <button
                type="button"
                onClick={onClearDraft}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-red-800 bg-white border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-3 sm:order-1"
                title="Remove the saved draft from this browser only"
              >
                <Trash2 size={18} strokeWidth={2.25} aria-hidden /> Clear draft
              </button>
            )}
            <button
              type="button"
              onClick={onExitReview}
              className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-2 sm:order-2"
            >
              <Pencil size={18} strokeWidth={2.25} aria-hidden /> Edit
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={cdSubmitBlocked}
              title={
                cdSubmitBlocked
                  ? 'CD balance is not sufficient for this batch (est.) — go back and recharge or reduce the batch.'
                  : undefined
              }
              className={`w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 flex-shrink-0 min-h-[3rem] order-1 sm:order-3 ${
                cdSubmitBlocked
                  ? 'text-white/90 bg-indigo-400 cursor-not-allowed shadow-none'
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer'
              }`}
            >
              <CheckCircle size={18} strokeWidth={2.25} aria-hidden /> Submit Endorsement
            </button>
          </>
        }
      />
    </div>
  )
}
