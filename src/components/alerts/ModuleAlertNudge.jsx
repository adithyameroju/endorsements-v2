import { useNavigate, useLocation } from 'react-router-dom'
import { useModuleAlerts } from '../../context/AlertsContext'
import { ALERT_MODULES, ALERT_MODULE_IN_PAGE_ACTIONS } from '../../data/alertsMock'
import ModuleAlertNudgeRow from './ModuleAlertNudgeRow'

function isOnModulePage(pathname, modulePath) {
  if (!modulePath) return false
  if (pathname === modulePath) return true
  return pathname.startsWith(`${modulePath}/`)
}

/** Module-scoped triggered alert nudges — compact callout banners below PageHeader. */
export default function ModuleAlertNudge({ moduleId, className = '', inPageAction }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { openTriggers, dismissInboxItem } = useModuleAlerts(moduleId)

  if (openTriggers.length === 0) return null

  const visible = openTriggers.slice(0, 1)
  const modulePath = ALERT_MODULES[moduleId]?.path
  const onModulePage = isOnModulePage(pathname, modulePath)
  const defaultInPage = ALERT_MODULE_IN_PAGE_ACTIONS[moduleId]

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {visible.map((item) => {
        const useInPage =
          onModulePage &&
          (inPageAction || defaultInPage) &&
          (!item.actionPath || item.actionPath === modulePath || pathname.startsWith(item.actionPath))

        const primaryLabel = useInPage
          ? inPageAction?.label ?? defaultInPage?.label ?? item.actionLabel
          : item.actionLabel

        return (
          <ModuleAlertNudgeRow
            key={item.id}
            item={item}
            primaryLabel={primaryLabel}
            onPrimary={() => {
              if (useInPage) {
                if (inPageAction?.onClick) {
                  inPageAction.onClick(item)
                  return
                }
                defaultInPage?.onClick?.(item)
                return
              }
              if (item.actionPath) navigate(item.actionPath)
            }}
            onDismiss={() => dismissInboxItem(item.id)}
          />
        )
      })}
      {openTriggers.length > 1 ? (
        <p className="text-[11px] text-gray-500">
          +{openTriggers.length - 1} more triggered alert{openTriggers.length - 1 === 1 ? '' : 's'} in Updates
        </p>
      ) : null}
    </div>
  )
}
