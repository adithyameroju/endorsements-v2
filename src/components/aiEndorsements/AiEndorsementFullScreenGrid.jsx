import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function AiEndorsementFullScreenGrid({ open, onClose, children }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!open) {
      setExpanded(false)
      return undefined
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true))
    })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 cursor-pointer ${
          expanded ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close expanded view"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex flex-col bg-gray-50 shadow-2xl transition-all duration-300 ease-out ${
          expanded
            ? 'm-0 h-full w-full rounded-none'
            : 'm-6 h-[calc(100%-3rem)] w-[min(72rem,calc(100%-3rem))] rounded-xl border border-gray-200'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Review & edit data — full view</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <X size={14} aria-hidden />
            Close
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )
}
