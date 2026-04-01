import { User, Heart, Users } from 'lucide-react'
import { getPlanSummaryParts, dependentPlanSummaryLine } from '../lib/planHelpers'

function PF({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function getRelationIcon(relation) {
  const r = (relation || '').toLowerCase()
  if (r === 'spouse') return <Heart size={14} className="text-pink-500" />
  if (['father', 'mother'].includes(r)) return <User size={14} className="text-amber-600" />
  if (['son', 'daughter'].includes(r)) return <User size={14} className="text-blue-500" />
  if (['brother', 'sister'].includes(r)) return <Users size={14} className="text-violet-500" />
  if (r.includes('in-law')) return <User size={14} className="text-teal-500" />
  return <User size={14} className="text-gray-500" />
}

/** Same review cards as Quick Add “Preview & Submit”. */
export default function ReviewEmployeesPanel({ employees }) {
  return (
    <>
      {employees.map((emp, idx) => {
        const planParts = getPlanSummaryParts(emp.plans || {})
        return (
          <div
            key={emp.id ?? idx}
            className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.03] overflow-hidden"
          >
            <div className="flex items-start gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-600/[0.12] via-slate-100 to-violet-600/[0.1] border-b border-indigo-200/50">
              <div className="w-9 h-9 rounded-lg bg-white/90 shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <User size={17} className="text-indigo-700" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                  {emp.name || `Employee ${idx + 1}`}
                </h3>
                <p className="text-[11px] text-indigo-900/70 font-medium truncate mt-0.5">{emp.empId || emp.id}</p>
              </div>
            </div>
            <div className="px-3.5 py-3 sm:px-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                <PF label="Email" value={emp.email} />
                <PF label="DOB" value={emp.dob} />
                <PF label="Gender" value={emp.gender} />
                <PF label="Joining" value={emp.doj} />
                <PF label="Mobile" value={emp.mobile} />
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Plans</p>
                {planParts.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {planParts.map((p) => (
                      <span
                        key={`${p.key}-${p.text}`}
                        className="inline-flex items-baseline gap-0.5 rounded-md border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-800"
                      >
                        <span className="font-semibold text-slate-500">{p.key}</span>
                        <span className="truncate max-w-[10rem]">{p.text}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400">—</span>
                )}
              </div>
              {(emp.dependents?.length ?? 0) > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                    Dependents ({emp.dependents.length})
                  </p>
                  <ul className="space-y-1">
                    {(emp.dependents || []).map((dep, di) => (
                      <li
                        key={dep.id ?? di}
                        className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug"
                      >
                        <span className="flex-shrink-0 mt-0.5 text-indigo-500">
                          {getRelationIcon(dep.relation)}
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium text-gray-900">{dep.name || '—'}</span>
                          <span className="text-gray-400"> · </span>
                          <span className="text-gray-600">{dep.relation || '—'}</span>
                          <span className="block text-[10px] text-gray-500 mt-0.5">
                            {dependentPlanSummaryLine(dep, emp.plans)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
