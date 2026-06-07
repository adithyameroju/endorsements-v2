import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'

/**
 * Page header with optional breadcrumb trail.
 *
 * **Breadcrumbs:** Pass `breadcrumbs={[]}` on a module’s landing page — nothing is shown in the nav row.
 * On inner pages, pass `[ …parents with path or onClick, { label: 'Current page' } ]` — the **last** item is
 * always treated as the current page (not clickable). Parent items are muted and clickable with hover.
 *
 * **Back:** Icon-only when `breadcrumbs.length > 0`. Uses `onBack` / `backPath` when provided; otherwise
 * navigates to the **immediate parent** (second-to-last crumb’s `path`). `aria-label` describes the target.
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  backPath,
  backLabel,
  trailing,
  navTrailing,
  onBack,
  hideBackButton = false,
  titleClassName,
}) {
  const navigate = useNavigate()

  const hasBreadcrumbTrail = breadcrumbs.length > 0
  const parentNav = hasBreadcrumbTrail ? getParentNavTarget(breadcrumbs) : null

  const resolvedBackPath =
    backPath ?? (typeof onBack === 'function' ? null : parentNav?.path ?? null)
  const resolvedBackLabel =
    backLabel ||
    (typeof onBack === 'function' ? 'Back' : parentNav?.label ?? 'Back')

  const showBackButton =
    hasBreadcrumbTrail &&
    !hideBackButton &&
    (typeof onBack === 'function' || !!resolvedBackPath || !!backPath)

  const backAriaLabel =
    typeof onBack === 'function'
      ? backLabel || 'Back'
      : parentNav?.label
        ? `Go back to ${parentNav.label}`
        : backPath || resolvedBackPath
          ? resolvedBackLabel
          : 'Go back to previous page'

  const showNavRow = hasBreadcrumbTrail || !!navTrailing

  const handleBackClick = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    const target = backPath ?? resolvedBackPath
    if (target) navigate(target)
  }

  return (
    <div className="mb-4">
      {showNavRow && (
        <nav className="mb-2.5 flex items-center justify-between gap-2 text-sm" aria-label="Breadcrumb">
          <div className="flex min-w-0 items-center gap-0">
            {hasBreadcrumbTrail && showBackButton && (
              <>
                <button
                  type="button"
                  onClick={handleBackClick}
                  aria-label={backAriaLabel}
                  title={backAriaLabel}
                  className="group inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-gray-100 text-gray-600 transition-all hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                >
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
                </button>
                <div className="mx-2 h-4 w-px shrink-0 bg-gray-200" aria-hidden />
              </>
            )}
            {hasBreadcrumbTrail && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px]">
                {breadcrumbs.map((item, i) => {
                  const isCurrent = i === breadcrumbs.length - 1
                  const interactive = !isCurrent && ((item.path != null && item.path !== '') || typeof item.onClick === 'function')
                  return (
                    <span key={i} className="inline-flex items-center gap-1">
                      {i > 0 ? <ChevronRight size={12} className="shrink-0 text-gray-300" aria-hidden /> : null}
                      {isCurrent ? (
                        <span className="font-semibold text-gray-900" aria-current="page">
                          {item.label}
                        </span>
                      ) : interactive ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof item.onClick === 'function') {
                              item.onClick()
                              return
                            }
                            navigate(item.path)
                          }}
                          className="cursor-pointer font-medium text-gray-500 transition-colors hover:text-indigo-600"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <span className="font-medium text-gray-500">{item.label}</span>
                      )}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          {navTrailing ? <div className="shrink-0">{navTrailing}</div> : null}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1
            className={
              titleClassName || 'text-2xl font-bold tracking-tight text-gray-900'
            }
          >
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm leading-snug text-gray-500">{subtitle}</p> : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  )
}

/** Parent of the current (last) crumb — used for default Back when `onBack` is not passed. */
function getParentNavTarget(breadcrumbs) {
  if (breadcrumbs.length < 2) return null
  const parent = breadcrumbs[breadcrumbs.length - 2]
  if (parent?.path != null && parent.path !== '') {
    return { path: parent.path, label: parent.label }
  }
  return null
}
