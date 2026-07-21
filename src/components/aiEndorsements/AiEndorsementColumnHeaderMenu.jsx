import { useEffect, useRef } from 'react'
import { getGridField, planOptionsForKind } from '../../lib/aiEndorsementSchema'

const PLAN_KINDS = {
  gmcBasePlan: 'gmcBase',
  gmcSecondaryPlan: 'gmcSecondary',
  gpaBasePlan: 'gpaBase',
  gmcTopup: 'gmcTopup',
  gmcAddons: 'gmcAddon',
}

const MENU_ITEM =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50'

export default function AiEndorsementColumnHeaderMenu({ fieldId, open, onClose, onApply }) {
  const ref = useRef(null)
  const field = getGridField(fieldId)
  const isPlan = field?.type === 'plan'
  const planKind = PLAN_KINDS[fieldId] || field?.planKind
  const options = isPlan ? planOptionsForKind(planKind) : []

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !fieldId) return null

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      role="menu"
    >
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
        Apply to all
      </p>
      {options.map((p) => (
        <button
          key={p.id || 'none'}
          type="button"
          role="menuitem"
          className={MENU_ITEM}
          onClick={() => {
            onApply({ value: p.id, scope: 'all' })
            onClose()
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}
