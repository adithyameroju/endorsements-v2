import {
  ENDORSEMENT_TYPES,
  GENDER_OPTIONS,
  RELATION_OPTIONS,
  getGridField,
  planOptionsForKind,
} from '../../lib/aiEndorsementSchema'
import { selectNativeChevronClass } from '../../lib/gridUi'

const PLAN_KINDS = {
  gmcBasePlan: 'gmcBase',
  gmcSecondaryPlan: 'gmcSecondary',
  gpaBasePlan: 'gpaBase',
  gmcTopup: 'gmcTopup',
  gmcAddons: 'gmcAddon',
}

const compactInputClass =
  'min-w-[5rem] max-w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const compactSelectClass = `${compactInputClass} ${selectNativeChevronClass} cursor-pointer`

/**
 * Inline field editor for AI fix modal — always editable, compact excel-like control.
 */
export default function AiFixFieldEditor({
  fieldId,
  row,
  value: controlledValue,
  onChange,
  onPlanChange,
  className = '',
}) {
  const field = getGridField(fieldId)
  if (!field) return null

  const isPlan = field.type === 'plan'
  const value = controlledValue ?? (isPlan ? row.plans?.[fieldId] ?? '' : row[fieldId] ?? '')

  if (field.type === 'endorsementType') {
    return (
      <select
        value={row.endorsementType || 'onboarding'}
        onChange={(e) => onChange({ endorsementType: e.target.value })}
        className={`${compactSelectClass} ${className}`}
      >
        {ENDORSEMENT_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'relation') {
    return (
      <select
        value={row.relation ?? ''}
        onChange={(e) => onChange({ relation: e.target.value })}
        className={`${compactSelectClass} ${className}`}
      >
        <option value="">—</option>
        {RELATION_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'gender') {
    return (
      <select
        value={row.gender ?? ''}
        onChange={(e) => onChange({ gender: e.target.value })}
        className={`${compactSelectClass} ${className}`}
      >
        <option value="">—</option>
        {GENDER_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'plan') {
    const kind = PLAN_KINDS[fieldId] || field.planKind
    const options = planOptionsForKind(kind)
    return (
      <select
        value={value}
        onChange={(e) => onPlanChange(fieldId, e.target.value)}
        className={`${compactSelectClass} ${className}`}
      >
        {options.map((p) => (
          <option key={p.id || 'none'} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    )
  }

  const inputType = field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'

  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange({ [fieldId]: e.target.value })}
      className={`${compactInputClass} ${className}`}
    />
  )
}
