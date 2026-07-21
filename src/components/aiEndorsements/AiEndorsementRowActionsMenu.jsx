import { useRef, useState } from 'react'
import { Copy, Trash2, UserPlus, Users, MoreVertical } from 'lucide-react'
import HeaderDropdownPortal from '../header/HeaderDropdownPortal'
import { ENDORSEMENT_TABLE_ICON_BTN } from '../ScheduleDocumentModals'

const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50'

const MENU_ITEM_DANGER =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50'

export default function AiEndorsementRowActionsMenu({
  row,
  onCopy,
  onDelete,
  onAddDependent,
  onOpenDependent,
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const closeAnd = (fn) => {
    setOpen(false)
    fn?.()
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className={ENDORSEMENT_TABLE_ICON_BTN}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Row actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={14} strokeWidth={2} className="shrink-0" aria-hidden />
      </button>
      <HeaderDropdownPortal
        open={open}
        triggerRef={triggerRef}
        onClose={() => setOpen(false)}
        align="right"
        className="min-w-[11rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      >
        <button type="button" className={MENU_ITEM} onClick={() => closeAnd(() => onCopy(row.id))}>
          <Copy size={14} aria-hidden />
          Duplicate row
        </button>
        <button
          type="button"
          className={MENU_ITEM}
          onClick={() => closeAnd(() => onAddDependent(row.id))}
        >
          <Users size={14} aria-hidden />
          Add dependent below
        </button>
        {row.endorsementType === 'add_dependent' ? (
          <button
            type="button"
            className={MENU_ITEM}
            onClick={() => closeAnd(() => onOpenDependent(row.id))}
          >
            <UserPlus size={14} aria-hidden />
            Edit dependent details
          </button>
        ) : null}
        <div className="my-1 border-t border-gray-100" aria-hidden />
        <button type="button" className={MENU_ITEM_DANGER} onClick={() => closeAnd(() => onDelete(row.id))}>
          <Trash2 size={14} aria-hidden />
          Delete row
        </button>
      </HeaderDropdownPortal>
    </div>
  )
}
