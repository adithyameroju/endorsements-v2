const STORAGE_KEY = 'v2-designs-endorsements-experience'

export const ENDORSEMENT_EXPERIENCE_V1 = 'v1'
export const ENDORSEMENT_EXPERIENCE_V2 = 'v2'

/** @returns {'v1' | 'v2'} */
export function readEndorsementExperienceVersion() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === ENDORSEMENT_EXPERIENCE_V1) return ENDORSEMENT_EXPERIENCE_V1
    if (stored === ENDORSEMENT_EXPERIENCE_V2) return ENDORSEMENT_EXPERIENCE_V2
  } catch {
    /* ignore */
  }
  return ENDORSEMENT_EXPERIENCE_V2
}

/** @param {'v1' | 'v2'} version */
export function writeEndorsementExperienceVersion(version) {
  try {
    localStorage.setItem(STORAGE_KEY, version)
  } catch {
    /* ignore */
  }
}
