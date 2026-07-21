import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import AiEndorsementColumnMapper from './AiEndorsementColumnMapper'

export default function AiEndorsementMappingModal({
  open,
  headers = [],
  mappings = {},
  actionType = 'add',
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(mappings)

  useEffect(() => {
    if (open) setDraft(mappings)
  }, [open, mappings])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleMappingChange = (header, fieldId) => {
    setDraft((prev) => ({ ...prev, [header]: fieldId }))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-mapping-modal-title"
        className="relative z-10 flex h-[min(94vh,56rem)] w-[min(96vw,90rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="ai-mapping-modal-title" className="text-base font-bold text-gray-900">
              Match file columns to system fields
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Choose where each column from your file should land — preview updates below as you map.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          <AiEndorsementColumnMapper
            headers={headers}
            mappings={draft}
            onMappingChange={handleMappingChange}
            actionType={actionType}
            missingRequired={[]}
            compact
            fillHeight
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave?.(draft)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Save mapping
          </button>
        </div>
      </div>
    </div>
  )
}
