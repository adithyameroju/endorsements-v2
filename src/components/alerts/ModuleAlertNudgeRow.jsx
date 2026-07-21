import { AlertTriangle } from 'lucide-react'
import { helpCalloutError, helpCalloutWarning } from '../../lib/helpUiTokens'
import AlertInboxActions from './AlertInboxActions'

function shellClass(severity) {
  return severity === 'critical' ? helpCalloutError : helpCalloutWarning
}

function iconClass(severity) {
  return severity === 'critical' ? 'text-rose-600' : 'text-amber-700'
}

/** Compact in-module alert banner — callout style with CTA aligned on the row. */
export default function ModuleAlertNudgeRow({ item, primaryLabel, onPrimary, onDismiss }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${shellClass(item.severity)}`}>
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertTriangle
          className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass(item.severity)}`}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{item.body}</p>
        </div>
      </div>
      <AlertInboxActions
        size="compact"
        align="start"
        primaryLabel={primaryLabel ?? item.actionLabel}
        onPrimary={onPrimary}
        onDismiss={onDismiss}
      />
    </div>
  )
}
