import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Home } from 'lucide-react'

export default function PageHeader({ title, subtitle, breadcrumbs = [], backPath, backLabel }) {
  const navigate = useNavigate()

  const resolvedBackPath = backPath || deriveBackPath(breadcrumbs)
  const resolvedBackLabel = backLabel || deriveBackLabel(breadcrumbs)
  const showNav = resolvedBackPath || breadcrumbs.length > 0

  return (
    <div className="mb-6">
      {showNav && (
        <nav className="flex items-center gap-0 text-sm mb-3">
          {resolvedBackPath && (
            <>
              <button
                onClick={() => navigate(resolvedBackPath)}
                className="group inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border border-transparent hover:border-indigo-600"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                <span className="text-xs font-semibold">Back</span>
              </button>
              <div className="w-px h-4 bg-gray-200 mx-2.5 flex-shrink-0" />
            </>
          )}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <Home size={12} />
              <span className="hidden sm:inline">Endorsements</span>
            </button>
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={12} className="text-gray-300" />
                {item.path ? (
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-gray-600 font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        </nav>
      )}
      <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function deriveBackPath(breadcrumbs) {
  if (!breadcrumbs.length) return null
  const withPath = breadcrumbs.filter(b => b.path)
  if (withPath.length > 0) return withPath[withPath.length - 1].path
  return '/'
}

function deriveBackLabel(breadcrumbs) {
  if (!breadcrumbs.length) return 'Back'
  const withPath = breadcrumbs.filter(b => b.path)
  if (withPath.length > 0) return withPath[withPath.length - 1].label
  return 'Endorsements'
}
