import { User, CheckCircle, Heart, Users } from 'lucide-react'
import PageHeader from './PageHeader'
import Stepper from './Stepper'
import PremiumEstimateLivePanel from './PremiumEstimateLivePanel'
import { getPlanSummaryParts, dependentPlanSummaryLine } from '../lib/planHelpers'

function PF({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function getRelationIcon(relation) {
  const r = (relation || '').toLowerCase()
  if (r === 'spouse') return <Heart size={14} className="text-pink-500" />
  if (['father', 'mother'].includes(r)) return <User size={14} className="text-amber-600" />
  if (['son', 'daughter'].includes(r)) return <User size={14} className="text-blue-500" />
  if (['brother', 'sister'].includes(r)) return <Users size={14} className="text-violet-500" />
  if (r.includes('in-law')) return <User size={14} className="text-teal-500" />
  return <User size={14} className="text-gray-500" />
}

/**
 * Quick Add — step 2 “Preview & Submit” (in-app review, not `vite preview`).
 */
export default function QuickAddReviewScreen({
  employees,
  onExitReview,
  onSubmit,
  cdBreakdownLines,
  estimatedCdDraw,
  cdAfterSubmit,
  currentCd,
  policyDaysRemaining,
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
        hideBackButton={true}
      />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 lg:gap-5 lg:items-start min-h-0">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-0 lg:pr-1 pb-4 order-2 lg:order-1">
          {employees.map((emp, idx) => {
            const planParts = getPlanSummaryParts(emp.plans || {})
            return (
              <div key={emp.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-start gap-2 pb-2 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 truncate">{emp.name || `Employee ${idx + 1}`}</h3>
                    <p className="text-[10px] text-gray-500 truncate">
                      {emp.empId}
                      {emp.designation ? ` · ${emp.designation}` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                  <PF label="Email" value={emp.email} />
                  <PF label="DOB" value={emp.dob} />
                  <PF label="Gender" value={emp.gender} />
                  <PF label="Joining" value={emp.doj} />
                  <PF label="Mobile" value={emp.mobile} />
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Plans</p>
                  {planParts.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {planParts.map((p) => (
                        <span
                          key={`${p.key}-${p.text}`}
                          className="inline-flex items-baseline gap-0.5 rounded-md border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-800"
                        >
                          <span className="font-semibold text-slate-500">{p.key}</span>
                          <span className="truncate max-w-[10rem]">{p.text}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">—</span>
                  )}
                </div>
                {emp.dependents.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                      Dependents ({emp.dependents.length})
                    </p>
                    <ul className="space-y-1">
                      {emp.dependents.map((dep, di) => (
                        <li
                          key={dep.id ?? di}
                          className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug"
                        >
                          <span className="flex-shrink-0 mt-0.5 text-indigo-500">{getRelationIcon(dep.relation)}</span>
                          <span className="min-w-0">
                            <span className="font-medium text-gray-900">{dep.name || '—'}</span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-gray-600">{dep.relation || '—'}</span>
                            <span className="block text-[10px] text-gray-500 mt-0.5">
                              {dependentPlanSummaryLine(dep, emp.plans)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <aside className="w-full lg:shrink-0 lg:w-[min(22rem,calc(100vw-28rem))] lg:sticky lg:top-4 lg:self-start lg:max-h-[min(calc(100vh-10rem),36rem)] flex flex-col min-h-0 pb-2 lg:pb-0 order-1 lg:order-2">
          <PremiumEstimateLivePanel
            lines={cdBreakdownLines}
            totalPremium={estimatedCdDraw}
            currentCd={currentCd}
            balanceAfter={cdAfterSubmit}
            isSufficient={cdAfterSubmit >= 0}
            policyDaysRemaining={policyDaysRemaining}
          />
        </aside>
      </div>
      <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2 pt-2.5 mt-auto border-t border-gray-200 bg-white/95 pb-0">
        <button
          type="button"
          onClick={onExitReview}
          className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle size={14} /> Submit Endorsement
        </button>
      </div>
    </div>
  )
}
