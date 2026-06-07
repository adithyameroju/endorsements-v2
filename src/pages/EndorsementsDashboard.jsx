import { useEffect, useState } from 'react'
import EndorsementsDashboardV1 from './EndorsementsDashboardV1'
import EndorsementsDashboardV2 from './EndorsementsDashboardV2'
import {
  ENDORSEMENT_EXPERIENCE_V2,
  readEndorsementExperienceVersion,
  writeEndorsementExperienceVersion,
} from '../lib/endorsementExperienceVersion'

export default function EndorsementsDashboard() {
  const [experience, setExperience] = useState(() => readEndorsementExperienceVersion())

  useEffect(() => {
    writeEndorsementExperienceVersion(experience)
  }, [experience])

  const experienceProps = {
    experience,
    onExperienceChange: setExperience,
  }

  return experience === ENDORSEMENT_EXPERIENCE_V2 ? (
    <EndorsementsDashboardV2 {...experienceProps} />
  ) : (
    <EndorsementsDashboardV1 {...experienceProps} />
  )
}
