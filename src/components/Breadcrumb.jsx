import { useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items }) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center gap-1 text-sm mb-5">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Endorsements</span>
      </button>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-gray-300" />
          {item.path ? (
            <button
              onClick={() => navigate(item.path)}
              className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
