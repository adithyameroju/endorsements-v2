/**
 * Help / support color tokens.
 * Indigo = brand & actions. Emerald/amber/rose = semantic status only.
 * Use helpPrimaryBtn at most once per visible section.
 */

/** Highest: main action (Share feedback, submit) */
export const helpPrimaryBtn =
  'inline-flex cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30'

/** Medium: bordered indigo surface (Open module, All releases) */
export const helpSecondaryBtn =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 transition-colors hover:border-indigo-300 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20'

/** Low: text navigation (Try in portal, More guides, mailto) */
export const helpLink =
  'cursor-pointer text-sm font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline'

export const helpLinkInline =
  'cursor-pointer font-semibold text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline'

/** Subtle: step numbers */
export const helpStepBadge =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600'

/** Subtle: topic / release tags */
export const helpChip =
  'rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700'

/** Neutral meta (steps count, min read) */
export const helpChipMeta =
  'rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600'

/** —— Semantic badges (B2B: green=new/success, amber=warning, rose=error/major) —— */

export const helpBadgeNew =
  'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800'

export const helpBadgeLatest =
  'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800'

export const helpBadgeBeta =
  'inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900'

export const helpBadgeMajor =
  'inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700'

export const helpBadgeMinor =
  'inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800'

/** —— Callouts —— */

export const helpCalloutWarning =
  'rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3.5'

export const helpCalloutSuccess =
  'rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3.5'

export const helpCalloutError =
  'rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-3.5'

export const helpCategoryLabel =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500'

/** Card title — browse-by-topic tiles, video tutorial titles, etc. */
export const helpCardTitle =
  'text-sm font-semibold text-gray-900 group-hover:text-indigo-700'

export const helpSectionTitle = 'text-lg font-semibold tracking-tight text-gray-900'

export const helpSectionSubtitle = 'mt-1 text-xs text-gray-500'

/** Standard spacing between section header and body content */
export const helpSectionBody = 'mt-4'

/** Bordered tile — no shadow (grid cards, topic tiles, guide cards) */
export const helpCardSurface =
  'rounded-xl border border-gray-200 bg-white'

/** Consistent internal padding for help module cards */
export const helpCardPadding = 'p-4 sm:p-5'

/** Consistent grid gap for card sections */
export const helpCardGridGap = 'gap-4 lg:gap-5'

/** Divider block below card header (contact details, etc.) */
export const helpCardSectionBody =
  'mt-3 space-y-2 border-t border-gray-100 pt-3'

/** Secondary text — always reserves two lines for grid alignment */
export const helpCardSubtext =
  'line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-gray-500'

export const helpCardHover =
  'transition-[border-color,box-shadow] hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20'

/** Hero quick-prompt chips — clickable but neutral (not indigo) */
export const helpPromptChip =
  'cursor-pointer rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/40'

/** Article feedback Yes/No — compact inline pills */
export const helpFeedbackBtn =
  'inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/40'

export const helpIconTile =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600'

export const helpInputFocus =
  'outline-none transition hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

/** Standard help module search field (topic page, hero, releases) */
export const helpSearchInput =
  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

export const helpHeroShell =
  'help-hero-shell relative overflow-hidden border border-white/10 bg-gradient-to-br from-sidebar via-[#252256] to-sidebar-hover'

export const helpHeroInner =
  'relative px-6 py-9 sm:px-10 sm:py-11'

/** Quick-prompt chips on dark hero background (matches sidebar pill style) */
export const helpHeroPromptChip =
  'cursor-pointer rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-indigo-100 transition hover:border-white/25 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'

export const helpEscalationShell =
  'relative w-full rounded-xl border border-indigo-100 bg-indigo-50/80'

export const helpEscalationIcon =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-100'
