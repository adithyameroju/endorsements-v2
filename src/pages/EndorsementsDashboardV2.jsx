import { useNavigate } from 'react-router-dom'
import { UserPlus, UserCog, UserMinus, RefreshCw, ArrowRight, ChevronRight } from 'lucide-react'
import EndorsementHistory from '../components/endorsements-v2/EndorsementHistory'
import EndorsementsExperienceSelect from '../components/EndorsementsExperienceSelect'
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
]

/**
 * @param {{ experience: string, onExperienceChange: (value: string) => void }} props
 */
export default function EndorsementsDashboardV2({ experience, onExperienceChange }) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-6 pt-7 pb-3 lg:px-8">
      <div className="mb-3 flex-shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Endorsements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Run add, update, or delete endorsements; review activity, schedules, and history in one place. HRMS-driven changes are reviewed separately.
          </p>
        </div>
        <EndorsementsExperienceSelect value={experience} onChange={onExperienceChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3 flex-shrink-0">
        {actions.map((item) => {
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
        <EndorsementHistory />
      </div>
    </div>
  )
}
