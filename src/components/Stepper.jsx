import { Check } from 'lucide-react'

export default function Stepper({ steps, currentStep }) {
  return (
    <nav className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        const isLast = i === steps.length - 1

        return (
          <div key={i} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                  isCompleted
                    ? 'bg-indigo-600 text-white'
                    : isActive
                      ? 'bg-indigo-600 text-white ring-[3px] ring-indigo-100'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap hidden sm:inline ${
                  isActive ? 'text-indigo-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-8 lg:w-12 h-0.5 rounded-full mx-1 ${
                  isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
