import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import EndorsementsDashboardV1 from './EndorsementsDashboardV1'
import EndorsementsDashboardV2 from './EndorsementsDashboardV2'
import {
  ENDORSEMENT_EXPERIENCE_V1,
  ENDORSEMENT_EXPERIENCE_V2,
  readEndorsementExperienceVersion,
  writeEndorsementExperienceVersion,
} from '../lib/endorsementExperienceVersion'

const EXPERIENCE_SELECT_CLASS =
  'min-h-[2.25rem] cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function EndorsementsDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [experience, setExperience] = useState(() => readEndorsementExperienceVersion())
  const [toast, setToast] = useState(null)
  const [toastPhase, setToastPhase] = useState('enter')
  const toastTimerRef = useRef(null)
  const toastExitTimerRef = useRef(null)

  useEffect(() => {
    writeEndorsementExperienceVersion(experience)
  }, [experience])

  useEffect(() => {
    const flash = location.state?.flashToast
    if (!flash?.message) return undefined

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    if (toastExitTimerRef.current) window.clearTimeout(toastExitTimerRef.current)

    // AI Endorsements lives under Update 2.0 — land there after submit
    setExperience(ENDORSEMENT_EXPERIENCE_V2)
    setToast({ message: flash.message })
    setToastPhase('enter')
    navigate('.', { replace: true, state: {} })

    toastTimerRef.current = window.setTimeout(() => {
      setToastPhase('exit')
      toastExitTimerRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimerRef.current = null
        toastExitTimerRef.current = null
      }, 320)
    }, 3500)

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      if (toastExitTimerRef.current) window.clearTimeout(toastExitTimerRef.current)
    }
  }, [location.state, navigate])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed left-1/2 top-4 z-[120] flex max-w-[min(calc(100vw-2rem),28rem)] items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-lg backdrop-blur-[2px] ${
            toastPhase === 'exit' ? 'portal-toast-exit' : 'portal-toast-enter'
          }`}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <span>{toast.message}</span>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-end px-6 pt-3 lg:px-8">
        <label htmlFor="endorsements-experience-version" className="mr-2 text-xs font-medium text-gray-500">
          Experience
        </label>
        <select
          id="endorsements-experience-version"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className={EXPERIENCE_SELECT_CLASS}
          aria-label="Endorsements experience version"
        >
          <option value={ENDORSEMENT_EXPERIENCE_V1}>V1</option>
          <option value={ENDORSEMENT_EXPERIENCE_V2}>Update 2.0</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {experience === ENDORSEMENT_EXPERIENCE_V2 ? (
          <EndorsementsDashboardV2 />
        ) : (
          <EndorsementsDashboardV1 />
        )}
      </div>
    </div>
  )
}
