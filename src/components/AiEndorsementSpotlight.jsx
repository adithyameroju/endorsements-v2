import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'

const PAD = 10
const TOOLTIP_GAP = 14

/**
 * @param {{ targetRef: import('react').RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void }} props
 */
export default function AiEndorsementSpotlight({ targetRef, open, onDismiss }) {
  const maskId = useId().replace(/:/g, '')
  const [rect, setRect] = useState(null)

  const updateRect = useCallback(() => {
    const el = targetRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    })
  }, [targetRef])

  useEffect(() => {
    if (!open) {
      setRect(null)
      return undefined
    }

    const raf = requestAnimationFrame(updateRect)
    const onLayout = () => updateRect()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
    }
  }, [open, updateRect])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss])

  if (!open || !rect) return null

  const hole = {
    x: rect.left - PAD,
    y: rect.top - PAD,
    w: rect.width + PAD * 2,
    h: rect.height + PAD * 2,
  }

  const tooltipTop = hole.y + hole.h + TOOLTIP_GAP
  const tooltipLeft = Math.min(
    Math.max(hole.x + hole.w / 2, 168),
    window.innerWidth - 168,
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[250] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${maskId}-title`}
    >
      {/* Dimmed backdrop with cutout — clicks on dim dismiss */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-auto"
        aria-hidden="true"
        onClick={onDismiss}
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={hole.x}
              y={hole.y}
              width={hole.w}
              height={hole.h}
              rx={16}
              ry={16}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.62)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Glow ring around highlighted card */}
      <div
        className="absolute rounded-2xl border-2 border-violet-400/90 pointer-events-none ai-spotlight-ring"
        style={{
          top: hole.y,
          left: hole.x,
          width: hole.w,
          height: hole.h,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto -translate-x-1/2 w-[min(22rem,calc(100vw-2rem))]"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="relative rounded-2xl border border-violet-200 bg-white p-4 shadow-2xl shadow-violet-900/15">
          <div
            className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-violet-200 bg-white"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Dismiss introduction"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p id={`${maskId}-title`} className="text-sm font-bold text-gray-900">
                New: AI Endorsements
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Upload any HR file and AI will extract additions, updates, and deletions into an editable
                review grid — no manual sorting required.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
