/**
 * Shared layout tokens for portal data tables inside card/tab tool surfaces.
 * See `.cursor/rules/employer-portal-ui-shell.mdc` § Data tables.
 */

/** Full-bleed header row background inside a card table. */
export const PORTAL_TABLE_THEAD_TR_CLASS = 'border-b border-gray-200 bg-[#f1f3f5]'

/** Section gutter — tabs, toolbars, pagination (aligns with page shell px-6 lg:px-8). */
export const PORTAL_TABLE_SECTION_GUTTER = 'px-6 lg:px-8'

/** Raw edge utilities for empty states spanning all columns. */
export const PORTAL_TABLE_EDGE_PL = 'pl-6 lg:pl-8'
export const PORTAL_TABLE_EDGE_PR = 'pr-6 lg:pr-8'

/** First / last header cell — text inset; background stays full bleed. */
export const PORTAL_TABLE_HEAD_EDGE_PL = 'pl-6 pr-2 lg:pl-8'
export const PORTAL_TABLE_HEAD_EDGE_PR = 'pl-2 pr-6 lg:pr-8'

/** Body cells — reduced inner padding. */
export const PORTAL_TABLE_CELL_INNER = 'px-2 py-1.5'

/** First / last body cell — aligns with section gutter. */
export const PORTAL_TABLE_CELL_EDGE_PL = 'py-1.5 pl-6 pr-2 lg:pl-8'
export const PORTAL_TABLE_CELL_EDGE_PR = 'py-1.5 pl-2 pr-6 lg:pr-8'

/** Scroll container for card-embedded tool tables. */
export const PORTAL_TABLE_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-x-hidden overflow-y-auto [min-height:max(16rem,28dvh)]'

/** Fixed-width table inside card — no horizontal scroll. */
export const PORTAL_TABLE_CLASS = 'w-full min-w-0 table-fixed border-collapse'

/** Non-sortable header cell (matches EndorsementSortTh density). */
export const PORTAL_TABLE_TH_CLASS =
  'min-w-0 px-2 py-2 text-left text-xs font-semibold normal-case tracking-normal text-[#495057]'

/** Legacy aliases — prefer PORTAL_TABLE_* in new code. */
export const ENDORSEMENT_THEAD_TR_CLASS = PORTAL_TABLE_THEAD_TR_CLASS
export const ENDORSEMENT_TABLE_EDGE_PL = PORTAL_TABLE_EDGE_PL
export const ENDORSEMENT_TABLE_EDGE_PR = PORTAL_TABLE_EDGE_PR
export const ENDORSEMENT_TABLE_HEAD_EDGE_PL = PORTAL_TABLE_HEAD_EDGE_PL
export const ENDORSEMENT_TABLE_HEAD_EDGE_PR = PORTAL_TABLE_HEAD_EDGE_PR
export const ENDORSEMENT_TABLE_CELL_INNER = PORTAL_TABLE_CELL_INNER
export const ENDORSEMENT_TABLE_CELL_EDGE_PL = PORTAL_TABLE_CELL_EDGE_PL
export const ENDORSEMENT_TABLE_CELL_EDGE_PR = PORTAL_TABLE_CELL_EDGE_PR
