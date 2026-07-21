import { useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import { endorsementsModuleCrumb } from '../lib/breadcrumbPresets'
import AiEndorsementUpload from '../components/aiEndorsements/AiEndorsementUpload'
import AiEndorsementEditStep from '../components/aiEndorsements/AiEndorsementEditStep'
import AiEndorsementPreviewBifurcated from '../components/aiEndorsements/AiEndorsementPreviewBifurcated'
import {
  AI_STEP_GRID,
  AI_STEP_PREVIEW,
  AI_STEP_UPLOAD,
  AI_WIZARD_STEPS,
  ENDORSEMENT_TYPE_LABELS,
  PREVIEW_TABS,
} from '../lib/aiEndorsementSchema'
import {
  analyzeColumnMappings,
  applyMappingsToRows,
  parseSpreadsheetFile,
} from '../lib/aiEndorsementMapper'
import { countReadyRows, rowToPremiumEmployee, validateAllAiRows } from '../lib/aiEndorsementValidation'
import { buildAiEndorsementPremiumBreakdown } from '../lib/quickAddPremiumEstimate'
import {
  initialAiWizardState,
  stepperCurrentStep,
  wizardReducer,
} from '../lib/aiEndorsementWizard'
import { useEndorsements } from '../store/EndorsementStore'

const ANALYZE_STEP_DELAYS_MS = [1000, 1100, 900, 1000]
const ANALYZE_MIN_OVERLAY_MS = 3800

const ANALYZE_STEPS = [
  { id: 0, label: 'Reading spreadsheet' },
  { id: 1, label: 'Detecting columns' },
  { id: 2, label: 'Matching to system fields' },
  { id: 3, label: 'Building review grid' },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function AnalyzeProgressOverlay({ currentStep }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xs space-y-3">
        <p className="text-center text-sm font-semibold text-gray-900">Analyzing your file</p>
        <ul className="space-y-2">
          {ANALYZE_STEPS.map((step) => {
            const done = currentStep > step.id
            const active = currentStep === step.id
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2.5 text-xs ${
                  active ? 'font-semibold text-indigo-800' : done ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? 'bg-emerald-100 text-emerald-700'
                      : active
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? (
                    <Check size={12} strokeWidth={2.5} aria-hidden />
                  ) : active ? (
                    <Loader2 size={12} className="animate-spin" aria-hidden />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  )}
                </span>
                {step.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default function AiEndorsements() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const [state, dispatch] = useReducer(wizardReducer, initialAiWizardState)
  const [submitting, setSubmitting] = useState(false)
  const [parseError, setParseError] = useState('')
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [previewPhase, setPreviewPhase] = useState('grid')

  const goUpload = () => dispatch({ type: 'SET_STEP', stepIndex: AI_STEP_UPLOAD })
  const goGrid = () => dispatch({ type: 'SET_STEP', stepIndex: AI_STEP_GRID })
  const goPreview = () => dispatch({ type: 'SET_STEP', stepIndex: AI_STEP_PREVIEW })

  const handleStartOver = () => {
    if (
      !window.confirm('Start over? Your uploaded file and edits will be cleared.')
    ) {
      return
    }
    dispatch({ type: 'RESET' })
    setPreviewPhase('grid')
    setAnalyzeStep(0)
    setParseError('')
    setSubmitting(false)
  }

  const readyRows = useMemo(() => {
    const readyIds = new Set(
      state.rowValidation.filter((v) => v.valid && v.status === 'ready').map((v) => v.rowId),
    )
    return state.rows.filter((r) => readyIds.has(r.id))
  }, [state.rows, state.rowValidation])

  const readyCount = useMemo(() => countReadyRows(state.rowValidation), [state.rowValidation])

  const readyValidation = useMemo(() => {
    const readyIds = new Set(readyRows.map((r) => r.id))
    return state.rowValidation.filter((v) => readyIds.has(v.rowId))
  }, [readyRows, state.rowValidation])

  const mappedFieldIds = useMemo(
    () => Object.values(state.mappings || {}).filter(Boolean),
    [state.mappings],
  )

  useEffect(() => {
    if (state.stepIndex !== AI_STEP_PREVIEW) {
      setPreviewPhase('grid')
    }
  }, [state.stepIndex])

  const breadcrumbs = useMemo(() => {
    const base = [endorsementsModuleCrumb, { label: 'AI Endorsements', onClick: goUpload }]
    if (state.stepIndex === AI_STEP_UPLOAD) {
      return [endorsementsModuleCrumb, { label: 'AI Endorsements' }]
    }
    if (state.stepIndex === AI_STEP_GRID) {
      return [...base, { label: 'Review & edit' }]
    }
    if (state.stepIndex === AI_STEP_PREVIEW) {
      return [
        ...base,
        { label: 'Review & edit', onClick: goGrid },
        {
          label: previewPhase === 'summary' ? 'Confirm & submit' : 'Preview impact',
        },
      ]
    }
    return [endorsementsModuleCrumb, { label: 'AI Endorsements' }]
  }, [state.stepIndex, previewPhase])

  const headerOnBack = useMemo(() => {
    if (state.stepIndex === AI_STEP_GRID) return goUpload
    if (state.stepIndex === AI_STEP_PREVIEW && previewPhase === 'grid') return goGrid
    if (state.stepIndex === AI_STEP_PREVIEW && previewPhase === 'summary') {
      return () => setPreviewPhase('grid')
    }
    return undefined
  }, [state.stepIndex, previewPhase])

  const handleAnalyze = async () => {
    if (!state.file) return
    setParseError('')
    setAnalyzeStep(0)
    dispatch({ type: 'START_ANALYZE' })
    const overlayStart = Date.now()
    try {
      setAnalyzeStep(0)
      await sleep(ANALYZE_STEP_DELAYS_MS[0])
      const parseResult = await parseSpreadsheetFile(state.file)

      setAnalyzeStep(1)
      await sleep(ANALYZE_STEP_DELAYS_MS[1])

      setAnalyzeStep(2)
      await sleep(ANALYZE_STEP_DELAYS_MS[2])
      const analysis = analyzeColumnMappings(parseResult.headers)

      setAnalyzeStep(3)
      await sleep(ANALYZE_STEP_DELAYS_MS[3])
      const rows = applyMappingsToRows(parseResult.rows, analysis.mappings)

      const elapsed = Date.now() - overlayStart
      if (elapsed < ANALYZE_MIN_OVERLAY_MS) {
        await sleep(ANALYZE_MIN_OVERLAY_MS - elapsed)
      }

      dispatch({
        type: 'ANALYZE_DONE',
        parseResult,
        analysis,
        mappings: analysis.mappings,
        rows,
        rowValidation: validateAllAiRows(rows),
        stepIndex: AI_STEP_GRID,
      })
    } catch (err) {
      dispatch({ type: 'ANALYZE_FAIL' })
      setParseError(err.message ?? 'Could not read this file.')
    } finally {
      setAnalyzeStep(0)
    }
  }

  const handleSubmit = () => {
    if (!readyRows.length) return

    setSubmitting(true)
    const premiumEmployees = readyRows.map(rowToPremiumEmployee)
    const { totalInclGst, lines, gstRatePercent } = buildAiEndorsementPremiumBreakdown(premiumEmployees)

    const grouped = {}
    for (const row of readyRows) {
      const t = row.endorsementType || 'onboarding'
      if (!grouped[t]) grouped[t] = []
      grouped[t].push(row)
    }

    const changeLines = []
    for (const tab of PREVIEW_TABS) {
      const group = grouped[tab.id]
      if (!group?.length) continue
      changeLines.push(`— ${tab.label} (${group.length}) —`)
      group.forEach((r) => {
        changeLines.push(`${r.memberName || r.empId} (${ENDORSEMENT_TYPE_LABELS[r.endorsementType]})`)
      })
    }

    addEntry({
      action: 'AI Endorsement',
      count: readyRows.length,
      status: 'Success',
      type: 'bulk',
      details: readyRows.map((r) => ({
        name: r.memberName,
        id: r.empId,
        email: r.email,
        type: r.endorsementType,
      })),
      changeSummary: {
        title: 'AI endorsement batch by action type',
        lines: changeLines,
      },
      premiumSummary: {
        totalInclGst,
        gstRatePercent,
        lines: lines.filter((l) => !l.id.startsWith('bucket_')).map((l) => ({ label: l.label, amount: l.amount })),
      },
    })

    setSubmitting(false)
    navigate('/', {
      replace: true,
      state: {
        flashToast: {
          message:
            'Endorsement submitted. Progress is shown in the history table below.',
        },
      },
    })
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-gray-50 px-6 lg:px-8 ${
        state.stepIndex === AI_STEP_PREVIEW
          ? 'overflow-hidden pt-6 pb-0'
          : 'overflow-y-auto py-6'
      }`}
    >
      <div className={state.stepIndex === AI_STEP_PREVIEW ? 'shrink-0' : undefined}>
        <PageHeader
          title="AI Endorsements"
          subtitle={
            state.stepIndex === AI_STEP_GRID
              ? 'Fix issues, adjust mapping if needed, then preview CD impact'
              : state.stepIndex === AI_STEP_PREVIEW
                ? previewPhase === 'grid'
                  ? 'Review CD impact against your batch in the spreadsheet view'
                  : 'Confirm batch summary and CD impact before you submit'
                : 'Upload any Excel or CSV — review in a spreadsheet view, preview CD impact, then submit'
          }
          breadcrumbs={breadcrumbs}
          onBack={headerOnBack}
          trailing={
            <Stepper
              steps={AI_WIZARD_STEPS.map((s) => s.label)}
              currentStep={stepperCurrentStep(state.stepIndex, previewPhase)}
              compact
            />
          }
        />
      </div>

      <div
        className={`w-full ${state.stepIndex === AI_STEP_PREVIEW ? 'flex min-h-0 flex-1 flex-col' : 'space-y-5'}`}
      >
        {state.stepIndex === AI_STEP_UPLOAD ? (
          <>
            <div className="relative rounded-xl border border-violet-200 bg-white p-5 space-y-5">
              {state.analyzing ? <AnalyzeProgressOverlay currentStep={analyzeStep} /> : null}
              <div className="flex items-center gap-2 text-violet-800">
                <Sparkles size={18} aria-hidden />
                <p className="text-sm font-semibold">Smart column mapping</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                One file can mix onboarding, updates, deletions, offboards, and add-dependent rows — set endorsement
                type per row in the grid, or map an Endorsement type column from your file.
              </p>
              <AiEndorsementUpload
                file={state.file}
                onFileSelect={(file) => dispatch({ type: 'SET_FILE', file })}
              />
              {parseError ? (
                <p className="text-sm text-red-600" role="alert">
                  {parseError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="inline-flex items-center gap-x-1 whitespace-nowrap text-xs text-gray-500">
                Prefer our standard template?
                <Link to="/add/bulk" className="font-semibold text-indigo-600 hover:underline">
                  Use bulk upload
                </Link>
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!state.file || state.analyzing}
                  onClick={handleAnalyze}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {state.analyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} aria-hidden />
                      Analyze file
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {state.stepIndex === AI_STEP_GRID ? (
          <AiEndorsementEditStep
            state={state}
            dispatch={dispatch}
            onContinue={goPreview}
            onStartOver={handleStartOver}
            continueDisabled={readyCount === 0}
          />
        ) : null}

        {state.stepIndex === AI_STEP_PREVIEW ? (
          <AiEndorsementPreviewBifurcated
            rows={readyRows}
            rowValidation={readyValidation}
            mappedFieldIds={mappedFieldIds}
            phase={previewPhase}
            onSubmit={handleSubmit}
            onBack={goGrid}
            onStartOver={handleStartOver}
            onPhaseChange={setPreviewPhase}
            submitting={submitting}
          />
        ) : null}
      </div>
    </div>
  )
}
