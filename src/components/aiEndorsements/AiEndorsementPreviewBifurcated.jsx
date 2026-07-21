import { useEffect, useMemo, useState } from 'react'
import CdBalanceFormWidget from '../CdBalanceFormWidget'
import PortalMetricCard from '../PortalMetricCard'
import AiEndorsementGridCard from './AiEndorsementGridCard'
import { PREVIEW_TABS } from '../../lib/aiEndorsementSchema'
import { rowToPremiumEmployee } from '../../lib/aiEndorsementValidation'
import { buildAiEndorsementPremiumBreakdown } from '../../lib/quickAddPremiumEstimate'
import { formatInr } from '../../lib/currencyFormat'
import AiEndorsementPreviewFooter, {
  AiEndorsementPreviewActions,
  AiEndorsementPreviewGridActions,
} from './AiEndorsementPreviewFooter'

const MOCK_CD_AVAILABLE_RUPEES = 48_50_000

const TAB_ACCENT = {
  onboarding: 'bg-emerald-500',
  add_dependent: 'bg-teal-500',
  update: 'bg-blue-500',
  delete: 'bg-rose-500',
  offboard: 'bg-amber-500',
}

function PreviewSummaryView({ rows, grouped, cdAfterSubmit, totalInclGst, displayLines, cdSubmitBlocked }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch lg:gap-5">
      <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {cdSubmitBlocked ? (
            <div
              className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-950"
              role="alert"
            >
              Submit is disabled: estimated CD after this batch is negative. Go back, recharge CD, or remove rows.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PREVIEW_TABS.map((tab) => {
              const count = grouped[tab.id]?.length ?? 0
              return (
                <PortalMetricCard
                  key={tab.id}
                  label={tab.label}
                  value={count}
                  sub={count === 0 ? 'None in batch' : `${count} in this batch`}
                  subClassName={count === 0 ? 'text-gray-400' : 'text-gray-600'}
                  barPct={rows.length ? (count / rows.length) * 100 : 0}
                  barColor={TAB_ACCENT[tab.id] ?? 'bg-indigo-500'}
                />
              )
            })}
            <PortalMetricCard
              label="Total endorsements"
              value={rows.length}
              sub="Ready to submit"
              barPct={100}
              barColor="bg-indigo-600"
              className="sm:col-span-2 xl:col-span-1"
            />
            <PortalMetricCard
              label="Est. CD draw"
              value={formatInr(totalInclGst)}
              sub="Incl. GST"
              subClassName="text-gray-500"
              className="sm:col-span-2 xl:col-span-2"
            />
          </div>
        </div>
      </div>

      <aside className="order-2 flex w-full shrink-0 flex-col lg:w-[min(calc(19rem+10px),32vw)] lg:max-w-[calc(21rem+10px)] lg:justify-start">
        <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto lg:overscroll-contain">
          <CdBalanceFormWidget
            cdAfterSubmit={cdAfterSubmit}
            currentCd={MOCK_CD_AVAILABLE_RUPEES}
            estimatedCdDraw={totalInclGst}
            lines={displayLines}
            primaryBatchCount={rows.length}
            estimateReady
          />
        </div>
      </aside>
    </div>
  )
}

export default function AiEndorsementPreviewBifurcated({
  rows,
  rowValidation,
  mappedFieldIds = [],
  activeGridTab: initialGridTab = 'additions',
  phase: phaseProp,
  onSubmit,
  onBack,
  onStartOver,
  onPhaseChange,
  submitting,
}) {
  const [internalPhase, setInternalPhase] = useState('grid')
  const phase = phaseProp ?? internalPhase
  const setPhase = (next) => {
    if (phaseProp == null) setInternalPhase(next)
    onPhaseChange?.(next)
  }
  const [activeGridTab, setActiveGridTab] = useState(initialGridTab)

  const grouped = useMemo(() => {
    const g = {}
    for (const tab of PREVIEW_TABS) {
      g[tab.id] = rows.filter((r) => r.endorsementType === tab.id)
    }
    return g
  }, [rows])

  useEffect(() => {
    if (phaseProp != null) return
    onPhaseChange?.(internalPhase)
  }, [internalPhase, onPhaseChange, phaseProp])

  const premiumEmployees = rows.map(rowToPremiumEmployee)
  const { totalInclGst, lines, bucketLines } = buildAiEndorsementPremiumBreakdown(premiumEmployees)
  const cdAfterSubmit = MOCK_CD_AVAILABLE_RUPEES - totalInclGst
  const cdSubmitBlocked = cdAfterSubmit < 0

  const displayLines = [
    ...(bucketLines || []),
    ...lines.filter((l) => ['subtotal_ex_gst', 'gst', 'total'].includes(l.id)),
  ]

  const summary = {
    total: rows.length,
    additions: grouped.onboarding?.length ?? 0,
    addDependents: grouped.add_dependent?.length ?? 0,
    updates: grouped.update?.length ?? 0,
    deletions: grouped.delete?.length ?? 0,
    offboards: grouped.offboard?.length ?? 0,
  }

  const noop = () => {}

  if (phase === 'grid') {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="ai-endorsement-preview-grid">
        {cdSubmitBlocked ? (
          <div
            className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-950"
            role="alert"
          >
            Estimated CD after this batch is negative. Go back and edit rows, recharge CD, or remove entries before
            submitting.
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch lg:gap-5">
          <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <AiEndorsementGridCard
              rows={rows}
              rowValidation={rowValidation}
              touchedCells={{}}
              rowFilter="all"
              rowSourceFilter="all"
              mappedFieldIds={mappedFieldIds}
              activeGridTab={activeGridTab}
              onGridTabChange={setActiveGridTab}
              readOnly
              fillHeight
              hideExpand
              onUpdateRow={noop}
              onUpdatePlan={noop}
              onTouchCell={noop}
            />
          </div>

          <aside className="order-2 flex w-full shrink-0 flex-col lg:w-[min(calc(19rem+10px),32vw)] lg:max-w-[calc(21rem+10px)] lg:justify-start">
            <div className="w-full lg:max-h-[min(calc(100vh-8rem),40rem)] lg:overflow-y-auto lg:overscroll-contain">
              <CdBalanceFormWidget
                cdAfterSubmit={cdAfterSubmit}
                currentCd={MOCK_CD_AVAILABLE_RUPEES}
                estimatedCdDraw={totalInclGst}
                lines={displayLines}
                primaryBatchCount={rows.length}
                estimateReady
              />
            </div>
          </aside>
        </div>

        <AiEndorsementPreviewFooter
          summary={summary}
          showSummary
          variant="pinned"
          actions={
            <AiEndorsementPreviewGridActions
              onBack={onBack}
              onContinue={() => setPhase('summary')}
              onStartOver={onStartOver}
              rowCount={rows.length}
            />
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="ai-endorsement-preview-summary">
      <PreviewSummaryView
        rows={rows}
        grouped={grouped}
        cdAfterSubmit={cdAfterSubmit}
        totalInclGst={totalInclGst}
        displayLines={displayLines}
        cdSubmitBlocked={cdSubmitBlocked}
      />

      <AiEndorsementPreviewFooter
        summary={summary}
        showSummary={false}
        variant="pinned"
        actions={
          <AiEndorsementPreviewActions
            onBack={() => setPhase('grid')}
            backLabel="Back"
            onSubmit={onSubmit}
            onStartOver={onStartOver}
            submitting={submitting}
            cdSubmitBlocked={cdSubmitBlocked}
            rowCount={rows.length}
          />
        }
      />
    </div>
  )
}
