import { useRef, useState } from 'react'
import {
  ENDORSEMENT_TYPES,
  ENDORSEMENT_TYPE_LABELS,
  GENDER_OPTIONS,
  RELATION_OPTIONS,
  getGridField,
  planOptionsForKind,
} from '../../lib/aiEndorsementSchema'
import {
  gridCellEditClass,
  gridCellEditWrapClass,
  gridCellErrorClass,
  gridCellIdleClass,
  gridCellIdleEmptyClass,
  gridCellIdleInnerClass,
  gridCellSelectEditClass,
} from '../../lib/gridUi'

const PLAN_KINDS = {
  gmcBasePlan: 'gmcBase',
  gmcSecondaryPlan: 'gmcSecondary',
  gpaBasePlan: 'gpaBase',
  gmcTopup: 'gmcTopup',
  gmcAddons: 'gmcAddon',
}

function planDisplayLabel(fieldId, value) {
  const kind = PLAN_KINDS[fieldId]
  const field = getGridField(fieldId)
  const options = planOptionsForKind(kind || field?.planKind)
  const match = options.find((p) => p.id === value)
  if (!value || value === 'none') return '—'
  return match?.name ?? value
}

function displayValue(field, row, fieldId, rawValue) {
  if (field.type === 'endorsementType') {
    return ENDORSEMENT_TYPE_LABELS[row.endorsementType || 'onboarding'] ?? row.endorsementType
  }
  if (field.type === 'plan') {
    return planDisplayLabel(fieldId, rawValue)
  }
  if (!rawValue) return '—'
  return rawValue
}

function IdleCell({ label, hasError, onActivate }) {
  const isEmpty = label === '—'
  return (
    <button
      type="button"
      onClick={onActivate}
      className={`${isEmpty ? gridCellIdleEmptyClass : gridCellIdleClass} ${hasError ? gridCellErrorClass : ''}`}
      title={typeof label === 'string' ? label : undefined}
    >
      <span className={`${gridCellIdleInnerClass} ${isEmpty ? 'text-gray-400' : ''}`}>{label}</span>
    </button>
  )
}

function EditWrap({ children, hasError }) {
  return (
    <div className={`${gridCellEditWrapClass} ${hasError ? gridCellErrorClass : ''}`}>{children}</div>
  )
}

export default function AiEndorsementGridCell({
  fieldId,
  row,
  error,
  touched,
  readOnly = false,
  onChange,
  onPlanChange,
  onBlur,
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const field = getGridField(fieldId)
  if (!field) return null

  const planKey = fieldId
  const isPlan = field.type === 'plan'
  const value = isPlan ? row.plans?.[planKey] ?? '' : row[fieldId] ?? ''
  const hasError = touched && error
  const label = displayValue(field, row, fieldId, value)
  const offboardLocked =
    row.endorsementType === 'offboard' && fieldId !== 'dateOfLeaving'
  const effectivelyReadOnly = readOnly || offboardLocked

  if (effectivelyReadOnly) {
    const isEmpty = label === '—'
    return (
      <div
        className={`${isEmpty ? gridCellIdleEmptyClass : gridCellIdleClass} cursor-default ${
          error ? gridCellErrorClass : ''
        }`}
        title={
          offboardLocked
            ? 'Only date of leaving is editable for offboard rows'
            : typeof label === 'string'
              ? label
              : undefined
        }
      >
        <span className={`${gridCellIdleInnerClass} ${isEmpty ? 'text-gray-400' : ''}`}>{label}</span>
      </div>
    )
  }

  const finishEdit = () => {
    setEditing(false)
    onBlur?.()
  }

  const activate = () => {
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const editCls = hasError ? `${gridCellEditClass} ring-1 ring-red-300` : gridCellEditClass
  const selectCls = hasError ? `${gridCellSelectEditClass} ring-1 ring-red-300` : gridCellSelectEditClass

  if (!editing) {
    return <IdleCell label={label} hasError={hasError} onActivate={activate} />
  }

  if (field.type === 'endorsementType') {
    return (
      <EditWrap hasError={hasError}>
        <select
          ref={inputRef}
          value={row.endorsementType || 'onboarding'}
          onChange={(e) => onChange({ endorsementType: e.target.value })}
          onBlur={finishEdit}
          className={selectCls}
          aria-invalid={hasError ? 'true' : undefined}
        >
          {ENDORSEMENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </EditWrap>
    )
  }

  if (field.type === 'relation') {
    return (
      <EditWrap hasError={hasError}>
        <select
          ref={inputRef}
          value={row.relation ?? ''}
          onChange={(e) => onChange({ relation: e.target.value })}
          onBlur={finishEdit}
          className={selectCls}
        >
          <option value="">—</option>
          {RELATION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </EditWrap>
    )
  }

  if (field.type === 'gender') {
    return (
      <EditWrap hasError={hasError}>
        <select
          ref={inputRef}
          value={row.gender ?? ''}
          onChange={(e) => onChange({ gender: e.target.value })}
          onBlur={finishEdit}
          className={selectCls}
        >
          <option value="">—</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </EditWrap>
    )
  }

  if (field.type === 'plan') {
    const kind = PLAN_KINDS[fieldId] || field.planKind
    const options = planOptionsForKind(kind)
    return (
      <EditWrap hasError={hasError}>
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => onPlanChange(planKey, e.target.value)}
          onBlur={finishEdit}
          className={selectCls}
          aria-invalid={hasError ? 'true' : undefined}
        >
          {options.map((p) => (
            <option key={p.id || 'none'} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </EditWrap>
    )
  }

  const inputType = field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'

  return (
    <EditWrap hasError={hasError}>
      <input
        ref={inputRef}
        type={inputType}
        value={value}
        onChange={(e) => onChange({ [fieldId]: e.target.value })}
        onBlur={finishEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finishEdit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className={editCls}
        aria-invalid={hasError ? 'true' : undefined}
        title={error || undefined}
      />
    </EditWrap>
  )
}
