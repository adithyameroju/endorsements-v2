import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

const BTN_BASE =
  'group inline-flex min-w-0 cursor-pointer items-center gap-1 rounded px-0 py-0.5 hover:bg-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25'

/**
 * Sortable table header for endorsement tables (`aria-sort`, toggle asc/desc).
 *
 * @param {{ children: import('react').ReactNode; columnKey: string; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (key: string) => void; align?: 'left' | 'right' | 'center'; className?: string; scope?: string }} props
 */
export default function EndorsementSortTh({
  children,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
  className = '',
  scope = 'col',
  title: headerTitle = '',
}) {
  const active = sortKey === columnKey
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  const justifyClass =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  const btnClass = `${BTN_BASE} w-full ${justifyClass}`

  return (
    <th
      scope={scope}
      title={headerTitle || undefined}
      className={`min-w-0 px-2 py-2 ${alignClass} text-xs font-semibold normal-case tracking-normal text-[#495057] ${className}`}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className={btnClass} onClick={() => onSort(columnKey)}>
        {align === 'right' ? (
          <>
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
              aria-hidden
            />
            <span className="min-w-0 truncate tabular-nums">{children}</span>
          </>
        ) : (
          <>
            <span className="min-w-0 truncate">{children}</span>
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
              aria-hidden
            />
          </>
        )}
      </button>
    </th>
  )
}
