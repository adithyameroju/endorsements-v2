export default function AiEndorsementValidationTable({ rowValidation, employees, onUpdateEmployee }) {
  if (!rowValidation.length) return null

  const invalidCount = rowValidation.filter((r) => !r.valid).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {invalidCount === 0
          ? 'All rows passed validation. Continue to preview CD and premium impact.'
          : `${invalidCount} row(s) need fixes before you can submit. Edit inline or exclude rows with critical errors.`}
      </p>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Row</th>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rowValidation.map((row) => {
              const emp = employees.find((e) => e.rowIndex === row.rowIndex)
              return (
                <tr key={row.rowIndex} className={row.valid ? '' : 'bg-red-50/40'}>
                  <td className="px-4 py-3 tabular-nums text-gray-500">{row.rowIndex + 1}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={emp?.empId ?? ''}
                      onChange={(e) => onUpdateEmployee(row.rowIndex, { empId: e.target.value })}
                      className="w-full min-w-[6rem] rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={emp?.name ?? ''}
                      onChange={(e) => onUpdateEmployee(row.rowIndex, { name: e.target.value })}
                      className="w-full min-w-[8rem] rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="email"
                      value={emp?.email ?? ''}
                      onChange={(e) => onUpdateEmployee(row.rowIndex, { email: e.target.value })}
                      className="w-full min-w-[10rem] rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {row.valid ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Ready
                      </span>
                    ) : (
                      <span className="text-xs text-red-700 leading-snug">
                        {Object.values(row.errors).slice(0, 2).join('; ')}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
