import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  ALERT_MODULE_LIST,
  ALERT_MODULES,
  initialAlertInboxSeed,
  initialAlertRulesSeed,
} from '../data/alertsMock'

const AlertsContext = createContext(null)

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 }

function isOpenInboxItem(item) {
  return item.status === 'open' || item.status === 'acknowledged'
}

function sortBySeverity(items) {
  return [...items].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
  )
}

export function AlertsProvider({ children }) {
  const [rules, setRules] = useState(() => initialAlertRulesSeed.map((r) => ({ ...r })))
  const [inboxItems, setInboxItems] = useState(() => initialAlertInboxSeed.map((i) => ({ ...i })))

  const getRulesByModule = useCallback(
    (moduleId) => rules.filter((r) => r.module === moduleId),
    [rules],
  )

  const getRuleById = useCallback((id) => rules.find((r) => r.id === id) ?? null, [rules])

  const getInboxForModule = useCallback(
    (moduleId, { openOnly = false, unreadOnly = false } = {}) => {
      let list = inboxItems.filter((i) => i.module === moduleId)
      if (openOnly) list = list.filter(isOpenInboxItem)
      if (unreadOnly) list = list.filter((i) => i.unread)
      return sortBySeverity(list)
    },
    [inboxItems],
  )

  const getUnreadCountForModule = useCallback(
    (moduleId) => inboxItems.filter((i) => i.module === moduleId && i.unread).length,
    [inboxItems],
  )

  const getUncoveredModules = useCallback(() => {
    const covered = new Set(rules.map((r) => r.module))
    return Object.values(ALERT_MODULES).filter((m) => !covered.has(m.id))
  }, [rules])

  const saveRule = useCallback((rule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === rule.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...rule }
        return next
      }
      return [{ ...rule, lastTriggeredAt: rule.lastTriggeredAt ?? null }, ...prev]
    })
  }, [])

  const toggleRulePause = useCallback((id) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r,
      ),
    )
  }, [])

  const deleteRule = useCallback((id) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const markInboxItemRead = useCallback((id) => {
    setInboxItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)))
  }, [])

  const markAllInboxRead = useCallback(() => {
    setInboxItems((prev) => prev.map((i) => ({ ...i, unread: false })))
  }, [])

  const resolveInboxItem = useCallback((id) => {
    setInboxItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'resolved', unread: false } : i,
      ),
    )
  }, [])

  const resolveInboxItemsForModule = useCallback((moduleId) => {
    setInboxItems((prev) =>
      prev.map((i) =>
        i.module === moduleId && isOpenInboxItem(i)
          ? { ...i, status: 'resolved', unread: false }
          : i,
      ),
    )
  }, [])

  const dismissInboxItem = useCallback((id) => {
    setInboxItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const unreadInboxCount = useMemo(
    () => inboxItems.filter((i) => i.unread && isOpenInboxItem(i)).length,
    [inboxItems],
  )

  const attentionInboxItems = useMemo(
    () => sortBySeverity(inboxItems.filter((i) => i.unread && isOpenInboxItem(i))),
    [inboxItems],
  )

  const activeRuleCount = useMemo(() => rules.filter((r) => r.status === 'active').length, [rules])

  const pausedRuleCount = useMemo(() => rules.filter((r) => r.status === 'paused').length, [rules])

  const totalRuleCount = useMemo(() => rules.length, [rules])

  const firedRecentlyCount = useMemo(() => inboxItems.length, [inboxItems])

  const triggeredCount7d = useMemo(() => inboxItems.length, [inboxItems])

  const uncoveredModuleCount = useMemo(() => getUncoveredModules().length, [getUncoveredModules])

  const value = useMemo(
    () => ({
      rules,
      inboxItems,
      attentionInboxItems,
      modules: ALERT_MODULE_LIST,
      getRulesByModule,
      getRuleById,
      getInboxForModule,
      getUnreadCountForModule,
      getUncoveredModules,
      saveRule,
      toggleRulePause,
      deleteRule,
      markInboxItemRead,
      markAllInboxRead,
      resolveInboxItem,
      resolveInboxItemsForModule,
      dismissInboxItem,
      unreadInboxCount,
      activeRuleCount,
      pausedRuleCount,
      totalRuleCount,
      firedRecentlyCount,
      triggeredCount7d,
      uncoveredModuleCount,
    }),
    [
      rules,
      inboxItems,
      attentionInboxItems,
      getRulesByModule,
      getRuleById,
      getInboxForModule,
      getUnreadCountForModule,
      getUncoveredModules,
      saveRule,
      toggleRulePause,
      deleteRule,
      markInboxItemRead,
      markAllInboxRead,
      resolveInboxItem,
      resolveInboxItemsForModule,
      dismissInboxItem,
      unreadInboxCount,
      activeRuleCount,
      pausedRuleCount,
      totalRuleCount,
      firedRecentlyCount,
      triggeredCount7d,
      uncoveredModuleCount,
    ],
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider')
  return ctx
}

/** Module-scoped inbox + rule helpers for contextual nudges. */
export function useModuleAlerts(moduleId) {
  const ctx = useAlerts()
  const openTriggers = useMemo(
    () => ctx.getInboxForModule(moduleId, { openOnly: true }),
    [ctx, moduleId],
  )
  const activeRules = useMemo(
    () => ctx.getRulesByModule(moduleId).filter((r) => r.status === 'active'),
    [ctx, moduleId],
  )

  return {
    openTriggers,
    activeRules,
    activeRuleCount: activeRules.length,
    dismissInboxItem: ctx.dismissInboxItem,
    resolveInboxItem: ctx.resolveInboxItem,
    resolveInboxItemsForModule: ctx.resolveInboxItemsForModule,
  }
}
