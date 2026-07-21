import { formSectionShellByAccent, typography } from '../theme/designTokens'

/**
 * Shared Quick Add / dependent / plan form typography and control sizing.
 * Hierarchy: section title (largest) → field label → input text (sm) → helper (xs).
 */
export const formSectionTitleClass = typography.sectionTitle

export const formSectionBadgeClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold'

export const formFieldLabelClass = typography.fieldLabel

export const formHelperTextClass = typography.helper

/** Inputs and selects: one consistent height across Basic info, Plans, Dependents */
export const formControlClass =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white transition-colors min-h-[2.75rem] box-border'

export const formControlErrorClass = 'border-red-300 bg-red-50/30'

/** Native select: hide default chevron and reserve right padding. */
export const selectNativeChevronClass =
  'appearance-none bg-[length:0.75rem] bg-[position:right_0.625rem_center] bg-no-repeat pr-8 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239ca3af%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")]'

export const formSelectClass = `${formControlClass} ${selectNativeChevronClass}`

/** Custom dropdown trigger — label left, chevron right with breathing room. */
export const dropdownTriggerClass =
  'inline-flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 text-left'

export const dropdownTriggerLabelClass = 'min-w-0 flex-1 truncate'

export const dropdownChevronClass = 'h-3.5 w-3.5 shrink-0 text-gray-400'

/** Section shells aligned with Quick Add Employees (left accent + white card). Source: theme/designTokens.js */
export const updateFormSectionShell = formSectionShellByAccent
