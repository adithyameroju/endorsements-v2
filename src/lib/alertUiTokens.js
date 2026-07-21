/** Shared alert list / toolbar tokens (aligned with CD Balance alerts modal). */
import { portalFilterChipClass } from './portalChipTokens'

export const ALERT_TOOLBAR_BTN =
  'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20'

export const ALERT_BTN_PRIMARY = `${ALERT_TOOLBAR_BTN} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:opacity-100`

export const ALERT_BTN_SECONDARY = `${ALERT_TOOLBAR_BTN} border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50`

export function alertFilterChipClass(active) {
  return portalFilterChipClass(active)
}

/** @deprecated Use alertFilterChipClass — single filter chip style project-wide. */
export function alertModuleChipClass(active) {
  return portalFilterChipClass(active)
}

/** Compact search in card toolbars (matches CD Balance activity table). */
export const ALERT_TOOLBAR_SEARCH =
  'h-8 w-full rounded-lg border border-gray-200 bg-white py-1 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

export const ALERT_ACTIVITY_TOOLBAR =
  'flex min-h-[3.25rem] shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 py-3'

export const ALERT_THRESHOLD_QUICK_AMOUNTS = [5_00_000, 10_00_000, 25_00_000]
