import {
  ENDORSEMENT_EXPERIENCE_V1,
  ENDORSEMENT_EXPERIENCE_V2,
} from '../lib/endorsementExperienceVersion'

const SELECT_CLASS =
  'min-h-[2.25rem] cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

/**
 * @param {{ value: string, onChange: (value: string) => void, id?: string }} props
 */
export default function EndorsementsExperienceSelect({
  value,
  onChange,
  id = 'endorsements-experience-version',
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        Experience
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label="Endorsements experience version"
      >
        <option value={ENDORSEMENT_EXPERIENCE_V1}>V1</option>
        <option value={ENDORSEMENT_EXPERIENCE_V2}>Update 2.0</option>
      </select>
    </div>
  )
}
