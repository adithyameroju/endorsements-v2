import { useMemo } from 'react'
import { CheckCircle, Pencil } from 'lucide-react'
import PageHeader from './PageHeader'
import Stepper from './Stepper'
import CdBalanceFormWidget from './CdBalanceFormWidget'
import QuickAddBatchStickyFooter from './QuickAddBatchStickyFooter'
import ReviewEmployeesPanel from './ReviewEmployeesPanel'
import { computeUpdateFlowCdState } from '../lib/updateFlowPremium'

/**
 * Preview step for update-employee flows — matches Quick Add review layout (cards + CD rail + sticky footer).
 */
export default function UpdateFlowReviewScreen({
  title = 'Review & Submit',
  subtitle = 'Confirm details and CD impact before you submit',
  breadcrumbs,
  stepperSteps,
  stepperCurrentStep,
  employees,
  batchSummary,
  onBack,
  onSubmit,
  submitLabel = 'Submit Endorsement',
  cdFlow = 'quick-update',
  cdFlowMeta = {},
  cdBaselineEmployees,
  /** After form-step “Calculate premium”, preview always shows full CD breakdown. */
  cdEstimateReady = true,
}) {
  const { cdAfterSubmit, currentCd, estimatedCdDraw, cdBreakdownLines } = useMemo(
    () =>
      computeUpdateFlowCdState(employees, {
        flow: cdFlow,
        flowMeta: cdFlowMeta ?? {},
        baselineEmployees: cdBaselineEmployees,
      }),
    [employees, cdFlow, cdFlowMeta, cdBaselineEmployees],
  )

  return (
    <div className="h-full flex flex-col min-h-0 px-6 lg:px-8 pt-4 pb-0" data-testid="update-flow-review-screen">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        trailing={<Stepper steps={stepperSteps} currentStep={stepperCurrentStep} compact />}
        onBack={onBack}
        backLabel="Back"
        hideBackButton={false}
      />

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
              estimateReady={cdEstimateReady}
            />
          </div>
        </aside>
      </div>

      <QuickAddBatchStickyFooter
        batchSummary={batchSummary}
        actions={
          <>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-2 sm:order-2"
            >
              <Pencil size={18} strokeWidth={2.25} aria-hidden /> Edit
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 min-h-[3rem] order-1 sm:order-3"
            >
              <CheckCircle size={18} strokeWidth={2.25} aria-hidden /> {submitLabel}
            </button>
          </>
        }
      />
    </div>
  )
}
