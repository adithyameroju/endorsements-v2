import { useNavigate } from 'react-router-dom'
import { Pencil, Upload, Heart, Baby, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const primaryOptions = [
  { title: 'Quick Update', description: 'Update employee details or add dependents', icon: Pencil, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200 hover:border-blue-300', path: '/update/quick' },
  { title: 'Bulk Update', description: 'Upload Excel to update multiple employees', icon: Upload, color: 'bg-teal-50 text-teal-600', border: 'border-teal-200 hover:border-teal-300', path: '/update/bulk' },
]

const lifeEvents = [
  { title: 'Add Spouse', description: 'Register a spouse for an employee', icon: Heart, color: 'bg-pink-50 text-pink-600', border: 'border-pink-200 hover:border-pink-300', path: '/update/life-event/spouse' },
  { title: 'Add Newborn', description: 'Register a new child for an employee', icon: Baby, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200 hover:border-amber-300', path: '/update/life-event/newborn' },
]

export default function UpdateEmployee() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader
        title="Update Employee"
        subtitle="Choose how you'd like to update employee details"
        breadcrumbs={[{ label: 'Update Employee' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl">
        {primaryOptions.map((opt) => <Card key={opt.title} opt={opt} onClick={() => navigate(opt.path)} />)}
      </div>

      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Life Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {lifeEvents.map((opt) => <Card key={opt.title} opt={opt} onClick={() => navigate(opt.path)} />)}
      </div>
    </div>
  )
}

function Card({ opt, onClick }) {
  const Icon = opt.icon
  return (
    <button onClick={onClick} className={`group flex flex-col items-start p-5 bg-white rounded-xl border ${opt.border} transition-all hover:shadow-md cursor-pointer text-left`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${opt.color} mb-3.5`}><Icon size={20} /></div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{opt.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{opt.description}</p>
      <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-indigo-600 group-hover:gap-2 transition-all">Continue <ArrowRight size={14} /></div>
    </button>
  )
}
