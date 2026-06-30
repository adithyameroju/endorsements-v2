/**
 * Unified chip / pill tokens — canonical style matches CD Balance transaction history chips.
 */

/** CD transaction toolbar: indigo border when active, gray when idle. */
export function portalFilterChipClass(active) {
  return `cursor-pointer shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
    active
      ? 'border-indigo-600 text-indigo-700'
      : 'border-gray-200 text-gray-700 hover:border-gray-300'
  }`
}

/** Toggle pill inside forms (channels, etc.) — same active/idle border pattern. */
export function portalToggleChipClass(active) {
  return portalFilterChipClass(active)
}

/** Static meta tag — module, channel (CD alert row channel tags). */
export const portalMetaChip =
  'inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600'

/** Standard row action buttons. */
export const portalRowActionPrimary =
  'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/40'

export const portalRowActionGhost =
  'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/40'

/** Compact actions for Updates panel and module nudges. */
export const portalRowActionPrimaryCompact =
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-normal text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50'

/** Solid primary — Updates panel alert CTAs. */
export const portalRowActionPrimarySolid =
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-gray-900 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30'

export const portalRowActionGhostCompact =
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-md px-2.5 text-[11px] font-normal text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700'

/** Small footer link in Updates panel. */
export const portalPanelFooterLink =
  'inline-flex cursor-pointer items-center text-xs font-normal text-indigo-600 transition-colors hover:text-indigo-800 hover:underline'
