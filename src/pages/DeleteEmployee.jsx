import { useNavigate } from 'react-router-dom'
import { ClipboardList, Upload, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const options = [
  {
    title: 'Quick Deletion',
    description: 'Search and remove individual employees from the policy.',
    icon: ClipboardList,
    color: 'bg-red-50 text-red-600',
    border: 'border-red-200 hover:border-red-300',
    path: '/delete/quick',
  },
  {
    title: 'Bulk Deletion',
    description: 'Upload an Excel file with employee IDs to remove in bulk.',
    icon: Upload,
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-200 hover:border-orange-300',
    path: '/delete/bulk',
  },
]

export default function DeleteEmployee() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader
        title="Delete Employee"
        subtitle="Choose how you'd like to remove employees from the policy"
        breadcrumbs={[{ label: 'Delete Employee' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.title}
              onClick={() => navigate(opt.path)}
              className={`group flex flex-col items-start p-6 bg-white rounded-xl border ${opt.border} transition-all hover:shadow-md cursor-pointer text-left`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.color} mb-4`}><Icon size={24} /></div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{opt.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{opt.description}</p>
              <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5 transition-all">Continue <ArrowRight size={16} /></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
