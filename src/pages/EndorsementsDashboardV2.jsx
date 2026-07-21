import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  UserPlus,
  UserCog,
  UserMinus,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import EndorsementHistory from '../components/EndorsementHistory'
import ModuleAlertNudge from '../components/alerts/ModuleAlertNudge'
import { hrmsJoiningEmployees, hrmsLeavingEmployees } from '../data/mockData'

const pendingHrmsCount = hrmsJoiningEmployees.length + hrmsLeavingEmployees.length

const actions = [
  {
    title: 'Add Employee',
    description: 'Add new employees with plan selection',
    icon: UserPlus,
    iconBg: 'bg-emerald-500',
    decorBg: 'bg-emerald-100',
    borderColor: 'border-emerald-100 hover:border-emerald-200',
    path: '/add',
  },
  {
    title: 'Update Employee',
    description: 'Update details, dependents, or plans',
    icon: UserCog,
    iconBg: 'bg-blue-500',
    decorBg: 'bg-blue-100',
    borderColor: 'border-blue-100 hover:border-blue-200',
    path: '/update',
  },
  {
    title: 'Delete Employee',
    description: 'Remove employees from the policy',
    icon: UserMinus,
    iconBg: 'bg-rose-500',
    decorBg: 'bg-rose-100',
    borderColor: 'border-rose-100 hover:border-rose-200',
    path: '/delete',
  },
  {
    title: 'AI Endorsements',
    description: 'Upload your own Excel—AI maps columns to our format, you review and submit',
    icon: Sparkles,
    iconBg: 'bg-violet-600',
    decorBg: 'bg-violet-100',
    borderColor: 'border-violet-100 hover:border-violet-200',
    path: '/endorsements/ai',
    isNew: true,
  },
]

/** Update 2.0 landing — mirrors MLP V1 Endorsements dashboard. */
export default function EndorsementsDashboardV2() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scheduleExperienceVersion, setScheduleExperienceVersion] = useState('v1')
  const [toast, setToast] = useState(null)
  const [toastPhase, setToastPhase] = useState('enter')
  const toastTimerRef = useRef(null)
  const toastExitTimerRef = useRef(null)

  useEffect(() => {
    const flash = location.state?.flashToast
    if (!flash?.message) return undefined

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    if (toastExitTimerRef.current) window.clearTimeout(toastExitTimerRef.current)

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

  const visibleActions =
    scheduleExperienceVersion === 'v2'
      ? actions.filter((item) => item.path !== '/endorsements/ai')
      : actions

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-6 py-6 lg:px-8">
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

      <div className="mb-3 flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endorsements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Run add, update, or delete endorsements; review activity, schedules, and history in one place. HRMS-driven changes are reviewed separately.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          <label htmlFor="endorsements-schedule-experience" className="sr-only">
            Schedule experience version
          </label>
          <select
            id="endorsements-schedule-experience"
            value={scheduleExperienceVersion}
            onChange={(e) => setScheduleExperienceVersion(e.target.value)}
            className="min-h-[2.25rem] cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="Schedule experience version"
          >
            <option value="v1">V1</option>
            <option value="v2">V2</option>
          </select>
        </div>
      </div>

      <ModuleAlertNudge moduleId="endorsements" className="mb-3 flex-shrink-0" />

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 flex-shrink-0 ${
          scheduleExperienceVersion === 'v2' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
        }`}
      >
        {visibleActions.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`group relative overflow-hidden flex flex-col justify-between p-5 bg-white rounded-2xl border ${item.borderColor} transition-all hover:shadow-lg cursor-pointer text-left min-h-[130px]`}
            >
              <div className={`absolute -top-6 -right-6 w-24 h-24 ${item.decorBg} rounded-full opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none`} />
              <div className={`absolute -top-3 -right-3 w-16 h-16 ${item.decorBg} rounded-full opacity-40 pointer-events-none`} />

              <div className="relative z-[1]">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconBg} shadow-sm`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  {item.isNew ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                      New
                    </span>
                  ) : null}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>

              <div className="relative z-[1] flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-3 group-hover:gap-2 transition-all">
                Get started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate('/hrms-sync')}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 mb-5 text-left bg-amber-50/90 border border-amber-200/80 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer flex-shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <RefreshCw size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">HRMS sync queue</p>
            <p className="text-xs text-amber-900/80 truncate">
              {pendingHrmsCount > 0
                ? `${pendingHrmsCount} joining or leaving employee${pendingHrmsCount !== 1 ? 's' : ''} waiting for review`
                : 'No pending HRMS changes — open to view history'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-amber-700 flex-shrink-0" />
      </button>

      <div className="flex-1 min-h-0">
        <EndorsementHistory scheduleExperienceVersion={scheduleExperienceVersion} />
      </div>
    </div>
  )
}
