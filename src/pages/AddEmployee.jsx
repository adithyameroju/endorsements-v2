import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Upload, ArrowRight, FolderOpen } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { hasQuickAddDraft, loadQuickAddDraft, formatDraftSavedLabel } from '../lib/quickAddDraft'

const options = [
  {
    title: 'Quick Add',
    description: 'Add up to 5 employees at a time using the form interface. Best for adding a few employees quickly.',
    icon: ClipboardList,
    color: 'bg-indigo-50 text-indigo-600',
    border: 'border-indigo-200 hover:border-indigo-300',
    path: '/add/quick',
  },
  {
    title: 'Bulk Upload',
    description: 'Upload an Excel template to add multiple employees at once. Best for large batches of employee additions.',
    icon: Upload,
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-200 hover:border-emerald-300',
    path: '/add/bulk',
  },
]

export default function AddEmployee() {
  const navigate = useNavigate()
  const [quickAddDraft, setQuickAddDraft] = useState(null)

  useEffect(() => {
    if (!hasQuickAddDraft()) {
      setQuickAddDraft(null)
      return
    }
    setQuickAddDraft(loadQuickAddDraft())
  }, [])

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader
        title="Add Employee"
        subtitle="Choose how you'd like to add new employees to the policy"
        breadcrumbs={[{ label: 'Add Employee' }]}
      />

      {quickAddDraft?.employees?.length ? (
        <div
          className="mb-5 max-w-3xl rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          role="status"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-950">Quick Add draft on this device</p>
            <p className="text-xs text-indigo-900/75 mt-0.5">
              {quickAddDraft.employees.length} employee{quickAddDraft.employees.length === 1 ? '' : 's'} saved
              {quickAddDraft.savedAt
                ? ` · ${formatDraftSavedLabel(quickAddDraft.savedAt)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/add/quick')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shrink-0 cursor-pointer"
          >
            <FolderOpen size={14} aria-hidden /> Resume Quick Add
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.title}
              onClick={() => navigate(opt.path)}
              className={`group flex flex-col items-start p-6 bg-white rounded-xl border ${opt.border} transition-all hover:shadow-md cursor-pointer text-left`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.color} mb-4`}>
                <Icon size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{opt.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{opt.description}</p>
              <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5 transition-all">
                Continue <ArrowRight size={16} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
