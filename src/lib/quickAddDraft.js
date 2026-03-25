export const QUICK_ADD_DRAFT_KEY = 'quickAdd_draft_v1'

/**
 * @typedef {object} QuickAddDraftPayload
 * @property {object[]} employees
 * @property {number} [savedAt]
 * @property {number|string} [expandedId]
 * @property {number} [activeTab]
 * @property {'variation1'|'variation2'} [uiVariation]
 * @property {'sidebar'|'bottom'} [cdPlacement]
 */

/**
 * Persist Quick Add state to localStorage (best-effort).
 * @param {QuickAddDraftPayload} payload
 * @returns {boolean}
 */
export function saveQuickAddDraft(payload) {
  const { employees, expandedId, activeTab, uiVariation, cdPlacement } = payload
  try {
    localStorage.setItem(
      QUICK_ADD_DRAFT_KEY,
      JSON.stringify({
        employees,
        savedAt: Date.now(),
        expandedId,
        activeTab,
        uiVariation,
        cdPlacement,
      }),
    )
    return true
  } catch {
    return false
  }
}

/**
 * @returns {QuickAddDraftPayload | null}
 */
export function loadQuickAddDraft() {
  try {
    const raw = localStorage.getItem(QUICK_ADD_DRAFT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.employees)) return null
    return {
      employees: data.employees,
      savedAt: data.savedAt ?? 0,
      expandedId: data.expandedId,
      activeTab: data.activeTab,
      uiVariation: data.uiVariation,
      cdPlacement: data.cdPlacement,
    }
  } catch {
    return null
  }
}

export function clearQuickAddDraft() {
  try {
    localStorage.removeItem(QUICK_ADD_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function hasQuickAddDraft() {
  return loadQuickAddDraft() != null
}

/** Human-readable timestamp for draft UI (locale-aware). */
export function formatDraftSavedLabel(savedAt) {
  if (!savedAt) return ''
  try {
    return new Date(savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}
