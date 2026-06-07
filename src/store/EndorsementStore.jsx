/* eslint-disable react-refresh/only-export-components -- context + hook live together by design */
import { createContext, useContext, useState } from 'react'
import { endorsementHistory as seed } from '../data/mockData'

const Ctx = createContext()

const PROCESSING_MS_MIN = 4000
const PROCESSING_MS_MAX = 5000

export function EndorsementProvider({ children }) {
  const [history, setHistory] = useState(seed)

  /**
   * @param {object} opts
   * @param {string} opts.action
   * @param {number} [opts.count]
   * @param {'Success'|'Failed'|'In Progress'|'Processing'} [opts.status] — final status when animation runs (default Success)
   * @param {string} [opts.type]
   * @param {unknown} [opts.details]
   * @param {object} [opts.premiumSummary] — { totalInclGst, lines: [{ label, amount }], gstRatePercent? }
   * @param {object} [opts.changeSummary] — { title?, lines?: string[] } for view modal
   * @param {number} [opts.successCount] — records that succeeded (for split outcome UI)
   * @param {number} [opts.failedCount] — records that failed (for split outcome UI)
   */
  const addEntry = (opts = {}) => {
    const {
      action,
      count = 1,
      type = 'quick',
      details = null,
      premiumSummary = null,
      changeSummary = null,
      status: requestedStatus = 'Success',
      successCount: successCountOpt,
      failedCount: failedCountOpt,
      actorType,
      automationSource,
      actionCategory,
    } = opts

    const id = Date.now() + Math.floor(Math.random() * 1000)
    const shouldAnimate = requestedStatus === 'Success' || requestedStatus === 'Failed'

    const now = new Date()
    const entry = {
      id,
      date: now.toISOString().slice(0, 10),
      recordedAt: now.toISOString(),
      action,
      doneBy: 'Adithya M.',
      status: shouldAnimate ? 'Processing' : requestedStatus,
      count,
      type,
      details,
      premiumSummary,
      changeSummary,
      isNew: true,
      ...(typeof successCountOpt === 'number' ? { successCount: successCountOpt } : {}),
      ...(typeof failedCountOpt === 'number' ? { failedCount: failedCountOpt } : {}),
      ...(actorType ? { actorType } : {}),
      ...(automationSource ? { automationSource } : {}),
      ...(actionCategory ? { actionCategory } : {}),
    }

    setHistory((prev) => [entry, ...prev])

    if (shouldAnimate) {
      const delay = PROCESSING_MS_MIN + Math.random() * (PROCESSING_MS_MAX - PROCESSING_MS_MIN)
      window.setTimeout(() => {
        setHistory((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: requestedStatus, isNew: false } : e)),
        )
      }, delay)
    }

    return entry
  }

  const updateEntry = (id, updates) => {
    setHistory((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  return <Ctx.Provider value={{ history, addEntry, updateEntry }}>{children}</Ctx.Provider>
}

export function useEndorsements() {
  return useContext(Ctx)
}
