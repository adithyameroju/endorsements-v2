import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

/**
 * Renders header dropdown panels in document.body so they aren't clipped by overflow-hidden ancestors.
 */
export default function HeaderDropdownPortal({
  open,
  triggerRef,
  onClose,
  children,
  align = 'right',
  matchTriggerWidth = false,
  className = '',
}) {
  const panelRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!open || !triggerRef.current) return undefined

    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right : rect.left,
        width: rect.width,
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, triggerRef, align])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      const trigger = triggerRef.current
      const panel = panelRef.current
      if (trigger?.contains(e.target) || panel?.contains(e.target)) return
      onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  const style = {
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    transform: align === 'right' ? 'translateX(-100%)' : undefined,
    minWidth: matchTriggerWidth ? coords.width : undefined,
    zIndex: 200,
  }

  return createPortal(
    <div ref={panelRef} style={style} className={className}>
      {children}
    </div>,
    document.body,
  )
}
