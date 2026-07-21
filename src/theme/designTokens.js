/**
 * Design tokens — Tailwind class strings aligned with PageHeader, EndorsementsDashboard,
 * QuickAdd / QuickAddBatchStickyFooter, Stepper, and src/lib/formUi.js.
 * Import these in new UI instead of duplicating long class lists.
 */

/** Page scroll root (see AGENTS.md UI shell checklist). */
export const pageShellScrollRoot =
  'flex h-full min-h-0 flex-col overflow-y-auto'

/** Standard horizontal + vertical padding on the scroll shell. */
export const pageShellPadding = 'px-6 py-3 lg:px-8'

export const pageCanvasBg = 'bg-gray-50'

/** Primary column width under Layout — full width, no arbitrary max-w centering. */
export const pageContentWidth = 'w-full'

/** Section card shell (white surface + border + shadow) — add left accent via sectionAccentBorder. */
export const sectionCardShell =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm p-4 pl-3.5'

/** Large inset panel (e.g. Quick Add main white container). */
export const insetPanelShell =
  'rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden'

export const sectionAccentBorder = {
  indigo: 'border-l-[3px] border-l-indigo-500',
  sky: 'border-l-[3px] border-l-sky-500',
  violet: 'border-l-[3px] border-l-violet-500',
}

/** Maps to updateFormSectionShell keys in formUi.js — kept in sync via formUi re-export pattern. */
export const formSectionShellByAccent = {
  basic: `${sectionCardShell} ${sectionAccentBorder.indigo}`,
  plans: `${sectionCardShell} ${sectionAccentBorder.sky}`,
  dependents: `${sectionCardShell} ${sectionAccentBorder.violet}`,
}

export const typography = {
  pageTitle: 'text-2xl font-bold tracking-tight text-gray-900',
  pageSubtitle: 'mt-1 text-sm leading-snug text-gray-500',
  sectionTitle: 'text-base font-bold text-gray-900 tracking-tight leading-snug',
  fieldLabel: 'block text-sm font-semibold text-gray-700 mb-2',
  helper: 'text-xs text-gray-500 mt-1.5 leading-snug',
  cardEyebrow: 'text-[10px] font-semibold uppercase tracking-wide',
}

export const shadows = {
  card: 'shadow-sm',
  cardHoverLg: 'hover:shadow-lg',
  primaryButton: 'shadow-md shadow-indigo-600/20',
  stickyFooterUp: 'shadow-[0_-4px_16px_rgba(0,0,0,0.05)]',
  insetRing: 'ring-1 ring-black/[0.04]',
}

/** Primary / secondary CTA recipes (endorsements flows). */
export const buttonRecipe = {
  primary:
    'inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 min-h-[3rem] px-6 py-3.5 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl font-semibold text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-4 py-2.5 transition-all hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg font-medium text-sm text-gray-500 transition-colors hover:text-indigo-600 disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/15 min-h-[2.75rem] px-5 py-3 disabled:opacity-50 disabled:pointer-events-none',
}

/** Sticky footer bar outer — pairs with negative mx to align with page gutters. */
export const stickyFooterBarShell =
  'flex-shrink-0 sticky bottom-0 z-40 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-2.5'

export const kpiChipRecipe = {
  indigo: {
    shell: 'inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 min-h-[3.25rem]',
    iconWrap: 'flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-indigo-600 shrink-0',
    label: `${typography.cardEyebrow} text-indigo-600/85`,
  },
  emerald: {
    shell: 'inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 min-h-[3.25rem]',
    iconWrap: 'flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600 shrink-0',
    label: `${typography.cardEyebrow} text-emerald-800/80`,
  },
  violet: {
    shell: 'inline-flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 min-h-[3.25rem]',
    iconWrap: 'flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-violet-600 shrink-0',
    label: `${typography.cardEyebrow} text-violet-800/80`,
  },
}

/** Dashboard-style large tile (EndorsementsDashboard action cards). */
export const dashboardActionTileShell =
  'group relative overflow-hidden flex flex-col justify-between p-5 bg-white rounded-2xl border transition-all cursor-pointer text-left min-h-[130px]'
