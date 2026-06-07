import { useRef, useState } from 'react'
import { Eye, Download, FileDown, Loader2, MoreVertical } from 'lucide-react'
import HeaderDropdownPortal from '../header/HeaderDropdownPortal'
import {
  getEndorsementScheduleStatus,
  canViewEndorsementSchedule,
  isScheduleDocumentReady,
  isScheduleEligibleEndorsement,
  downloadEndorsementDetailsExcel,
} from './endorsementScheduleShared'
import { ENDORSEMENT_TABLE_ICON_BTN } from './ScheduleDocumentModals'

const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * V4: schedule actions behind a menu icon (Generate / View / Download).
 */
export default function EndorsementScheduleActionsMenu({
  row,
  onGenerateSchedule,
  onViewSchedule,
  onDownloadPdf,
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const scheduleStatus = getEndorsementScheduleStatus(row)

  if (!isScheduleEligibleEndorsement(row)) {
    return <span className="text-[12px] text-gray-400">—</span>
  }

  if (scheduleStatus === 'processing') {
    return (
      <div className="inline-flex items-center gap-1 text-indigo-600">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        <span className="text-[11px] font-medium">Generating…</span>
      </div>
    )
  }

  if (scheduleStatus !== 'pending' && scheduleStatus !== 'generated') {
    return <span className="text-[12px] text-gray-400">—</span>
  }

  const viewReady = canViewEndorsementSchedule(row)
  const pdfReady = isScheduleDocumentReady(row)

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
        aria-label="Schedule actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Schedule actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={14} strokeWidth={2} className="shrink-0" aria-hidden />
      </button>
      <HeaderDropdownPortal
        open={open}
        triggerRef={triggerRef}
        onClose={() => setOpen(false)}
        align="right"
        className="min-w-[11.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      >
        {scheduleStatus === 'pending' ? (
          <button
            type="button"
            className={MENU_ITEM}
            onClick={() => closeAnd(() => onGenerateSchedule?.(row))}
          >
            Generate schedule
          </button>
        ) : null}
        {scheduleStatus === 'generated' ? (
          <>
            <button
              type="button"
              disabled={!viewReady}
              className={MENU_ITEM}
              onClick={() => closeAnd(() => onViewSchedule?.(row))}
            >
              <Eye size={12} strokeWidth={2} className="shrink-0" aria-hidden />
              View schedule
            </button>
            <button
              type="button"
              disabled={!pdfReady}
              className={MENU_ITEM}
              onClick={() => closeAnd(() => downloadEndorsementDetailsExcel(row))}
            >
              <Download size={12} strokeWidth={2} className="shrink-0" aria-hidden />
              Download Excel
            </button>
            <button
              type="button"
              disabled={!pdfReady}
              className={MENU_ITEM}
              onClick={() => closeAnd(() => onDownloadPdf?.(row))}
            >
              <FileDown size={12} strokeWidth={2} className="shrink-0" aria-hidden />
              Download PDF
            </button>
          </>
        ) : null}
      </HeaderDropdownPortal>
    </div>
  )
}
