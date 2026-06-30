import { createContext, useCallback, useContext, useMemo } from 'react'

const AlertsContext = createContext(null)

/** Minimal alerts stub — CD Balance V3 does not surface alert management in this subproject. */
export function AlertsProvider({ children }) {
  const resolveInboxItemsForModule = useCallback(() => {}, [])
  const getRulesByModule = useCallback(() => [], [])
  const saveRule = useCallback(() => {}, [])
  const toggleRulePause = useCallback(() => {}, [])
  const deleteRule = useCallback(() => {}, [])

  const value = useMemo(
    () => ({
      resolveInboxItemsForModule,
      getRulesByModule,
      saveRule,
      toggleRulePause,
      deleteRule,
    }),
    [resolveInboxItemsForModule, getRulesByModule, saveRule, toggleRulePause, deleteRule],
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) {
    throw new Error('useAlerts must be used within AlertsProvider')
  }
  return ctx
}
