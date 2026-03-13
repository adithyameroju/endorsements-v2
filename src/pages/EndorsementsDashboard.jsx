import { useNavigate } from 'react-router-dom'
import { UserPlus, UserCog, UserMinus, RefreshCw, ArrowRight, CalendarClock } from 'lucide-react'
import EndorsementHistory from '../components/EndorsementHistory'
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
    title: 'HRMS Sync',
    description: 'Sync and approve HRMS changes',
    icon: RefreshCw,
    iconBg: 'bg-amber-500',
    decorBg: 'bg-amber-100',
    borderColor: 'border-amber-100 hover:border-amber-200',
    path: '/hrms-sync',
    badge: pendingHrmsCount,
  },
]

export default function EndorsementsDashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full px-6 lg:px-8 py-6">
      <div className="mb-5 flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endorsements</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee additions, updates, deletions and HRMS syncs</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0">
          <CalendarClock size={16} />
          Endorsement Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5 flex-shrink-0">
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
                  {item.badge > 0 && (
                    <span className="relative flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      {item.badge} pending
                    </span>
                  )}
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

      <div className="flex-1 min-h-0">
        <EndorsementHistory />
      </div>
    </div>
  )
}
