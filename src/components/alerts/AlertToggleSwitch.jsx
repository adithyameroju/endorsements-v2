export default function AlertToggleSwitch({ checked, onChange, label, size = 'md' }) {
  const isSm = size === 'sm'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-1 ${
        isSm ? 'h-5 w-9' : 'h-6 w-11'
      } ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition-transform ${
          isSm
            ? `h-4 w-4 ${checked ? 'translate-x-4' : 'translate-x-0'}`
            : `h-5 w-5 ${checked ? 'translate-x-5' : 'translate-x-0'}`
        }`}
      />
    </button>
  )
}
