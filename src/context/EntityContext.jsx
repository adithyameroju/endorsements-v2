import { createContext, useContext, useMemo, useState } from 'react'
import { entityOptions } from '../data/entityMock'

const EntityContext = createContext(null)

export function EntityProvider({ children }) {
  const [entityId, setEntityId] = useState(entityOptions[0]?.id ?? 'ent_1')

  const selectedEntity = useMemo(
    () => entityOptions.find((e) => e.id === entityId) || entityOptions[0],
    [entityId],
  )

  const value = useMemo(
    () => ({ entityId, setEntityId, entityOptions, selectedEntity }),
    [entityId, selectedEntity],
  )

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>
}

export function useEntity() {
  const ctx = useContext(EntityContext)
  if (!ctx) {
    throw new Error('useEntity must be used within EntityProvider')
  }
  return ctx
}
