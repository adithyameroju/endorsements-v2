import { selectNativeChevronClass } from './formUi'

/** Scroll container for AI endorsement excel grid. */
export const PORTAL_GRID_SCROLL_CLASS =
  'portal-grid-scroll min-h-0 flex-1 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]'

/** Idle cell — plain text; hover shows inset gray box. */
export const gridCellIdleClass =
  'group/cell flex h-full min-h-[2rem] w-full min-w-0 cursor-default items-center p-1 text-xs text-gray-900 text-left'

export const gridCellIdleEmptyClass = `${gridCellIdleClass} text-gray-400`

/** Inner value box — lavender/gray on hover, sits inside cell padding. */
export const gridCellIdleInnerClass =
  'inline-flex max-w-full min-w-0 truncate rounded-md px-2 py-1 transition-colors group-hover/cell:bg-indigo-50/80'

/** Active (editing) — slightly larger than hover inset box, not full cell. */
export const gridCellEditClass =
  'inline-flex min-h-[1.625rem] max-w-full min-w-[3rem] w-auto truncate rounded-md border border-[#2b4189] bg-white px-2 py-1 text-xs text-gray-900 outline-none shadow-[0_0_0_2px_rgba(43,65,137,0.12)] cursor-text box-border'

export const gridCellErrorClass = 'bg-red-50/80'

export const gridCellSelectEditClass = `${gridCellEditClass} ${selectNativeChevronClass} cursor-pointer`

/** Wrapper to center compact edit controls inside the cell. */
export const gridCellEditWrapClass = 'flex h-full min-h-[2rem] w-full items-center p-1'

export { selectNativeChevronClass }

export const dropdownTriggerClass =
  'inline-flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 text-left'

export const dropdownTriggerLabelClass = 'min-w-0 flex-1 truncate'

export const dropdownChevronClass = 'h-3.5 w-3.5 shrink-0 text-gray-400'

export const headerChevronButtonClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded p-1 pr-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600'

/** Combined Status + Actions frozen rail (single opaque pane). */
export const AI_GRID_RIGHT_RAIL_W = 'w-[12rem] lg:w-[12.5rem]'
export const AI_GRID_STATUS_INNER_W = 'min-w-0 flex-1 basis-32'
export const AI_GRID_ACTIONS_INNER_W = 'flex w-10 shrink-0 items-center justify-center'

/** Fixed-column chrome — opaque backgrounds + edge shadows (inset lines stay visible while scrolling). */
export const AI_GRID_STICKY_LEFT =
  'sticky left-0 z-[3] shadow-[inset_-2px_0_0_0_#d1d5db,4px_0_10px_-4px_rgba(15,23,42,0.12)]'

/** Excel-style freeze line on the left edge of the right rail. */
export const AI_GRID_STICKY_RIGHT_RAIL =
  'sticky right-0 z-[3] box-border shadow-[inset_2px_0_0_0_#d1d5db,-10px_0_18px_-10px_rgba(15,23,42,0.18)]'

/** @deprecated use AI_GRID_RIGHT_RAIL_* — kept for any external imports */
export const AI_GRID_ACTIONS_W = 'w-10'
export const AI_GRID_STATUS_W = 'w-32'
export const AI_GRID_STATUS_RIGHT = 'right-10'
export const AI_GRID_ACTIONS_PAD = 'pr-6 lg:pr-8'
export const AI_GRID_STICKY_RAIL_STATUS = AI_GRID_STICKY_RIGHT_RAIL
export const AI_GRID_STICKY_RAIL_ACTIONS = ''
