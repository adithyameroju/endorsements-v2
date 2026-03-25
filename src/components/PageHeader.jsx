import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Home } from 'lucide-react'

export default function PageHeader({ title, subtitle, breadcrumbs = [], backPath, backLabel, trailing, navTrailing, onBack, hideBackButton = false }) {
  const navigate = useNavigate()

  const resolvedBackPath = backPath ?? deriveBackPath(breadcrumbs)
  const resolvedBackLabel = backLabel || deriveBackLabel(breadcrumbs)
  const showBackButton = !hideBackButton && (typeof onBack === 'function' || !!resolvedBackPath)
  const showNav = showBackButton || breadcrumbs.length > 0 || navTrailing

  const handleBackClick = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    if (resolvedBackPath) navigate(resolvedBackPath)
  }

  return (
    <div className="mb-4">
      {showNav && (
        <nav className="flex items-center justify-between gap-2 text-sm mb-2.5">
          <div className="flex items-center gap-0 min-w-0">
          {showBackButton && (
            <>
              <button
                type="button"
                onClick={handleBackClick}
                className="group inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border border-transparent hover:border-indigo-600"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                <span className="text-[11px] font-semibold">{resolvedBackLabel}</span>
              </button>
              <div className="w-px h-4 bg-gray-200 mx-2.5 flex-shrink-0" />
            </>
          )}
          <div className="flex items-center gap-1 text-[11px]">
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
                {(item.path != null && item.path !== '') || typeof item.onClick === 'function' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof item.onClick === 'function') {
                        item.onClick()
                        return
                      }
                      navigate(item.path)
                    }}
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
          </div>
          {navTrailing && <div className="flex-shrink-0">{navTrailing}</div>}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        {trailing && <div className="flex-shrink-0">{trailing}</div>}
      </div>
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
