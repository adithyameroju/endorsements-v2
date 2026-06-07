const endorsementHistorySeed = [
  {
    id: 1,
    date: '2026-03-10',
    action: 'Add Employee',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 3,
    type: 'quick',
    changeSummary: {
      title: 'Employees added to policy',
      lines: ['Rohit Mehra (EMP021)', 'Tanya Bose (EMP022)', 'Nikhil Jain (EMP023)'],
    },
    premiumSummary: {
      totalInclGst: 184240,
      gstRatePercent: 18,
      lines: [
        { label: 'GMC base premium', amount: 112000 },
        { label: 'GPA premium', amount: 42000 },
        { label: 'GST', amount: 30240 },
      ],
    },
    details: [
      { name: 'Rohit Mehra', id: 'EMP021' },
      { name: 'Tanya Bose', id: 'EMP022' },
      { name: 'Nikhil Jain', id: 'EMP023' },
    ],
  },
  {
    id: 24,
    date: '2026-03-11',
    action: 'Bulk Upload - Add',
    activityDetail: '18 added · 3 validation failures',
    doneBy: 'Priya S.',
    status: 'Failed',
    count: 21,
    type: 'bulk',
    successCount: 18,
    failedCount: 3,
  },
  {
    id: 25,
    date: '2026-03-10',
    action: 'HRMS Sync',
    activityDetail: '12 synced · 4 rejected by rules',
    doneBy: 'System',
    status: 'Failed',
    count: 16,
    type: 'sync',
    successCount: 12,
    failedCount: 4,
  },
  {
    id: 26,
    date: '2026-03-10',
    action: 'Bulk Upload - Update',
    activityDetail: '7 updated · 1 failed duplicate ID',
    doneBy: 'Rahul K.',
    status: 'Failed',
    count: 8,
    type: 'bulk',
    successCount: 7,
    failedCount: 1,
  },
  { id: 2, date: '2026-03-09', action: 'Bulk Upload - Add', doneBy: 'Priya S.', status: 'Failed', count: 12, type: 'bulk', successCount: 0, failedCount: 12 },
  { id: 21, date: '2026-03-10', action: 'Add Employees - Batch', doneBy: 'Adithya M.', status: 'Failed', count: 2, type: 'quick', details: [
    { name: 'Ravi Shankar', id: 'EMP030', email: 'ravi.s@acko.com', dob: '', mobile: '9876500020', gender: 'Male', doj: '2026-03-12', gmcBase: '', gpaBase: '' },
    { name: '', id: 'EMP031', email: '', dob: '1994-09-14', mobile: '9876500021', gender: 'Female', doj: '2026-03-12', gmcBase: '', gpaBase: '' },
  ]},
  { id: 22, date: '2026-03-09', action: 'Add Employees - Batch', doneBy: 'Priya S.', status: 'Failed', count: 3, type: 'quick', details: [
    { name: 'Neha Kapoor', id: 'EMP032', email: 'neha.k@acko.com', dob: '1990-03-22', mobile: '98765abc', gender: 'Female', doj: '2026-03-18', gmcBase: '', gpaBase: '' },
    { name: 'Tarun Mehta', id: '', email: 'tarun.m@acko.com', dob: '1987-12-01', mobile: '9876500023', gender: 'Male', doj: '', gmcBase: '', gpaBase: '' },
    { name: 'Anita Verma', id: 'EMP034', email: '', dob: '', mobile: '9876500024', gender: 'Female', doj: '2026-03-20', gmcBase: '', gpaBase: '' },
  ]},
  { id: 16, date: '2026-03-09', action: 'Add Employee - Deepak Mishra', doneBy: 'Adithya M.', status: 'Failed', count: 1, type: 'quick', details: [{ name: 'Deepak Mishra', id: 'EMP024', email: '', dob: '1992-04-10', mobile: '9876500011', gender: 'Male', doj: '2026-03-15', gmcBase: '', gpaBase: '' }] },
  { id: 17, date: '2026-03-08', action: 'Add Employee - Kavya Nair', doneBy: 'Priya S.', status: 'Failed', count: 1, type: 'quick', details: [{ name: 'Kavya Nair', id: 'EMP025', email: 'kavya.n@acko.com', dob: '', mobile: '9876500012', gender: 'Female', doj: '2026-03-20', gmcBase: '', gpaBase: '' }] },
  { id: 3, date: '2026-03-08', action: 'Delete Employee', doneBy: 'Adithya M.', status: 'Success', count: 1, type: 'quick' },
  { id: 18, date: '2026-03-07', action: 'Add Employee - Amit Sinha', doneBy: 'Rahul K.', status: 'Failed', count: 1, type: 'quick', details: [{ name: 'Amit Sinha', id: '', email: 'amit.s@acko.com', dob: '1988-11-05', mobile: '98765abc', gender: 'Male', doj: '2026-03-10', gmcBase: '', gpaBase: '' }] },
  { id: 4, date: '2026-03-07', action: 'Update Employee', activityDetail: 'Coverage tier & dependents updated', doneBy: 'Rahul K.', status: 'Success', count: 5, type: 'quick' },
  { id: 5, date: '2026-03-06', action: 'HRMS Sync', doneBy: 'System', status: 'Success', count: 8, type: 'sync' },
  { id: 19, date: '2026-03-06', action: 'Add Employee - Pooja Rao', doneBy: 'Adithya M.', status: 'Failed', count: 1, type: 'quick', details: [{ name: 'Pooja Rao', id: 'EMP027', email: 'pooja.r@acko.com', dob: '1996-02-18', mobile: '9876500014', gender: 'Female', doj: '', gmcBase: '', gpaBase: '' }] },
  { id: 6, date: '2026-03-05', action: 'Bulk Upload - Delete', doneBy: 'Priya S.', status: 'Success', count: 4, type: 'bulk' },
  { id: 7, date: '2026-03-04', action: 'Add Employee', doneBy: 'Adithya M.', status: 'Success', count: 2, type: 'quick' },
  { id: 20, date: '2026-03-04', action: 'Add Employee - Siddharth Pillai', doneBy: 'Priya S.', status: 'Failed', count: 1, type: 'quick', details: [{ name: '', id: 'EMP028', email: 'sid.p@acko.com', dob: '1991-07-22', mobile: '9876500015', gender: 'Male', doj: '2026-03-01', gmcBase: '', gpaBase: '' }] },
  { id: 8, date: '2026-03-03', action: 'HRMS Sync', doneBy: 'System', status: 'Failed', count: 15, type: 'sync' },
  { id: 9, date: '2026-03-02', action: 'Bulk Upload - Update', activityDetail: 'Bulk corrections — spouse & child additions', doneBy: 'Rahul K.', status: 'Success', count: 20, type: 'bulk' },
  { id: 10, date: '2026-03-01', action: 'Add Employee', doneBy: 'Priya S.', status: 'Success', count: 1, type: 'quick' },
  { id: 11, date: '2026-02-28', action: 'Delete Employee', doneBy: 'Adithya M.', status: 'Success', count: 2, type: 'quick' },
  { id: 12, date: '2026-02-27', action: 'Update Employee', activityDetail: 'Employee records & GPA SI revised', doneBy: 'Rahul K.', status: 'Success', count: 7, type: 'quick' },
  { id: 13, date: '2026-02-26', action: 'HRMS Sync', doneBy: 'System', status: 'Success', count: 10, type: 'sync' },
  {
    id: 14,
    date: '2026-02-25',
    action: 'Bulk Upload - Add',
    doneBy: 'Priya S.',
    status: 'Failed',
    count: 25,
    type: 'bulk',
    successCount: 23,
    failedCount: 2,
  },
  { id: 15, date: '2026-02-24', action: 'Add Employee', doneBy: 'Adithya M.', status: 'Success', count: 4, type: 'quick' },
  {
    id: 23,
    date: '2026-03-11',
    action: 'Add dependent · Employee app request',
    doneBy: 'System',
    status: 'Success',
    count: 1,
    type: 'enrollment',
    actorType: 'system',
    automationSource: 'app_enrolment',
    actionCategory: 'Addition',
  },
  {
    id: 901,
    date: '2026-03-12',
    action: 'Add Employee · Pending schedule A',
    activityDetail: '2 employees added',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 2,
    type: 'quick',
    actionCategory: 'Addition',
    premiumSummary: { totalInclGst: 56200, gstRatePercent: 18, lines: [{ label: 'GMC', amount: 47627 }, { label: 'GST', amount: 8573 }] },
  },
  {
    id: 902,
    date: '2026-03-12',
    action: 'Bulk Upload - Update · Pending schedule B',
    activityDetail: '6 records · SI revision',
    doneBy: 'Priya S.',
    status: 'Success',
    count: 6,
    type: 'bulk',
    actionCategory: 'Modification',
  },
  {
    id: 903,
    date: '2026-03-12',
    action: 'HRMS Sync · Pending schedule C',
    activityDetail: '14 lives synced',
    doneBy: 'System',
    status: 'Success',
    count: 14,
    type: 'sync',
    actionCategory: 'Addition',
  },
  {
    id: 904,
    date: '2026-03-13',
    action: 'Add Employee · Pending schedule D',
    activityDetail: '1 employee added',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 1,
    type: 'quick',
    actionCategory: 'Addition',
    premiumSummary: {
      totalInclGst: 42000,
      gstRatePercent: 18,
      lines: [{ label: 'GMC', amount: 35593 }, { label: 'GST', amount: 6407 }],
    },
  },
  {
    id: 905,
    date: '2026-03-13',
    action: 'Update Employee · Pending schedule E',
    activityDetail: '3 dependents added',
    doneBy: 'Rahul K.',
    status: 'Success',
    count: 3,
    type: 'quick',
    actionCategory: 'Modification',
  },
]

/** Five most recently generated schedules — appear first when sorted by generated date. */
const demoLatestGeneratedSchedules = [
  {
    id: 906,
    date: '2026-05-29',
    action: 'Add Employee · Latest generated schedule',
    activityDetail: '2 employees added',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 2,
    type: 'quick',
    actionCategory: 'Addition',
    scheduleRef: 'SCH-20260529-906',
    scheduleGeneratedAt: '2026-05-29T16:45:00.000Z',
    schedulePdfStatus: 'ready',
    recordedAt: '2026-05-29T16:40:00.000Z',
    premiumSummary: { totalInclGst: 68400, gstRatePercent: 18, lines: [{ label: 'GMC', amount: 57966 }, { label: 'GST', amount: 10434 }] },
  },
  {
    id: 907,
    date: '2026-05-28',
    action: 'Bulk Upload - Add · Latest generated',
    activityDetail: '8 employees · bulk add',
    doneBy: 'Priya S.',
    status: 'Success',
    count: 8,
    type: 'bulk',
    actionCategory: 'Addition',
    scheduleRef: 'SCH-20260528-907',
    scheduleGeneratedAt: '2026-05-28T15:20:00.000Z',
    schedulePdfStatus: 'ready',
    recordedAt: '2026-05-28T15:10:00.000Z',
    premiumSummary: { totalInclGst: 248600, gstRatePercent: 18, lines: [{ label: 'GMC bulk', amount: 210678 }, { label: 'GST', amount: 37922 }] },
  },
  {
    id: 908,
    date: '2026-05-27',
    action: 'Update Employee · Latest generated',
    activityDetail: '4 records · SI upgrade',
    doneBy: 'Rahul K.',
    status: 'Success',
    count: 4,
    type: 'quick',
    actionCategory: 'Modification',
    scheduleRef: 'SCH-20260527-908',
    scheduleGeneratedAt: '2026-05-27T14:05:00.000Z',
    schedulePdfStatus: 'ready',
    recordedAt: '2026-05-27T14:00:00.000Z',
    premiumSummary: { totalInclGst: 92100, gstRatePercent: 18, lines: [{ label: 'Premium delta', amount: 78051 }, { label: 'GST', amount: 14049 }] },
  },
  {
    id: 909,
    date: '2026-05-26',
    action: 'HRMS Sync · Latest generated',
    activityDetail: '12 lives · HRMS sync',
    doneBy: 'System',
    status: 'Success',
    count: 12,
    type: 'sync',
    actionCategory: 'Addition',
    scheduleRef: 'SCH-20260526-909',
    scheduleGeneratedAt: '2026-05-26T11:30:00.000Z',
    schedulePdfStatus: 'ready',
    recordedAt: '2026-05-26T11:25:00.000Z',
    premiumSummary: { totalInclGst: 412800, gstRatePercent: 18, lines: [{ label: 'GMC sync', amount: 349831 }, { label: 'GST', amount: 62969 }] },
  },
  {
    id: 910,
    date: '2026-05-25',
    action: 'Delete Employee · Latest generated',
    activityDetail: '1 employee removed',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 1,
    type: 'quick',
    actionCategory: 'Deletion',
    scheduleRef: 'SCH-20260525-910',
    scheduleGeneratedAt: '2026-05-25T09:15:00.000Z',
    schedulePdfStatus: 'ready',
    recordedAt: '2026-05-25T09:10:00.000Z',
    premiumSummary: { totalInclGst: 18600, gstRatePercent: 18, lines: [{ label: 'Refund premium', amount: 15763 }, { label: 'GST', amount: 2837 }] },
  },
]

/** Five latest pending schedules — Generate CTA at top of page 1 (stable sort by recordedAt). */
const demoLatestPendingSchedules = [
  {
    id: 911,
    date: '2026-05-30',
    action: 'Add Employee · Ready to generate',
    activityDetail: '1 employee added',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 1,
    type: 'quick',
    actionCategory: 'Addition',
    recordedAt: '2026-05-30T17:00:00.000Z',
    premiumSummary: { totalInclGst: 35200, gstRatePercent: 18, lines: [{ label: 'GMC', amount: 29831 }, { label: 'GST', amount: 5369 }] },
  },
  {
    id: 912,
    date: '2026-05-30',
    action: 'Update Employee · Ready to generate',
    activityDetail: '2 records · SI upgrade',
    doneBy: 'Priya S.',
    status: 'Success',
    count: 2,
    type: 'quick',
    actionCategory: 'Modification',
    recordedAt: '2026-05-30T16:30:00.000Z',
    premiumSummary: { totalInclGst: 51800, gstRatePercent: 18, lines: [{ label: 'Premium delta', amount: 43898 }, { label: 'GST', amount: 7902 }] },
  },
  {
    id: 913,
    date: '2026-05-29',
    action: 'Bulk Upload - Add · Ready to generate',
    activityDetail: '5 employees · bulk add',
    doneBy: 'Rahul K.',
    status: 'Success',
    count: 5,
    type: 'bulk',
    actionCategory: 'Addition',
    recordedAt: '2026-05-29T18:15:00.000Z',
    premiumSummary: { totalInclGst: 165400, gstRatePercent: 18, lines: [{ label: 'GMC bulk', amount: 140169 }, { label: 'GST', amount: 25231 }] },
  },
  {
    id: 914,
    date: '2026-05-29',
    action: 'HRMS Sync · Ready to generate',
    activityDetail: '9 lives · HRMS sync',
    doneBy: 'System',
    status: 'Success',
    count: 9,
    type: 'sync',
    actionCategory: 'Addition',
    recordedAt: '2026-05-29T17:45:00.000Z',
    premiumSummary: { totalInclGst: 289600, gstRatePercent: 18, lines: [{ label: 'GMC sync', amount: 245424 }, { label: 'GST', amount: 44176 }] },
  },
  {
    id: 915,
    date: '2026-05-29',
    action: 'Delete Employee · Ready to generate',
    activityDetail: '1 employee removed',
    doneBy: 'Adithya M.',
    status: 'Success',
    count: 1,
    type: 'quick',
    actionCategory: 'Deletion',
    recordedAt: '2026-05-29T17:10:00.000Z',
    premiumSummary: { totalInclGst: 22400, gstRatePercent: 18, lines: [{ label: 'Refund premium', amount: 18983 }, { label: 'GST', amount: 3417 }] },
  },
]

const DEMO_SCHEDULE_PAGINATION_ACTIONS = [
  'Add Employee',
  'Update Employee',
  'Bulk Upload - Add',
  'Bulk Upload - Update',
  'HRMS Sync',
  'Delete Employee',
]

const DEMO_SCHEDULE_PAGINATION_DONE_BY = ['Adithya M.', 'Priya S.', 'Rahul K.', 'System']

/** Extra Success rows so the V3 schedules tab shows ~5 pages at 10 rows/page. */
const demoSchedulePaginationRows = Array.from({ length: 27 }, (_, index) => {
  const id = 920 + index
  const month = 2 + Math.floor(index / 9)
  const day = 1 + (index % 28)
  const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const type = index % 3 === 0 ? 'bulk' : index % 3 === 1 ? 'sync' : 'quick'
  const count = 1 + (index % 9)
  const actionLabel = DEMO_SCHEDULE_PAGINATION_ACTIONS[index % DEMO_SCHEDULE_PAGINATION_ACTIONS.length]
  const activityHint =
    type === 'bulk'
      ? `${count} records · bulk`
      : type === 'sync'
        ? `${count} lives synced`
        : `${count} employee${count === 1 ? '' : 's'}`
  return {
    id,
    date,
    action: `${actionLabel} · Schedule batch ${id}`,
    activityDetail: activityHint,
    doneBy: DEMO_SCHEDULE_PAGINATION_DONE_BY[index % DEMO_SCHEDULE_PAGINATION_DONE_BY.length],
    status: 'Success',
    count,
    type,
    actionCategory: index % 4 === 3 ? 'Deletion' : index % 2 === 0 ? 'Addition' : 'Modification',
    premiumSummary: {
      totalInclGst: 15000 + count * 8200,
      gstRatePercent: 18,
      lines: [{ label: 'Premium', amount: 15000 + count * 6949 }, { label: 'GST', amount: Math.round((15000 + count * 8200) * 0.18 / 1.18) }],
    },
  }
})

const endorsementHistoryFullSeed = [
  ...endorsementHistorySeed,
  ...demoLatestGeneratedSchedules,
  ...demoLatestPendingSchedules,
  ...demoSchedulePaginationRows,
]

/** Demo timestamps (ISO); new entries from addEntry set recordedAt explicitly */
/** Demo: endorsements without an insurer schedule yet (mixed Success rows for the schedules UI). */
const DEMO_NOSCHEDULE_IDS = new Set([3, 7, 11, 14, 15, 24, 25, 26, 901, 902, 903, 904, 905, 911, 912, 913, 914, 915, 928, 935, 942])

function seedCanSchedule(row) {
  if (typeof row.successCount === 'number') return row.successCount > 0
  return row.status === 'Success'
}

const DEMO_MASTER_POLICY_NUMBERS = [
  'ACK-GHI-2024-9912',
  'ACK-GHI-2023-7741',
  'ACK-GPA-2024-5520',
]

export const endorsementHistory = endorsementHistoryFullSeed.map((row) => {
  const idNum = Number(row.id) || 0
  const h = 9 + (idNum % 8)
  const m = (idNum * 7) % 60
  const canSchedule = seedCanSchedule(row)
  const missingSchedule = canSchedule && DEMO_NOSCHEDULE_IDS.has(row.id)
  const scheduleRef =
    row.scheduleRef ??
    (!missingSchedule && canSchedule ? `SCH-${String(row.date).replace(/-/g, '')}-${row.id}` : null)
  const scheduleGeneratedAt =
    row.scheduleGeneratedAt ??
    (scheduleRef ? new Date(`${row.date}T10:00:00`).toISOString() : null)
  const endorsementNo =
    row.endorsementNo ?? (scheduleRef ? `GPA${789123100 + idNum}` : undefined)
  return {
    ...row,
    scheduleRef,
    scheduleGeneratedAt,
    masterPolicyNumber: row.masterPolicyNumber ?? DEMO_MASTER_POLICY_NUMBERS[idNum % DEMO_MASTER_POLICY_NUMBERS.length],
    ...(endorsementNo ? { endorsementNo } : {}),
    recordedAt:
      row.recordedAt ??
      new Date(`${row.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString(),
  }
})

export const basePlans = [
  { id: 'bp1', name: 'Base Plan - 3L', sumInsured: 300000 },
  { id: 'bp2', name: 'Base Plan - 5L', sumInsured: 500000 },
  { id: 'bp3', name: 'Base Plan - 10L', sumInsured: 1000000 },
]

export const secondaryPlans = [
  { id: 'sp1', name: 'Secondary Plan - 2L', sumInsured: 200000 },
  { id: 'sp2', name: 'Secondary Plan - 3L', sumInsured: 300000 },
]

export const addonPlans = [
  { id: 'ap1', name: 'Dental & Vision Cover' },
  { id: 'ap2', name: 'Maternity Cover' },
  { id: 'ap3', name: 'OPD Cover' },
]

export const topupPlans = [
  { id: 'tp1', name: 'Top-Up - 5L', sumInsured: 500000 },
  { id: 'tp2', name: 'Top-Up - 10L', sumInsured: 1000000 },
  { id: 'tp3', name: 'Top-Up - 25L', sumInsured: 2500000 },
]

export const gpaBasePlans = [
  { id: 'gpa-bp1', name: 'GPA Base - 5L', sumInsured: 500000 },
  { id: 'gpa-bp2', name: 'GPA Base - 10L', sumInsured: 1000000 },
  { id: 'gpa-bp3', name: 'GPA Base - 20L', sumInsured: 2000000 },
]

export const dependentRelations = [
  'Spouse', 'Father', 'Mother', 'Father-in-law', 'Mother-in-law',
  'Son', 'Daughter', 'Brother', 'Sister'
]

/** Grouped for chip UI: Spouse, Children, Parents, In-laws, Siblings */
export const dependentRelationGroups = [
  { label: 'Spouse', relations: ['Spouse'] },
  { label: 'Children', relations: ['Son', 'Daughter'] },
  { label: 'Parents', relations: ['Father', 'Mother'] },
  { label: 'In-laws', relations: ['Father-in-law', 'Mother-in-law'] },
  { label: 'Siblings', relations: ['Brother', 'Sister'] },
]

export const mockEmployees = [
  { id: 'EMP001', name: 'Rahul Sharma', email: 'rahul.sharma@acme.com', dob: '1992-05-15', gender: 'Male', doj: '2023-01-10', mobile: '9876543210', plans: { gmcBasePlan: 'bp1', gmcSecondaryPlan: 'sp1' } },
  { id: 'EMP002', name: 'Priya Nair', email: 'priya.nair@acme.com', dob: '1990-08-22', gender: 'Female', doj: '2022-06-15', mobile: '9876543211', plans: { gmcBasePlan: 'bp2', gmcSecondaryPlan: 'sp1' } },
  { id: 'EMP003', name: 'Arjun Patel', email: 'arjun.patel@acme.com', dob: '1995-01-30', gender: 'Male', doj: '2024-03-01', mobile: '9876543212', plans: { gmcBasePlan: 'bp1', gmcSecondaryPlan: 'none' } },
  { id: 'EMP004', name: 'Sneha Reddy', email: 'sneha.reddy@acme.com', dob: '1988-11-12', gender: 'Female', doj: '2021-09-20', mobile: '9876543213', plans: { gmcBasePlan: 'bp2', gmcSecondaryPlan: 'sp2' } },
  { id: 'EMP005', name: 'Vikram Joshi', email: 'vikram.joshi@acme.com', dob: '1993-07-08', gender: 'Male', doj: '2023-11-01', mobile: '9876543214', plans: { gmcBasePlan: 'bp1' } },
]

export const hrmsJoiningEmployees = [
  { id: 'HRMS-J1', name: 'Ananya Gupta', email: 'ananya.g@acme.com', doj: '2026-03-15', gender: 'Female', mobile: '9111222333' },
  { id: 'HRMS-J2', name: 'Karthik Menon', email: 'karthik.m@acme.com', doj: '2026-03-15', gender: 'Male', mobile: '9111222334' },
  { id: 'HRMS-J3', name: 'Divya Iyer', email: 'divya.i@acme.com', doj: '2026-03-20', gender: 'Female', mobile: '9111222335' },
]

export const hrmsLeavingEmployees = [
  {
    id: 'HRMS-L1', name: 'Suresh Kumar', email: 'suresh.k@acme.com',
    lastDate: '2026-03-31', gender: 'Male', mobile: '9222333444',
    hasParentStandalonePolicy: true,
    dependents: [
      { name: 'Lakshmi Kumar', relation: 'Spouse', dob: '1989-03-15' },
      { name: 'Ramesh Kumar', relation: 'Father', dob: '1960-07-20', hasStandalonePolicy: true },
      { name: 'Sarita Kumar', relation: 'Mother', dob: '1963-11-05', hasStandalonePolicy: true },
    ]
  },
  {
    id: 'HRMS-L2', name: 'Meera Chopra', email: 'meera.c@acme.com',
    lastDate: '2026-03-28', gender: 'Female', mobile: '9222333445',
    hasParentStandalonePolicy: false,
    dependents: [
      { name: 'Raj Chopra', relation: 'Spouse', dob: '1991-06-10' },
    ]
  },
]
