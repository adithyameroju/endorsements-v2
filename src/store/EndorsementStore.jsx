/* eslint-disable react-refresh/only-export-components -- context + hook live together by design */
import { createContext, useContext, useState } from 'react'
import { endorsementHistory as seed } from '../data/mockData'

const Ctx = createContext()

export function EndorsementProvider({ children }) {
  const [history, setHistory] = useState(seed)

  const addEntry = ({ action, count = 1, status = 'Success', type = 'quick', details = null }) => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      action,
      doneBy: 'Adithya M.',
      status,
      count,
      type,
      details,
      isNew: true,
    }
    setHistory(prev => [entry, ...prev])
    return entry
  }

  const updateEntry = (id, updates) => {
    setHistory(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  return <Ctx.Provider value={{ history, addEntry, updateEntry }}>{children}</Ctx.Provider>
}

export function useEndorsements() {
  return useContext(Ctx)
}
