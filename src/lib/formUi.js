/**
 * Shared Quick Add / dependent / plan form typography and control sizing.
 * Hierarchy: section title (largest) → field label → input text (sm) → helper (xs).
 */
export const formSectionTitleClass =
  'text-base font-bold text-gray-900 tracking-tight leading-snug'

export const formSectionBadgeClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold'

export const formFieldLabelClass = 'block text-sm font-semibold text-gray-700 mb-2'

export const formHelperTextClass = 'text-xs text-gray-500 mt-1.5 leading-snug'

/** Inputs and selects: one consistent height across Basic info, Plans, Dependents */
export const formControlClass =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white transition-colors min-h-[2.75rem] box-border'

export const formControlErrorClass = 'border-red-300 bg-red-50/30'
