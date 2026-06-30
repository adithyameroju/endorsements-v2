/**
 * ACKO Employer Portal — CD Balance (straightforward: balance, burn rate, history log).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Banknote,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Scale,
  Check,
  CheckCircle2,
  Clock,
  Pencil,
  Loader2,
  Eye,
  Mail,
  Plus,
  Receipt,
  IndianRupee,
  Layers,
  Trash2,
  LayoutGrid,
  UserPlus,
  UserMinus,
  RefreshCw,
  ArrowRight,
  FileText,
  Calendar,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { formatLastUpdated } from '../lib/formatLastUpdated'
import { useAlerts } from '../context/AlertsContext'
import { portalFilterChipClass, portalToggleChipClass } from '../lib/portalChipTokens'
import { useEntity } from '../context/EntityContext'
import { CD_BALANCE_AS_OF_ISO, CD_MONTHLY_BURN_RUPEES, CD_PREMIUM_SPLIT, CD_THRESHOLDS, cdRunwayDays, cdWalletUtilization } from '../data/cdWalletMock'
import {
  helpCardGridGap,
  helpCardPadding,
  helpCardSurface,
  helpCategoryLabel,
  helpEscalationIcon,
  helpEscalationShell,
  helpLink,
  helpLinkInline,
  helpPrimaryBtn,
  helpSecondaryBtn,
} from '../lib/helpUiTokens'
import { CD_PROFORMA_EMPLOYER } from '../data/cdProformaMock'
import {
  downloadProformaPdfBytes,
  generateCdProformaPdf,
  proformaDownloadFilename,
} from '../lib/generateCdProformaPdf'
import { KeyMetricDonut } from '../components/KeyMetricCard'
import {
  PORTAL_TABLE_SECTION_GUTTER,
  PORTAL_TABLE_THEAD_TR_CLASS,
  PORTAL_TABLE_HEAD_EDGE_PL,
  PORTAL_TABLE_HEAD_EDGE_PR,
  PORTAL_TABLE_CELL_INNER,
  PORTAL_TABLE_CELL_EDGE_PL,
  PORTAL_TABLE_CELL_EDGE_PR,
  PORTAL_TABLE_EDGE_PL,
  PORTAL_TABLE_EDGE_PR,
  PORTAL_TABLE_CLASS,
  PORTAL_TABLE_SCROLL_CLASS,
  PORTAL_TABLE_TH_CLASS,
} from '../lib/dataTableLayout'
import {
  ENDORSEMENT_SCHEDULE_VIEW_BTN,
  ENDORSEMENT_TABLE_ICON_BTN,
} from '../components/endorsements-v2/ScheduleDocumentModals'

// —— Types ——————————————————————————————————————————————————————————

type TxType = 'deduction' | 'deposit' | 'refund'
type TxStatus = 'settled' | 'pending_recon'

type TxCategory = 'endorsement' | 'deposit'

type TransactionLineSummary = {
  employeesAdded?: number
  employeesExited?: number
  familyMembersAdded?: number
  familyMembersExited?: number
  familyMembers?: number
}

type EndorsementLifeLine = {
  employeeName: string
  employeeId: string
  action: 'added' | 'exited'
  details: string
  premium: number
  balanceAfter: number
}

type DepositDetails = {
  bank: string
  accountMasked: string
  mode: 'NEFT' | 'RTGS' | 'IMPS'
}

type TransactionRow = {
  id: string
  at: string
  type: TxType
  description: string
  amount: number
  balanceAfter: number
  status: TxStatus
  referenceId: string | null
  settlementNote?: string
  transactionId: string
  category: TxCategory
  expandable: boolean
  typeLabel: string
  lineSummary?: TransactionLineSummary
  transactionDate?: string
  endorsementLines?: EndorsementLifeLine[]
  depositDetails?: DepositDetails
}

type AlertChannel = 'email' | 'dashboard'
type AlertStatus = 'active' | 'paused'
type AlertChipFilter = 'all' | 'active' | 'paused'

type CdAlertRule = {
  id: string
  title: string
  thresholdInr: number
  channels: AlertChannel[]
  status: AlertStatus
}

const ALERT_CHIP_OPTIONS: { id: AlertChipFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
]

const MOCK_EMPLOYEE_NAMES: { name: string; id: string }[] = [
  { name: 'Anita Mehta', id: 'EMP-1042' },
  { name: 'Rahul Shah', id: 'EMP-1088' },
  { name: 'Priya Nair', id: 'EMP-1120' },
  { name: 'Vikram Rao', id: 'EMP-1156' },
  { name: 'Sneha Gupta', id: 'EMP-1199' },
  { name: 'Arjun Patel', id: 'EMP-1234' },
  { name: 'Meera Iyer', id: 'EMP-1277' },
]

type PaginationToken = number | 'ellipsis'

/** Compact page list: 1 … 4 5 6 … 25 instead of every page when count is large. */
function buildCompactPagination(current: number, total: number): PaginationToken[] {
  if (total <= 0) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total, current])
  if (current > 1) pages.add(current - 1)
  if (current < total) pages.add(current + 1)
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
  }
  if (current >= total - 2) {
    pages.add(total - 1)
    pages.add(total - 2)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: PaginationToken[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis')
    result.push(sorted[i])
  }
  return result
}

const CD_PAGINATION_PAGE_BTN =
  'inline-flex h-8 min-w-[2rem] shrink-0 cursor-pointer items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm'

const CD_PAGINATION_NAV_BTN =
  'shrink-0 cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1'

type CdTablePaginationProps = {
  currentPage: number
  pageCount: number
  totalItems: number
  onPageChange: (page: number) => void
  summary: string
  className?: string
}

function CdTablePagination({
  currentPage,
  pageCount,
  totalItems,
  onPageChange,
  summary,
  className = '',
}: CdTablePaginationProps) {
  const items = buildCompactPagination(currentPage, pageCount)

  return (
    <div
      className={`flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-white py-3 sm:rounded-b-xl ${PORTAL_TABLE_SECTION_GUTTER} ${className}`}
    >
      <p className="text-xs font-normal text-gray-400">{summary}</p>
      <div
        className="flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto sm:gap-1 sm:[scrollbar-width:none]"
        role="navigation"
        aria-label="Table pagination"
      >
        <button
          type="button"
          disabled={currentPage <= 1 || totalItems === 0}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Previous page"
          className={CD_PAGINATION_NAV_BTN}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-8 min-w-[1.25rem] shrink-0 items-center justify-center px-0.5 text-xs text-gray-400"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={totalItems === 0}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
              className={`${CD_PAGINATION_PAGE_BTN} ${
                item === currentPage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={currentPage >= pageCount || totalItems === 0}
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          aria-label="Next page"
          className={CD_PAGINATION_NAV_BTN}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

type DisputeRecord = {
  id: string
  linkedRef: string
  createdAt: string
  status: string
  reason?: string
  notes?: string
  scope?: DisputeScope
}

type ActivitySubTab = 'transactions' | 'proforma' | 'disputes'

type DisputeScope = 'transaction' | 'period' | 'general' | 'selected_transactions'

type ProformaStatus = 'generated' | 'paid' | 'expired'

type ProformaInvoice = {
  id: string
  ref: string
  requestedAt: string
  amount: number
  status: ProformaStatus
  employerName: string
}

type RechargePhase = 'form' | 'generating' | 'ready'

const PROFORMA_PDF_STEPS = 22
const PROFORMA_PDF_STEP_MS = 85

const PROFORMA_QUICK_AMOUNTS = [200_000, 500_000, 1_000_000, 2_500_000] as const

const ALERT_THRESHOLD_QUICK_AMOUNTS = [5_00_000, 10_00_000, 25_00_000] as const

// —— Utils ——————————————————————————————————————————————————————————

function formatInr(amount: number, signed = false): string {
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(abs)
  if (!signed) return formatted
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted.replace('₹', '₹')}` // format already has ₹
  return formatted
}

function formatInrSigned(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      signDisplay: 'exceptZero',
    }).format(amount)
  } catch {
    const core = formatInr(Math.abs(amount), false)
    if (amount === 0) return core
    return amount < 0 ? `-${core}` : `+${core}`
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDateOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatLineSummary(summary: TransactionLineSummary): string {
  const parts: string[] = []
  if (summary.employeesAdded != null && summary.employeesAdded > 0) {
    parts.push(`${summary.employeesAdded} employee${summary.employeesAdded === 1 ? '' : 's'} added`)
  }
  if (summary.employeesExited != null && summary.employeesExited > 0) {
    parts.push(`${summary.employeesExited} employee${summary.employeesExited === 1 ? '' : 's'} exited`)
  }
  const familyTotal =
    (summary.familyMembersAdded ?? 0) + (summary.familyMembersExited ?? 0) + (summary.familyMembers ?? 0)
  if (familyTotal > 0) {
    parts.push(`${familyTotal} family member${familyTotal === 1 ? '' : 's'}`)
  }
  return parts.join(' · ')
}

function inferTypeLabel(desc: string, type: TxType): string {
  if (type === 'deposit') return 'Wallet deposit'
  if (desc.toLowerCase().includes('refund') || type === 'refund') return 'Premium refund'
  if (desc.toLowerCase().includes('adjustment')) return 'Premium adjustment'
  if (desc.toLowerCase().includes('settlement')) return 'Premium settlement'
  return 'Endorsement'
}

function depositTransactionId(i: number): string {
  return `UTR2025${String(1115000 + (i % 9000)).slice(0, 7)}`
}

function endorsementTransactionId(i: number, ref: string | null): string {
  if (ref?.startsWith('END-')) return ref.replace(/^END-(\d+)/, (_, y) => `END-${y}-${String(i % 10000).padStart(4, '0')}`)
  return `END-2025-${String(1000 + (i % 9000)).padStart(4, '0')}`
}

function mockLineSummary(i: number, type: TxType): TransactionLineSummary | undefined {
  if (type === 'deposit') return undefined
  const pattern = i % 4
  if (pattern === 0) {
    return { employeesAdded: 3 + (i % 5), familyMembersAdded: 2 + (i % 4), employeesExited: 0, familyMembersExited: 0 }
  }
  if (pattern === 1) {
    return { employeesExited: 1 + (i % 3), familyMembersExited: 1 + (i % 2), employeesAdded: 0, familyMembersAdded: 0 }
  }
  if (pattern === 2) {
    return {
      employeesAdded: 5 + (i % 4),
      familyMembersAdded: 7 + (i % 3),
      employeesExited: 0,
      familyMembersExited: 0,
    }
  }
  return {
    employeesAdded: 1,
    employeesExited: 2,
    familyMembersAdded: 3,
    familyMembersExited: 1,
  }
}

function mockDepositDetails(i: number): DepositDetails {
  const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India']
  const modes: DepositDetails['mode'][] = ['NEFT', 'RTGS', 'IMPS']
  return {
    bank: banks[i % banks.length],
    accountMasked: `****${String(4821 + (i % 900)).slice(-4)}`,
    mode: modes[i % modes.length],
  }
}

function mockEndorsementLines(i: number, netAmount: number, balanceAfter: number): EndorsementLifeLine[] {
  const opening = balanceAfter - netAmount
  const count = Math.min(7, 3 + (i % 5))
  let running = opening
  const lines: EndorsementLifeLine[] = []
  let allocated = 0

  for (let j = 0; j < count; j++) {
    const emp = MOCK_EMPLOYEE_NAMES[j % MOCK_EMPLOYEE_NAMES.length]
    const isAdded = (i + j) % 3 !== 1
    const isLast = j === count - 1
    const premium = isLast ? netAmount - allocated : Math.round(netAmount / count)
    allocated += premium
    running += premium
    const spouseFirst = MOCK_EMPLOYEE_NAMES[(j + 2) % MOCK_EMPLOYEE_NAMES.length].name.split(' ')[0]
    lines.push({
      employeeName: emp.name,
      employeeId: emp.id,
      action: isAdded ? 'added' : 'exited',
      details: isAdded
        ? `Spouse: ${spouseFirst} · ${1 + (j % 3)} children (Effective 01 Jun)`
        : 'Exit — pro-rata refund (Effective 01 Jun)',
      premium,
      balanceAfter: running,
    })
  }
  return lines
}

function formatAlertThreshold(inr: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr)
}

function formatAsOfDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type DateRangePreset = 'daily' | 'monthly' | 'quarterly'

function transactionInDateRange(iso: string, range: DateRangePreset): boolean {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return true
  const now = new Date()
  if (range === 'daily') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return t >= start
  }
  if (range === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    return t >= start
  }
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
  const start = new Date(now.getFullYear(), quarterStartMonth, 1)
  start.setHours(0, 0, 0, 0)
  return t >= start
}

const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  daily: 'Daily view',
  monthly: 'Monthly view',
  quarterly: 'Quarterly view',
}

const DISPUTE_REASON_LABELS: Record<string, string> = {
  amount_mismatch: 'Amount mismatch',
  duplicate: 'Duplicate posting',
  timing: 'Settlement timing',
  other: 'Other',
}

/** Overview metric typography — symmetric tiles */
const W_LABEL = helpCategoryLabel
const W_VALUE = 'text-2xl font-bold tabular-nums tracking-tight text-gray-900'
const W_SUB = 'text-xs leading-relaxed text-gray-500'
const W_BAR_H = 'h-1.5 w-full overflow-hidden rounded-full bg-gray-100'

// —— Mock data ———————————————————————————————————————————————————————

const MOCK_TOTAL_TX = 450

const MOCK_METRICS = {
  balance: 48_50_000,
  monthlyBurn: CD_MONTHLY_BURN_RUPEES,
  runwayMonthsLabel: '~4 months',
  pendingReconAmount: 36_000,
  pendingReconCount: 2,
  totalTransactions: MOCK_TOTAL_TX,
}

const LEDGER_TEMPLATES: { type: TxType; desc: string; ref: (i: number) => string | null }[] = [
  { type: 'deduction', desc: 'Premium settlement — monthly cycle', ref: (i) => `END-${2024 + (i % 4)}` },
  { type: 'deduction', desc: 'Endorsement — Quick Add (employees)', ref: (i) => `QA-${8800 + (i * 17) % 999}` },
  { type: 'deposit', desc: 'Wallet top-up — NEFT / RTGS', ref: () => null },
  { type: 'deduction', desc: 'Endorsement — Bulk upload (add / update)', ref: (i) => `BU-${4400 + i}` },
  { type: 'refund', desc: 'Employee exit refund (pro-rata)', ref: (i) => `RF-${8200 + i}` },
  { type: 'deduction', desc: 'GMC adjustment — dependent add', ref: (i) => `GMC-A${i}` },
  { type: 'deduction', desc: 'GPA premium debit — batch', ref: (i) => `GPA-${9100 + i}` },
  { type: 'deposit', desc: 'Interest credit — CD wallet (demo)', ref: () => 'INT-CRED' },
  { type: 'refund', desc: 'Member downgrade — premium difference', ref: (i) => `DN-${i}` },
  { type: 'deduction', desc: 'Life event — newborn cover (add)', ref: (i) => `LE-NB-${i}` },
  { type: 'deduction', desc: 'Mid-term correction — salary revision', ref: (i) => `MTC-${i}` },
  { type: 'deduction', desc: 'COI / TPA fee settlement', ref: (i) => `TPA-${i}` },
  { type: 'deduction', desc: 'Brokerage & charges — net off', ref: (i) => `BRK-${i}` },
  { type: 'refund', desc: 'Duplicate debit reversal', ref: (i) => `REV-${i}` },
  { type: 'deposit', desc: 'Treasury funding — corporate transfer', ref: () => 'TRF-IN' },
]

function buildTransactionDataset(): TransactionRow[] {
  const rows: TransactionRow[] = []
  const typesRot: TxType[] = ['deduction', 'deposit', 'deduction', 'refund']
  const statusesRot: TxStatus[] = ['settled', 'settled', 'settled', 'pending_recon']
  let running = 62_00_000

  for (let i = 0; i < MOCK_TOTAL_TX; i++) {
    const dayOff = Math.floor(i * 1.35)
    const at = new Date(2025, 8, 5)
    at.setHours(9 + (i % 8), 10 + (i % 40), 0, 0)
    at.setDate(at.getDate() + dayOff)

    const tmpl = LEDGER_TEMPLATES[i % LEDGER_TEMPLATES.length]
    const type = i < 12 ? tmpl.type : typesRot[i % typesRot.length]
    const isDep = type === 'deposit'
    const isRef = type === 'refund'
    const magnitude = 12_000 + (i % 17) * 8_100 + (i % 5) * 13_000
    const amount = isDep ? Math.min(28_00_000, 3_00_000 + magnitude) : isRef ? 8_000 + (i % 9) * 2_200 : -Math.min(14_00_000, 18_000 + magnitude)

    running += amount
    const status: TxStatus = i % 23 === 0 ? 'pending_recon' : statusesRot[i % statusesRot.length]

    const desc = i < 12 ? tmpl.desc : `${LEDGER_TEMPLATES[i % LEDGER_TEMPLATES.length].desc} (#${1000 + i})`
    const referenceId = i < 12 ? tmpl.ref(i) : `REF-${2024 + (i % 400)}-${(i % 90) + 10}`
    const category: TxCategory = type === 'deposit' ? 'deposit' : 'endorsement'
    const expandable = category === 'endorsement' || category === 'deposit'
    const transactionId =
      category === 'deposit' ? depositTransactionId(i) : endorsementTransactionId(i, referenceId)
    const effectiveDate = new Date(at)
    effectiveDate.setDate(effectiveDate.getDate() - (i % 5))
    const balanceAfter = Math.max(35_00_000, running - (i % 3) * 2_000)

    rows.push({
      id: `t-${i + 1}`,
      at: at.toISOString(),
      type,
      description: desc,
      amount,
      balanceAfter,
      status,
      referenceId,
      settlementNote: status === 'pending_recon' ? 'Awaiting confirmation (demo).' : undefined,
      transactionId,
      category,
      expandable,
      typeLabel: inferTypeLabel(desc, type),
      lineSummary: category === 'endorsement' ? mockLineSummary(i, type) : undefined,
      transactionDate: effectiveDate.toISOString(),
      endorsementLines:
        category === 'endorsement' ? mockEndorsementLines(i, amount, balanceAfter) : undefined,
      depositDetails: category === 'deposit' ? mockDepositDetails(i) : undefined,
    })
  }

  rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return rows
}

const ALL_TRANSACTIONS = buildTransactionDataset()

const INITIAL_MOCK_DISPUTES: DisputeRecord[] = [
  {
    id: 'DSP-901',
    linkedRef: 'QA-9921',
    createdAt: '2026-03-22',
    status: 'Under review',
    reason: 'amount_mismatch',
    scope: 'transaction',
    notes: 'Debit amount does not match endorsement schedule.',
  },
  {
    id: 'DSP-884',
    linkedRef: 'BU-4410',
    createdAt: '2026-03-11',
    status: 'Awaiting documents',
    reason: 'duplicate',
    scope: 'transaction',
  },
]

const INITIAL_PROFORMA_INVOICES: ProformaInvoice[] = [
  {
    id: 'pi-1',
    ref: 'ACKO/PI/2026/4855',
    requestedAt: '2026-03-18T10:00:00.000Z',
    amount: 5_00_000,
    status: 'generated',
    employerName: CD_PROFORMA_EMPLOYER.legalName,
  },
  {
    id: 'pi-2',
    ref: 'ACKO/PI/2026/4721',
    requestedAt: '2026-02-05T14:30:00.000Z',
    amount: 12_00_000,
    status: 'paid',
    employerName: CD_PROFORMA_EMPLOYER.legalName,
  },
  {
    id: 'pi-3',
    ref: 'ACKO/PI/2025/9912',
    requestedAt: '2025-11-20T09:00:00.000Z',
    amount: 8_00_000,
    status: 'expired',
    employerName: CD_PROFORMA_EMPLOYER.legalName,
  },
]

function proformaStatusLabel(status: ProformaStatus) {
  if (status === 'generated') return 'Generated'
  if (status === 'expired') return 'Expired'
  return 'Paid'
}

function proformaStatusClass(status: ProformaStatus) {
  if (status === 'generated') return 'bg-indigo-50 text-indigo-800'
  if (status === 'expired') return 'bg-gray-100 text-gray-600'
  return 'bg-emerald-50 text-emerald-800'
}

// —— Badges ——————————————————————————————————————————————————————————

/** Same visual language as `HistoryStatusMetadata` in EndorsementHistory (rounded-full, text-xs, tinted fill). */
function TypeBadge({ type }: { type: TxType }) {
  const map: Record<TxType, string> = {
    deduction: 'bg-rose-50 text-rose-800',
    deposit: 'bg-emerald-50 text-emerald-700',
    refund: 'bg-sky-50 text-sky-800',
  }
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[type]}`}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: TxStatus }) {
  const settled = status === 'settled'
  const base = 'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
  if (settled) {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">Settled</span>
      </span>
    )
  }
  return (
    <span className={`${base} bg-amber-50 text-amber-800`}>
      <Clock className="h-3 w-3 shrink-0 text-amber-700" aria-hidden />
      <span className="truncate">Pending recon</span>
    </span>
  )
}

function CdBalancePrimaryCard({ balance }: { balance: number }) {
  const { remainingPct, utilizedInr } = cdWalletUtilization(balance, ALL_TRANSACTIONS, CD_BALANCE_AS_OF_ISO)

  return (
    <section
      aria-label="CD balance"
      className={`flex h-full w-full flex-col ${helpCardSurface} ${helpCardPadding}`}
    >
      <p className={W_LABEL}>CD balance</p>
      <p className={`mt-1 ${W_VALUE}`}>{formatInr(balance, false)}</p>
      <div className="mt-auto pt-4" aria-label="Wallet utilization since last top-up in the last 30 days">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
          <span>{remainingPct}% remaining</span>
          <span className="tabular-nums text-gray-900">{formatInr(utilizedInr, false)} utilized</span>
        </div>
        <div className={W_BAR_H}>
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${remainingPct}%` }}
            title={`${remainingPct}% remaining since last top-up (last 30 days)`}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-gray-400">Since last top-up · last 30 days</p>
      </div>
    </section>
  )
}

function CdBurnRunwayCard({
  monthlyBurn,
  runwayDays,
}: {
  monthlyBurn: number
  runwayDays: number
}) {
  const runwayBarPct = Math.min(100, (runwayDays / 365) * 100)

  return (
    <section
      aria-label="Average CD consumption"
      className={`flex h-full w-full flex-col ${helpCardSurface} ${helpCardPadding}`}
    >
      <p className={W_LABEL}>Average CD consumption</p>
      <p className={`mt-1 ${W_VALUE}`}>{formatInr(monthlyBurn, false)}</p>
      <div className="mt-auto pt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
          <span>Runway</span>
          <span className="tabular-nums text-gray-900">{runwayDays} days</span>
        </div>
        <div className={W_BAR_H}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            style={{ width: `${runwayBarPct}%` }}
            title={`${runwayDays} days of cover at current burn`}
          />
        </div>
      </div>
    </section>
  )
}

function CdPremiumSplitDonut({ balance }: { balance: number }) {
  const gmcRatio = CD_PREMIUM_SPLIT.gmcPremiumMonthly
  const gpaRatio = CD_PREMIUM_SPLIT.gpaPremiumMonthly
  const ratioTotal = gmcRatio + gpaRatio || 1
  const gmcPct = (gmcRatio / ratioTotal) * 100
  const gpaPct = (gpaRatio / ratioTotal) * 100
  const gmcFromBalance = (balance * gmcRatio) / ratioTotal
  const gpaFromBalance = (balance * gpaRatio) / ratioTotal

  return (
    <section
      aria-label="GMC versus GPA apportionment of current CD balance"
      className={`flex h-full w-full flex-col ${helpCardSurface} ${helpCardPadding}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={W_LABEL}>GMC vs GPA</p>
          <p className={`mt-1 ${W_VALUE}`}>{formatInr(gmcFromBalance + gpaFromBalance, false)}</p>
          <p className={`${W_SUB} mt-1`}>Apportioned from current balance</p>
        </div>
        <div className="shrink-0 self-start pt-0.5">
          <KeyMetricDonut
            valueA={gmcFromBalance}
            valueB={gpaFromBalance}
            labelA="GMC"
            labelB="GPA"
            colorA="#7c3aed"
            colorB="#0891b2"
            size={56}
            formatValue={(n) => formatInr(Number(n) || 0, false)}
          />
        </div>
      </div>

      <ul className="mt-auto space-y-1.5 pt-3 text-xs text-gray-700">
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-violet-600" aria-hidden />
            GMC
          </span>
          <span className="font-semibold tabular-nums text-gray-900">
            {gmcPct.toFixed(0)}% · {formatInr(gmcFromBalance, false)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-cyan-600" aria-hidden />
            GPA
          </span>
          <span className="font-semibold tabular-nums text-gray-900">
            {gpaPct.toFixed(0)}% · {formatInr(gpaFromBalance, false)}
          </span>
        </li>
      </ul>
    </section>
  )
}

function CdRechargeEscalation({
  onRaiseProforma,
  onViewProformaList,
  className = '',
}: {
  onRaiseProforma: () => void
  onViewProformaList: () => void
  className?: string
}) {
  return (
    <section
      className={`shrink-0 ${helpEscalationShell} ${helpCardPadding} ${className}`.trim()}
      aria-labelledby="cd-recharge-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className={helpEscalationIcon} aria-hidden>
            <IndianRupee size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 id="cd-recharge-heading" className="text-sm font-semibold text-gray-900">
              Need to top up?
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              Raise a proforma invoice — ACKO shares bank and UTR instructions after your request.{' '}
              <button type="button" onClick={onViewProformaList} className={helpLinkInline}>
                View proforma invoices
              </button>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRaiseProforma}
          className={`${helpPrimaryBtn} inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm`}
        >
          <Receipt className="h-4 w-4 shrink-0" aria-hidden />
          Raise proforma invoice
        </button>
      </div>
    </section>
  )
}

function CdBalanceMetricBlock({ balance }: { balance: number }) {
  const { remainingPct, utilizedInr } = cdWalletUtilization(balance, ALL_TRANSACTIONS, CD_BALANCE_AS_OF_ISO)

  return (
    <div className="flex min-w-0 flex-col" aria-label="CD balance">
      <p className={W_LABEL}>CD balance</p>
      <p className={`mt-1 ${W_VALUE}`}>{formatInr(balance, false)}</p>
      <div className="mt-auto w-full pt-4" aria-label="Wallet utilization since last top-up in the last 30 days">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
          <span>{remainingPct}% remaining</span>
          <span className="tabular-nums text-gray-900">{formatInr(utilizedInr, false)} utilized</span>
        </div>
        <div className={W_BAR_H}>
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${remainingPct}%` }}
            title={`${remainingPct}% remaining since last top-up (last 30 days)`}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-gray-400">Since last top-up · last 30 days</p>
      </div>
    </div>
  )
}

function CdProformaTopUpPanel({
  onRaiseProforma,
  onViewProformaList,
  compact = false,
}: {
  onRaiseProforma: () => void
  onViewProformaList: () => void
  compact?: boolean
}) {
  return (
    <div
      className={`${helpEscalationShell} ${compact ? 'flex h-full flex-col justify-center p-4 sm:p-5' : 'p-4 sm:p-5'}`}
      aria-labelledby="cd-recharge-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={helpEscalationIcon} aria-hidden>
            <IndianRupee size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 id="cd-recharge-heading" className="text-sm font-semibold text-gray-900">
              Need to top up?
            </h2>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-600">
              Raise a proforma invoice for bank and UTR instructions.{' '}
              <button type="button" onClick={onViewProformaList} className={helpLinkInline}>
                View proforma invoices
              </button>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRaiseProforma}
          className={`${helpPrimaryBtn} inline-flex w-full shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm sm:w-auto`}
        >
          <Receipt className="h-4 w-4 shrink-0" aria-hidden />
          Raise proforma invoice
        </button>
      </div>
    </div>
  )
}

function CdBalanceWithTopUpCard({
  balance,
  monthlyBurn,
  runwayDays,
  onRaiseProforma,
  onViewProformaList,
}: {
  balance: number
  monthlyBurn: number
  runwayDays: number
  onRaiseProforma: () => void
  onViewProformaList: () => void
}) {
  const runwayBarPct = Math.min(100, (runwayDays / 365) * 100)

  return (
    <section
      className={`w-full ${helpCardSurface} ${helpCardPadding}`}
      aria-label="CD balance and top-up"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch md:gap-8">
        <CdBalanceMetricBlock balance={balance} />

        <div
          className="flex min-w-0 flex-col md:border-l md:border-gray-100 md:pl-8"
          aria-label="Average CD consumption"
        >
          <p className={W_LABEL}>Average CD consumption</p>
          <p className={`mt-1 ${W_VALUE}`}>{formatInr(monthlyBurn, false)}</p>
          <div className="mt-auto w-full pt-4">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
              <span>Runway</span>
              <span className="tabular-nums text-gray-900">{runwayDays} days</span>
            </div>
            <div className={W_BAR_H}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                style={{ width: `${runwayBarPct}%` }}
                title={`${runwayDays} days of cover at current burn`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <CdProformaTopUpPanel onRaiseProforma={onRaiseProforma} onViewProformaList={onViewProformaList} />
      </div>
    </section>
  )
}

function CdBalanceWithProformaCard({
  balance,
  onRaiseProforma,
  onViewProformaList,
}: {
  balance: number
  onRaiseProforma: () => void
  onViewProformaList: () => void
}) {
  return (
    <div className={`grid grid-cols-1 ${helpCardGridGap} md:grid-cols-2`}>
      <section
        className={`flex h-full w-full flex-col ${helpCardSurface} ${helpCardPadding}`}
        aria-label="CD balance"
      >
        <CdBalanceMetricBlock balance={balance} />
      </section>
      <section className="flex h-full w-full flex-col" aria-label="Raise proforma invoice">
        <CdProformaTopUpPanel
          compact
          onRaiseProforma={onRaiseProforma}
          onViewProformaList={onViewProformaList}
        />
      </section>
    </div>
  )
}

function CdOverviewMetricsV2({
  balance,
  monthlyBurn,
  runwayDays,
  onRaiseProforma,
  onViewProformaList,
}: {
  balance: number
  monthlyBurn: number
  runwayDays: number
  onRaiseProforma: () => void
  onViewProformaList: () => void
}) {
  return (
    <CdBalanceWithTopUpCard
      balance={balance}
      monthlyBurn={monthlyBurn}
      runwayDays={runwayDays}
      onRaiseProforma={onRaiseProforma}
      onViewProformaList={onViewProformaList}
    />
  )
}

function CdOverviewMetricsV3({
  balance,
  onRaiseProforma,
  onViewProformaList,
}: {
  balance: number
  onRaiseProforma: () => void
  onViewProformaList: () => void
}) {
  return (
    <CdBalanceWithProformaCard
      balance={balance}
      onRaiseProforma={onRaiseProforma}
      onViewProformaList={onViewProformaList}
    />
  )
}

function CdOverviewMetrics({
  balance,
  monthlyBurn,
  runwayDays,
}: {
  balance: number
  monthlyBurn: number
  runwayDays: number
}) {
  return (
    <div className={`grid grid-cols-1 ${helpCardGridGap} md:grid-cols-2 lg:grid-cols-3`}>
      <div className="flex h-full w-full">
        <CdBalancePrimaryCard balance={balance} />
      </div>
      <div className="flex h-full w-full">
        <CdBurnRunwayCard monthlyBurn={monthlyBurn} runwayDays={runwayDays} />
      </div>
      <div className="flex h-full w-full md:col-span-2 lg:col-span-1">
        <CdPremiumSplitDonut balance={balance} />
      </div>
    </div>
  )
}

type CdPageVersion = 'v1' | 'v2' | 'v3'

function isCdCompactExperience(version: CdPageVersion) {
  return version === 'v2' || version === 'v3'
}

function CdMetricsSection({
  pageVersion,
  balance,
  monthlyBurn,
  runwayDays,
  onRaiseProforma,
  onViewProformaList,
}: {
  pageVersion: CdPageVersion
  balance: number
  monthlyBurn: number
  runwayDays: number
  onRaiseProforma: () => void
  onViewProformaList: () => void
}) {
  return (
    <div className="flex shrink-0 flex-col gap-4">
      <div className="flex items-center justify-end">
        <p className="text-xs text-gray-500">
          Last updated{' '}
          <time className="font-medium tabular-nums text-gray-700" dateTime={CD_BALANCE_AS_OF_ISO}>
            {formatLastUpdated(CD_BALANCE_AS_OF_ISO)}
          </time>
        </p>
      </div>
      {pageVersion === 'v1' ? (
        <>
          <CdOverviewMetrics balance={balance} monthlyBurn={monthlyBurn} runwayDays={runwayDays} />
          <CdRechargeEscalation onRaiseProforma={onRaiseProforma} onViewProformaList={onViewProformaList} />
        </>
      ) : pageVersion === 'v2' ? (
        <CdOverviewMetricsV2
          balance={balance}
          monthlyBurn={monthlyBurn}
          runwayDays={runwayDays}
          onRaiseProforma={onRaiseProforma}
          onViewProformaList={onViewProformaList}
        />
      ) : (
        <CdOverviewMetricsV3
          balance={balance}
          onRaiseProforma={onRaiseProforma}
          onViewProformaList={onViewProformaList}
        />
      )}
    </div>
  )
}

const CD_TOOLBAR_ROW =
  `flex min-h-[2.75rem] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 ${PORTAL_TABLE_SECTION_GUTTER}`

/** Toolbar below activity tabs — same min-height in every tab view. */
const CD_ACTIVITY_TOOLBAR_SLOT =
  `flex shrink-0 flex-col justify-center gap-2 border-b border-gray-100 min-h-[5.5rem] py-3 sm:min-h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-0 ${PORTAL_TABLE_SECTION_GUTTER}`

/** Inner wrapper — vertically centers content within the fixed toolbar height. */
const CD_ACTIVITY_TOOLBAR_INNER = 'flex h-full w-full min-h-0 items-center'

const CD_TABLE_BTN =
  'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20'

const CD_TABLE_BTN_PRIMARY = `${CD_TABLE_BTN} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:opacity-100 disabled:shadow-none disabled:hover:bg-indigo-300`

const CD_TABLE_BTN_SECONDARY = `${CD_TABLE_BTN} border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50`

/** Row action icon buttons — matches endorsements table (`ScheduleDocumentModals`). */
const CD_TABLE_ROW_ICON_BTN = ENDORSEMENT_TABLE_ICON_BTN

/** Row-level View CTA — matches endorsements history / schedule tables. */
const CD_TABLE_VIEW_BTN = ENDORSEMENT_SCHEDULE_VIEW_BTN

/** Comfortable row padding for list tables with actions or nested content. */
const CD_TABLE_CELL_COMFORT = 'px-2 py-3'

/** Data columns in transaction table — extra horizontal spacing (leading cols unchanged). */
const CD_TX_DATA_CELL = 'px-3 py-3'

const CD_TX_DATA_HEAD = `${PORTAL_TABLE_TH_CLASS} px-3`

/** Transaction ID cell — chevron + ID grouped with consistent gap. */
const CD_TX_ID_CELL = `${PORTAL_TABLE_CELL_EDGE_PL} align-middle py-3`

const CD_TX_ID_HEAD = `${PORTAL_TABLE_TH_CLASS} ${PORTAL_TABLE_HEAD_EDGE_PL} min-w-0 py-2`

const CD_TX_ID_INNER = 'flex min-w-0 items-center gap-2'

/** Neutral secondary for alert pause / resume. */
const CD_ALERT_SOFT_BTN = `${CD_TABLE_BTN} border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50`

type CdRechargeModalProps = {
  open: boolean
  phase: RechargePhase
  progress: number
  amountInr: string
  amountError: string
  lastGenerated: { ref: string; amount: number } | null
  onAmountChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  onDownload: () => void
  onViewProforma: () => void
  onViewProformaList: () => void
  billingEntityLabel: string
}

function parseRechargeAmountInr(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : 0
}

function CdRechargeModal({
  open,
  phase,
  progress,
  amountInr,
  amountError,
  lastGenerated,
  onAmountChange,
  onClose,
  onSubmit,
  onDownload,
  onViewProforma,
  onViewProformaList,
  billingEntityLabel,
}: CdRechargeModalProps) {
  const modalTitle =
    phase === 'ready' ? 'Proforma invoice ready' : phase === 'generating' ? 'Generating invoice' : 'Add funds'
  const closable = phase !== 'generating'
  const previewAmount = parseRechargeAmountInr(amountInr)

  const formHeader = (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <FileText className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="modal-title" className="text-base font-bold text-gray-900">
          Raise Proforma Invoice
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">Enter a recharge amount — there is no minimum.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Close"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )

  return (
    <ModalShell
      open={open}
      title={modalTitle}
      onClose={onClose}
      closable={closable}
      maxWidthClass="max-w-lg"
      headerSlot={phase === 'form' ? formHeader : undefined}
      bodyClassName={phase === 'form' ? 'px-5 pt-5 pb-5' : 'max-h-[min(80vh,520px)] overflow-y-auto px-4 py-4'}
    >
      {phase === 'generating' ? (
        <div className="py-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-gray-900">Generating proforma invoice…</p>
          <p className="mt-1 text-xs text-gray-500">Applying your amount to the ACKO proforma template.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width] duration-75 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-gray-500">{progress}%</p>
        </div>
      ) : phase === 'ready' && lastGenerated ? (
        <div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm text-gray-600">
                <span className="font-mono text-xs font-semibold text-gray-900">{lastGenerated.ref}</span>
                {' · '}
                {formatInr(lastGenerated.amount, false)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Download the PDF and pay via NEFT. Share your UTR with ACKO to credit your CD wallet.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onViewProformaList}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              View in history
            </button>
            <button
              type="button"
              onClick={onViewProforma}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-100"
            >
              <Eye className="h-4 w-4 shrink-0" aria-hidden />
              View PDF
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Download
            </button>
          </div>
        </div>
      ) : (
        <>
          <label htmlFor="cd-recharge-amount" className="block text-sm font-semibold text-gray-900">
            Recharge amount
          </label>
          <div className="mt-2 flex overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
              ₹
            </span>
            <input
              id="cd-recharge-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="500000"
              value={amountInr}
              onChange={(e) => onAmountChange(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
          {amountError ? <p className="mt-2 text-xs font-medium text-red-600">{amountError}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {PROFORMA_QUICK_AMOUNTS.map((amt) => {
              const selected = previewAmount === amt
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onAmountChange(String(amt))}
                  className={portalFilterChipClass(selected)}
                >
                  {formatInr(amt, false)}
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Invoice preview</p>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-gray-700">CD Balance Recharge</span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                  {previewAmount > 0 ? formatInr(previewAmount, false) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 text-sm">
                <span className="text-gray-500">GST</span>
                <span className="text-gray-500">Not applicable</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="shrink-0 font-bold tabular-nums text-gray-900">
                  {previewAmount > 0 ? formatInr(previewAmount, false) : '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Billing entity: {billingEntityLabel}
            {CD_PROFORMA_EMPLOYER.gstin ? ` · GSTIN ${CD_PROFORMA_EMPLOYER.gstin}` : ''}
          </p>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Generate Invoice
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

function ProformaViewerModal({
  open,
  invoiceRef,
  pdfUrl,
  onClose,
  onDownload,
  onEmail,
}: {
  open: boolean
  invoiceRef: string
  pdfUrl: string | null
  onClose: () => void
  onDownload: () => void
  onEmail: () => void
}) {
  return (
    <ModalShell
      open={open}
      title={`Proforma ${invoiceRef}`}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      bodyClassName="flex max-h-[min(85vh,720px)] flex-col overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          {pdfUrl ? (
            <iframe title={`Proforma invoice ${invoiceRef}`} src={pdfUrl} className="h-full min-h-[20rem] w-full border-0" />
          ) : (
            <div className="flex h-full min-h-[20rem] items-center justify-center px-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEmail}
            disabled={!pdfUrl}
            className={`${CD_TABLE_BTN_SECONDARY} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Email
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!pdfUrl}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Download
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function formatDateShort(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDateRangeFilterLabel(from: string, to: string): string {
  if (!from && !to) return 'All dates'
  if (from && to) return `${formatDateShort(from)}–${formatDateShort(to)}`
  if (from) return `${formatDateShort(from)}–…`
  return `…–${formatDateShort(to)}`
}

const CD_DATE_POPOVER_WIDTH_PX = 280

function CdDateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = Math.min(CD_DATE_POPOVER_WIDTH_PX, window.innerWidth - 24)
    let left = rect.right - width
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
    setPopoverStyle({ top: rect.bottom + 4, left, width })
  }, [])

  useEffect(() => {
    if (!open) return
    setDraftFrom(from)
    setDraftTo(to)
    updatePopoverPosition()
  }, [open, from, to, updatePopoverPosition])

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePopoverPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updatePopoverPosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [open])

  const label = formatDateRangeFilterLabel(from, to)
  const hasActiveFilter = Boolean(from || to)

  function applyRange(fromVal: string, toVal: string) {
    onFromChange(fromVal)
    onToChange(toVal)
    setOpen(false)
  }

  function clearRange(e?: ReactMouseEvent) {
    e?.stopPropagation()
    applyRange('', '')
    setDraftFrom('')
    setDraftTo('')
  }

  const popover =
    open && popoverStyle
      ? createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: popoverStyle.top,
              left: popoverStyle.left,
              width: popoverStyle.width,
              zIndex: 9999,
            }}
            className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
            role="dialog"
            aria-label="Date range"
          >
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                aria-label="Range start"
                className="cd-date-range-input relative h-8 min-w-0 flex-1 rounded-md border border-gray-200 px-1.5 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="shrink-0 text-xs text-gray-400" aria-hidden>
                –
              </span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                aria-label="Range end"
                className="cd-date-range-input relative h-8 min-w-0 flex-1 rounded-md border border-gray-200 px-1.5 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftFrom('')
                  setDraftTo('')
                  applyRange('', '')
                }}
                className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                All dates
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => applyRange(draftFrom, draftTo)}
                  className="cursor-pointer rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="relative inline-flex shrink-0 items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-transparent py-0 text-xs text-gray-800 hover:border-gray-300 focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 ${
          hasActiveFilter ? 'max-w-[9.5rem] pl-2 pr-1' : 'max-w-[10.5rem] px-2'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Date range: ${label}`}
        title={label}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
        <span className="min-w-0 truncate whitespace-nowrap tabular-nums">{label}</span>
        {!hasActiveFilter ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
        ) : null}
      </button>
      {hasActiveFilter ? (
        <button
          type="button"
          onClick={clearRange}
          className="ml-0.5 inline-flex h-8 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
          aria-label="Clear date range filter"
          title="Clear date range"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
      {popover}
    </div>
  )
}

function disputeStatusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('review') || s.includes('submitted')) return 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
  if (s.includes('await') || s.includes('document')) return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
  if (s.includes('resolved') || s.includes('closed')) return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
  return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
}

function CdRaiseDisputeCta({
  mode,
  selectedCount,
  onClick,
  coachmarkId = 'cd-raise-dispute-hint',
}: {
  mode: 'selection' | 'manual'
  selectedCount: number
  onClick: () => void
  coachmarkId?: string
}) {
  const canRaise = mode === 'manual' || selectedCount > 0

  return (
    <div className={`group/dispute-cta relative inline-flex${canRaise ? '' : ' cursor-help'}`}>
      <button
        type="button"
        disabled={!canRaise}
        onClick={onClick}
        className={CD_TABLE_BTN_PRIMARY}
        aria-describedby={!canRaise ? coachmarkId : undefined}
      >
        <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Raise dispute{mode === 'selection' && selectedCount > 0 ? ` (${selectedCount})` : ''}
      </button>
      {!canRaise ? (
        <div
          id={coachmarkId}
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-[200] mt-2 w-[min(16rem,calc(100vw-3rem))] rounded-lg border border-gray-200 bg-white p-3 text-left opacity-0 shadow-lg ring-1 ring-black/5 transition-[opacity,transform] duration-200 translate-y-1 group-hover/dispute-cta:pointer-events-auto group-hover/dispute-cta:translate-y-0 group-hover/dispute-cta:opacity-100 group-focus-within/dispute-cta:pointer-events-auto group-focus-within/dispute-cta:translate-y-0 group-focus-within/dispute-cta:opacity-100 motion-reduce:transition-none"
        >
          <p className="text-[11px] leading-snug text-gray-600">
            {mode === 'selection'
              ? 'Select one or more transactions in the table, then raise a dispute.'
              : 'Select transactions on Transaction history, or use this to raise a general dispute.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function CdToggleSwitch({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  size?: 'sm' | 'md'
}) {
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

function TxNestedStat({
  icon: Icon,
  iconClass,
  primary,
  primaryClass = 'text-gray-900',
  secondary,
}: {
  icon: typeof UserPlus
  iconClass: string
  primary: string
  primaryClass?: string
  secondary: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 px-3 py-1 first:pl-0 sm:min-w-[8.5rem]">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold tabular-nums ${primaryClass}`}>{primary}</p>
        <p className="text-xs font-normal text-gray-600">{secondary}</p>
      </div>
    </div>
  )
}

function TxEndorsementNestedRow({
  row,
  onViewDetails,
}: {
  row: TransactionRow
  onViewDetails: () => void
}) {
  const summary = row.lineSummary
  const added = summary?.employeesAdded ?? 0
  const exited = summary?.employeesExited ?? 0
  const familyAdded = summary?.familyMembersAdded ?? summary?.familyMembers ?? 0
  const familyExited = summary?.familyMembersExited ?? 0
  const netNegative = row.amount < 0

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200/80 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-stretch divide-x divide-gray-200">
        <TxNestedStat
          icon={UserPlus}
          iconClass="bg-emerald-50 text-emerald-600"
          primary={`${added} employee${added === 1 ? '' : 's'} added`}
          secondary={`${familyAdded} family member${familyAdded === 1 ? '' : 's'}`}
        />
        <TxNestedStat
          icon={UserMinus}
          iconClass="bg-rose-50 text-rose-600"
          primary={`${exited} employee${exited === 1 ? '' : 's'} exited`}
          secondary={`${familyExited} family member${familyExited === 1 ? '' : 's'}`}
        />
        <TxNestedStat
          icon={IndianRupee}
          iconClass="bg-gray-100 text-gray-600"
          primary={formatInrSigned(row.amount)}
          primaryClass={netNegative ? 'text-rose-600' : row.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}
          secondary="net impact"
        />
      </div>
      <button
        type="button"
        className={CD_TABLE_VIEW_BTN}
        onClick={(e) => {
          e.stopPropagation()
          onViewDetails()
        }}
      >
        <Eye size={11} className="shrink-0" aria-hidden />
        View
      </button>
    </div>
  )
}

function TxDepositNestedRow({
  row,
  deposit,
  onView,
}: {
  row: TransactionRow
  deposit: DepositDetails
  onView: () => void
}) {
  const fields = [
    { label: 'Bank', value: deposit.bank },
    { label: 'Account', value: deposit.accountMasked },
    { label: 'Mode', value: deposit.mode },
    { label: 'UTR number', value: row.transactionId },
  ]

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200/80 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className={helpCategoryLabel}>{label}</p>
            <p className="mt-0.5 font-mono text-xs font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={CD_TABLE_VIEW_BTN}
        onClick={(e) => {
          e.stopPropagation()
          onView()
        }}
      >
        <Eye size={11} className="shrink-0" aria-hidden />
        View
      </button>
    </div>
  )
}

function EndorsementActionBadge({ action }: { action: 'added' | 'exited' }) {
  if (action === 'added') {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        + Added
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      − Exited
    </span>
  )
}

function CdEndorsementDetailsModal({
  open,
  tx,
  onClose,
}: {
  open: boolean
  tx: TransactionRow | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !tx || !tx.endorsementLines?.length) return null

  const openingBalance = tx.balanceAfter - tx.amount
  const netNegative = tx.amount < 0
  const livesCount = tx.endorsementLines.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close modal" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="endorsement-details-title"
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Layers className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="endorsement-details-title" className="text-base font-bold text-gray-900">
              Endorsement Details — {tx.transactionId}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {tx.typeLabel} on {formatDateOnly(tx.at)}
              {' · '}
              Net{' '}
              <span className={`font-semibold tabular-nums ${netNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatInrSigned(tx.amount)}
              </span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Opening CD balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{formatInr(openingBalance, false)}</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Net impact</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${netNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatInrSigned(tx.amount)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Closing CD balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{formatInr(tx.balanceAfter, false)}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Lives affected</h3>
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600">
                {livesCount}
              </span>
            </div>
            {tx.transactionDate ? (
              <p className="text-xs text-gray-500">
                Effective date: {formatDateOnly(tx.transactionDate)}
              </p>
            ) : null}
          </div>

          {/* Modal nested table — exempt from card full-bleed header rule (see employer-portal-ui-shell.mdc). */}
          <div className="mt-3 overflow-x-hidden rounded-lg border border-gray-200">
            <table className={`${PORTAL_TABLE_CLASS} text-left text-sm`}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className={`px-3 py-2.5 text-left ${helpCategoryLabel}`}>Employee</th>
                  <th className={`px-3 py-2.5 text-left ${helpCategoryLabel}`}>Action</th>
                  <th className={`min-w-0 px-3 py-2.5 text-left ${helpCategoryLabel}`}>Endorsement details</th>
                  <th className={`px-3 py-2.5 text-right ${helpCategoryLabel}`}>Premium</th>
                  <th className={`px-3 py-2.5 text-right ${helpCategoryLabel}`}>Bal. after</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tx.endorsementLines.map((line, idx) => (
                  <tr key={`${line.employeeId}-${idx}`} className="text-gray-800">
                    <td className="px-3 py-2.5 align-top">
                      <p className="text-xs font-semibold text-gray-900">{line.employeeName}</p>
                      <p className="font-mono text-[11px] text-gray-500">{line.employeeId}</p>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <EndorsementActionBadge action={line.action} />
                    </td>
                    <td className="min-w-0 px-3 py-2.5 align-top text-xs text-gray-600">{line.details}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top text-right text-xs font-semibold tabular-nums">
                      <span className={line.premium < 0 ? 'text-rose-600' : line.premium > 0 ? 'text-emerald-600' : 'text-gray-800'}>
                        {formatInrSigned(line.premium)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top text-right text-xs tabular-nums text-gray-700">
                      {formatInr(line.balanceAfter, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className={CD_TABLE_BTN_SECONDARY}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CdDepositDetailsModal({
  open,
  tx,
  onClose,
}: {
  open: boolean
  tx: TransactionRow | null
  onClose: () => void
}) {
  if (!tx || !tx.depositDetails) return null
  const { bank, accountMasked, mode } = tx.depositDetails

  return (
    <ModalShell open={open} title="Deposit details" onClose={onClose} maxWidthClass="max-w-md">
      <div className="space-y-4 text-sm">
        <p className="font-mono text-xs font-semibold text-gray-900">{tx.transactionId}</p>
        <p className="text-xs text-gray-600">{tx.description}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <dt className="text-gray-500">Bank</dt>
          <dd className="text-right font-medium text-gray-900">{bank}</dd>
          <dt className="text-gray-500">Account</dt>
          <dd className="text-right font-mono text-gray-900">{accountMasked}</dd>
          <dt className="text-gray-500">Mode</dt>
          <dd className="text-right text-gray-900">{mode}</dd>
          <dt className="text-gray-500">Credited on</dt>
          <dd className="text-right text-gray-800">{formatDateOnly(tx.at)}</dd>
          <dt className="text-gray-500">Amount</dt>
          <dd className="text-right font-semibold tabular-nums text-emerald-600">{formatInrSigned(tx.amount)}</dd>
          <dt className="text-gray-500">Balance after</dt>
          <dd className="text-right tabular-nums text-gray-800">{formatInr(tx.balanceAfter, false)}</dd>
          <dt className="text-gray-500">Status</dt>
          <dd className="text-right">
            <StatusBadge status={tx.status} />
          </dd>
        </dl>
        {tx.settlementNote ? (
          <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">{tx.settlementNote}</p>
        ) : null}
        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className={CD_TABLE_BTN_SECONDARY}>
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function CdAlertListRow({
  rule,
  highlighted = false,
  preview = false,
  animateEnter = false,
  onEdit,
  onDelete,
  onTogglePause,
}: {
  rule: CdAlertRule
  highlighted?: boolean
  preview?: boolean
  /** Fade/slide in — off during composer handoff so the row does not pop. */
  animateEnter?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onTogglePause?: () => void
}) {
  const isPaused = rule.status === 'paused'
  const highlightClass = highlighted
    ? preview || !animateEnter
      ? ' cd-alert-highlight !opacity-100 !saturate-100'
      : ' cd-alert-highlight cd-alert-row-enter !opacity-100 !saturate-100'
    : ''

  return (
    <div
      id={preview ? undefined : `cd-alert-row-${rule.id}`}
      className={`rounded-xl border px-4 py-4 sm:px-5 transition-colors ${
        isPaused
          ? 'border-dashed border-gray-200 bg-gray-50/90 opacity-60 saturate-[0.65]'
          : 'border-gray-200 bg-white'
      }${highlightClass}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={`flex min-w-0 flex-1 items-center gap-3${isPaused ? ' pointer-events-none' : ''}`}>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isPaused ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Bell className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${isPaused ? 'text-gray-500' : 'text-gray-900'}`}>{rule.title}</p>
            <p className={`mt-0.5 text-xs font-normal ${isPaused ? 'text-gray-400' : 'text-gray-600'}`}>
              Notify when balance drops below{' '}
              <span className={`font-semibold ${isPaused ? 'text-gray-500' : 'text-gray-900'}`}>
                {formatAlertThreshold(rule.thresholdInr)}
              </span>
            </p>
          </div>
        </div>
        <div
          className={`flex shrink-0 flex-wrap items-center justify-center gap-1.5 sm:px-2${
            isPaused ? ' pointer-events-none opacity-70' : ''
          }`}
        >
          {rule.channels.includes('email') ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
              <Mail className="h-3 w-3" aria-hidden />
              Email
            </span>
          ) : null}
          {rule.channels.includes('dashboard') ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
              <LayoutGrid className="h-3 w-3" aria-hidden />
              Dashboard
            </span>
          ) : null}
        </div>
        {!preview && onEdit && onDelete && onTogglePause ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onEdit}
              className={CD_TABLE_ROW_ICON_BTN}
              aria-label={`Edit alert ${rule.title}`}
              title="Edit"
            >
              <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={CD_TABLE_ROW_ICON_BTN}
              aria-label={`Delete alert ${rule.title}`}
              title="Delete"
            >
              <Trash2 className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            </button>
            <CdToggleSwitch
              size="sm"
              checked={!isPaused}
              onChange={onTogglePause}
              label={`Toggle ${rule.title} alert`}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CdAlertComposerCard({
  rule,
  onCancel,
  onSave,
}: {
  rule: CdAlertRule | null
  onCancel: () => void
  onSave: (rule: CdAlertRule) => void
}) {
  const isNew = rule == null
  const [title, setTitle] = useState('')
  const [threshold, setThreshold] = useState('')
  const [emailChannel, setEmailChannel] = useState(true)
  const [dashboardChannel, setDashboardChannel] = useState(true)

  useEffect(() => {
    if (rule) {
      setTitle(rule.title)
      setThreshold(String(rule.thresholdInr))
      setEmailChannel(rule.channels.includes('email'))
      setDashboardChannel(rule.channels.includes('dashboard'))
    } else {
      setTitle('')
      setThreshold(String(10_00_000))
      setEmailChannel(true)
      setDashboardChannel(true)
    }
  }, [rule])

  const channels: AlertChannel[] = [
    ...(emailChannel ? (['email'] as const) : []),
    ...(dashboardChannel ? (['dashboard'] as const) : []),
  ]
  const thresholdNum = Number(String(threshold).replace(/,/g, ''))
  const canSave = title.trim().length > 0 && Number.isFinite(thresholdNum) && thresholdNum > 0 && channels.length > 0

  const handleSave = () => {
    onSave({
      id: rule?.id ?? `alert-${Date.now()}`,
      title: title.trim(),
      thresholdInr: thresholdNum,
      channels,
      status: rule?.status ?? 'active',
    })
  }

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 px-3 py-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          <Bell className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-gray-900">{isNew ? 'New balance alert' : 'Edit balance alert'}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="text-xs font-semibold text-gray-600" htmlFor="cd-alert-title">
            Alert name <span className="text-rose-500">*</span>
          </label>
          <input
            id="cd-alert-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Low balance warning"
            className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs font-semibold text-gray-600" htmlFor="cd-alert-threshold-edit">
            Threshold <span className="text-rose-500">*</span>
          </label>
          <div className="mt-1 flex h-8 overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <span className="flex items-center border-r border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-600">
              ₹
            </span>
            <input
              id="cd-alert-threshold-edit"
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value.replace(/[^\d]/g, ''))}
              className="min-w-0 flex-1 border-0 bg-white px-2.5 text-sm text-gray-900 outline-none"
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ALERT_THRESHOLD_QUICK_AMOUNTS.map((amt) => {
              const selected = thresholdNum === amt
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setThreshold(String(amt))}
                  className={portalToggleChipClass(selected)}
                >
                  {formatInr(amt, false)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 sm:col-span-2">
          <p className="text-xs font-semibold text-gray-600">
            Notify via <span className="text-rose-500">*</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800">
              <Mail className="h-3.5 w-3.5 text-gray-500" aria-hidden />
              Email
              <CdToggleSwitch size="sm" checked={emailChannel} onChange={setEmailChannel} label="Email notifications" />
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800">
              <LayoutGrid className="h-3.5 w-3.5 text-gray-500" aria-hidden />
              Dashboard
              <CdToggleSwitch
                size="sm"
                checked={dashboardChannel}
                onChange={setDashboardChannel}
                label="Dashboard notifications"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t border-indigo-100 pt-3">
        <button type="button" onClick={onCancel} className={CD_TABLE_BTN_SECONDARY}>
          Cancel
        </button>
        <button type="button" disabled={!canSave} className={CD_TABLE_BTN_PRIMARY} onClick={handleSave}>
          {isNew ? 'Create alert' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

const CD_COMPOSER_HEIGHT_TRANSITION_MS = 480
/** Wait for preview + max-height shrink before handing off to the list row. */
const CD_COMPOSER_HANDOFF_MS = 450 + CD_COMPOSER_HEIGHT_TRANSITION_MS

const CD_COMPOSER_COLLAPSE_MS = 480

function CdAlertsTabPanel({
  rules,
  chipFilter,
  onChipFilterChange,
  onSave,
  onTogglePause,
  onDeleteAlert,
  embedded = false,
}: {
  rules: CdAlertRule[]
  chipFilter: AlertChipFilter
  onChipFilterChange: (f: AlertChipFilter) => void
  onSave: (rule: CdAlertRule) => void
  onTogglePause: (id: string) => void
  onDeleteAlert: (id: string) => void
  embedded?: boolean
}) {
  type ComposerMode = 'closed' | 'create' | 'edit'
  const [composerMode, setComposerMode] = useState<ComposerMode>('closed')
  const [composerTarget, setComposerTarget] = useState<CdAlertRule | null>(null)
  const [composerExpanded, setComposerExpanded] = useState(false)
  const [highlightedAlertId, setHighlightedAlertId] = useState<string | null>(null)
  const [savedTransitionRule, setSavedTransitionRule] = useState<CdAlertRule | null>(null)
  const [composerBodyHeight, setComposerBodyHeight] = useState<number | null>(null)
  const listScrollRef = useRef<HTMLDivElement>(null)
  const composerContentRef = useRef<HTMLDivElement>(null)
  const highlightTimeoutRef = useRef<number | null>(null)
  const composerCloseTimerRef = useRef<number | null>(null)

  const syncComposerBodyHeight = useCallback(() => {
    const el = composerContentRef.current
    if (!el) return
    setComposerBodyHeight(el.scrollHeight)
  }, [])

  useLayoutEffect(() => {
    if (composerMode === 'closed') {
      setComposerBodyHeight(null)
      return
    }
    const el = composerContentRef.current
    if (!el) return

    if (savedTransitionRule) {
      const targetHeight = el.scrollHeight
      setComposerBodyHeight((prev) => {
        if (prev != null && prev !== targetHeight) {
          requestAnimationFrame(() => setComposerBodyHeight(targetHeight))
          return prev
        }
        return targetHeight
      })
      return
    }

    syncComposerBodyHeight()
  }, [composerMode, composerTarget?.id, savedTransitionRule, composerExpanded, syncComposerBodyHeight])

  const clearComposerCloseTimer = useCallback(() => {
    if (composerCloseTimerRef.current != null) {
      window.clearTimeout(composerCloseTimerRef.current)
      composerCloseTimerRef.current = null
    }
  }, [])

  const closeComposer = useCallback(() => {
    clearComposerCloseTimer()
    setSavedTransitionRule(null)
    setComposerExpanded(false)
    composerCloseTimerRef.current = window.setTimeout(() => {
      setComposerMode('closed')
      setComposerTarget(null)
      composerCloseTimerRef.current = null
    }, CD_COMPOSER_COLLAPSE_MS)
  }, [clearComposerCloseTimer])

  const openCreateComposer = useCallback(() => {
    clearComposerCloseTimer()
    setSavedTransitionRule(null)
    setComposerTarget(null)
    setComposerMode('create')
  }, [clearComposerCloseTimer])

  const openEditComposer = useCallback(
    (rule: CdAlertRule) => {
      clearComposerCloseTimer()
      setComposerTarget(rule)
      setComposerMode('edit')
    },
    [clearComposerCloseTimer],
  )

  useEffect(() => {
    if (composerMode === 'closed') {
      setComposerExpanded(false)
      return
    }
    setComposerExpanded(false)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setComposerExpanded(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [composerMode, composerTarget?.id])

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current != null) window.clearTimeout(highlightTimeoutRef.current)
      clearComposerCloseTimer()
    }
  }, [clearComposerCloseTimer])

  const finishComposerClose = useCallback(
    (ruleId: string | null) => {
      setComposerMode('closed')
      setComposerTarget(null)
      setSavedTransitionRule(null)
      composerCloseTimerRef.current = null
      if (ruleId) {
        requestAnimationFrame(() => {
          document.getElementById(`cd-alert-row-${ruleId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }
    },
    [],
  )

  const handleComposerSave = useCallback(
    (rule: CdAlertRule) => {
      const isCreate = composerMode === 'create'
      onSave(rule)
      clearComposerCloseTimer()
      if (highlightTimeoutRef.current != null) window.clearTimeout(highlightTimeoutRef.current)

      if (isCreate) {
        setSavedTransitionRule(rule)
        setComposerExpanded(true)

        composerCloseTimerRef.current = window.setTimeout(() => {
          setHighlightedAlertId(rule.id)
          if (highlightTimeoutRef.current != null) window.clearTimeout(highlightTimeoutRef.current)
          highlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedAlertId(null)
            highlightTimeoutRef.current = null
          }, 4000)
          finishComposerClose(rule.id)
        }, CD_COMPOSER_HANDOFF_MS)
        return
      }

      setHighlightedAlertId(rule.id)
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedAlertId(null)
        highlightTimeoutRef.current = null
      }, 4000)
      setComposerExpanded(false)
      composerCloseTimerRef.current = window.setTimeout(() => {
        finishComposerClose(null)
      }, CD_COMPOSER_COLLAPSE_MS)
    },
    [composerMode, onSave, clearComposerCloseTimer, finishComposerClose],
  )
  const filtered = useMemo(() => {
    if (chipFilter === 'active') return rules.filter((r) => r.status === 'active')
    if (chipFilter === 'paused') return rules.filter((r) => r.status === 'paused')
    return rules
  }, [rules, chipFilter])

  const counts = useMemo(
    () => ({
      all: rules.length,
      active: rules.filter((r) => r.status === 'active').length,
      paused: rules.filter((r) => r.status === 'paused').length,
    }),
    [rules],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`${CD_TOOLBAR_ROW} flex-col items-stretch gap-3 sm:flex-row sm:items-center`}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Alert status filter">
          {ALERT_CHIP_OPTIONS.map((chip) => {
            const active = chipFilter === chip.id
            const count = counts[chip.id]
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipFilterChange(chip.id)}
                className={portalFilterChipClass(active)}
              >
                {chip.label}
                <span className={`ml-1.5 tabular-nums ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{count}</span>
              </button>
            )
          })}
        </div>
        <button type="button" onClick={openCreateComposer} className={`${CD_TABLE_BTN_PRIMARY} sm:ml-auto`}>
          <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          New alert
        </button>
      </div>

      <div
        ref={listScrollRef}
        className={
          embedded
            ? `min-h-0 flex-1 overflow-y-auto py-4 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${PORTAL_TABLE_SECTION_GUTTER} max-h-[min(58vh,480px)]`
            : `${PORTAL_TABLE_SCROLL_CLASS} py-4 ${PORTAL_TABLE_SECTION_GUTTER}`
        }
      >
        {filtered.length === 0 && composerMode === 'closed' ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-sm text-gray-500">No alerts match this filter.</p>
            <button type="button" onClick={openCreateComposer} className={`${CD_TABLE_BTN_SECONDARY} mt-3`}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New alert
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {composerMode !== 'closed' ? (
              <li className="list-none">
                <div
                  className={`cd-composer-grid grid ${composerExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div
                    className="cd-composer-height min-h-0 overflow-hidden"
                    style={composerBodyHeight != null ? { maxHeight: composerBodyHeight } : undefined}
                  >
                    <div
                      ref={composerContentRef}
                      className={`cd-composer-fade ${savedTransitionRule ? 'pb-0' : 'pb-3'} ${composerExpanded || savedTransitionRule ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {savedTransitionRule ? (
                        <CdAlertListRow rule={savedTransitionRule} highlighted preview />
                      ) : (
                        <CdAlertComposerCard
                          rule={composerMode === 'edit' ? composerTarget : null}
                          onCancel={closeComposer}
                          onSave={handleComposerSave}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ) : null}
            {filtered.map((rule) => {
              const isEditing = composerMode === 'edit' && composerTarget?.id === rule.id
              const isHighlighted = highlightedAlertId === rule.id
              if (isEditing) return null
              if (savedTransitionRule?.id === rule.id) return null
              return (
                <li key={rule.id} className="list-none">
                  <CdAlertListRow
                    rule={rule}
                    highlighted={isHighlighted}
                    animateEnter={false}
                    onEdit={() => openEditComposer(rule)}
                    onDelete={() => onDeleteAlert(rule.id)}
                    onTogglePause={() => onTogglePause(rule.id)}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Alerts fire once when balance drops below your threshold; re-save after recharge to re-arm.
        </p>
      </div>
    </div>
  )
}

function CdBalanceAlertsModal({
  open,
  onClose,
  rules,
  chipFilter,
  onChipFilterChange,
  onSave,
  onTogglePause,
  onDeleteAlert,
}: {
  open: boolean
  onClose: () => void
  rules: CdAlertRule[]
  chipFilter: AlertChipFilter
  onChipFilterChange: (f: AlertChipFilter) => void
  onSave: (rule: CdAlertRule) => void
  onTogglePause: (id: string) => void
  onDeleteAlert: (id: string) => void
}) {
  return (
    <ModalShell
      open={open}
      title="Alerts"
      subtitle="Get notified when your CD wallet drops below a threshold."
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      bodyClassName="flex max-h-[min(85vh,680px)] flex-col overflow-hidden p-0 transition-[max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      <CdAlertsTabPanel
        embedded
        rules={rules}
        chipFilter={chipFilter}
        onChipFilterChange={onChipFilterChange}
        onSave={onSave}
        onTogglePause={onTogglePause}
        onDeleteAlert={onDeleteAlert}
      />
    </ModalShell>
  )
}

function DisputeDetailModal({
  open,
  dispute,
  onClose,
}: {
  open: boolean
  dispute: DisputeRecord | null
  onClose: () => void
}) {
  if (!dispute) return null

  const reasonLabel = dispute.reason ? (DISPUTE_REASON_LABELS[dispute.reason] ?? dispute.reason) : '—'
  const scopeLabel =
    dispute.scope === 'selected_transactions'
      ? 'Selected transactions'
      : dispute.scope === 'period'
        ? 'Date period'
        : dispute.scope === 'general'
          ? 'General'
          : dispute.scope === 'transaction'
            ? 'Single transaction'
            : '—'

  return (
    <ModalShell open={open} title="Dispute details" onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          <Scale className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-gray-900">{dispute.id}</p>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${disputeStatusBadgeClass(dispute.status)}`}
          >
            {dispute.status}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 text-xs">
        <dt className="font-semibold text-gray-500">Linked ref</dt>
        <dd className="font-mono font-medium text-gray-900">{dispute.linkedRef}</dd>
        <dt className="font-semibold text-gray-500">Created</dt>
        <dd className="text-gray-800">{dispute.createdAt}</dd>
        <dt className="font-semibold text-gray-500">Scope</dt>
        <dd className="text-gray-800">{scopeLabel}</dd>
        <dt className="font-semibold text-gray-500">Reason</dt>
        <dd className="text-gray-800">{reasonLabel}</dd>
      </dl>

      {dispute.notes ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Notes</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-700">{dispute.notes}</p>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
        <button type="button" onClick={onClose} className={CD_TABLE_BTN_PRIMARY}>
          Close
        </button>
      </div>
    </ModalShell>
  )
}

function CdProformaEmailModal({
  open,
  invoice,
  onClose,
}: {
  open: boolean
  invoice: ProformaInvoice | null
  onClose: () => void
}) {
  const [email, setEmail] = useState('finance@acme.example')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setSent(false)
      setEmail('finance@acme.example')
    }
  }, [open, invoice?.id])

  if (!invoice) return null

  return (
    <ModalShell open={open} title="Email proforma invoice" onClose={onClose} maxWidthClass="max-w-md">
      <p className="text-sm text-gray-600">
        Send <span className="font-mono font-semibold text-gray-900">{invoice.ref}</span> to a recipient.
      </p>
      <label className="mt-4 block text-xs font-semibold text-gray-600" htmlFor="cd-proforma-email-to">
        Email address
      </label>
      <input
        id="cd-proforma-email-to"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
      />
      {sent ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">Sent (demo) — no email was actually delivered.</p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={CD_TABLE_BTN_SECONDARY}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setSent(true)}
          className={CD_TABLE_BTN_PRIMARY}
        >
          Send (demo)
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  closable = true,
  maxWidthClass = 'max-w-lg',
  bodyClassName = 'max-h-[min(80vh,520px)] overflow-y-auto px-4 py-4',
  headerSlot,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  closable?: boolean
  maxWidthClass?: string
  bodyClassName?: string
  headerSlot?: ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [presented, setPresented] = useState(false)

  useEffect(() => {
    if (!open || !closable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, closable])

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPresented(true))
      })
      return () => cancelAnimationFrame(frame)
    }
    setPresented(false)
    const timer = window.setTimeout(() => setMounted(false), 300)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!mounted) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${presented ? 'opacity-100' : 'opacity-0'}`}
    >
      {closable ? (
        <button
          type="button"
          className={`cd-modal-overlay absolute inset-0 bg-black/40 ${presented ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close modal"
          onClick={onClose}
        />
      ) : (
        <div
          className={`cd-modal-overlay absolute inset-0 bg-black/40 ${presented ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden
        />
      )}
      <div
        className={`cd-modal-panel relative w-full ${maxWidthClass} rounded-xl border border-gray-200 bg-white shadow-xl ${
          presented ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.97] opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {headerSlot ? (
          headerSlot
        ) : (
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="min-w-0">
              <h2 id="modal-title" className="text-sm font-bold text-gray-900">
                {title}
              </h2>
              {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
            </div>
            {closable ? (
              <button type="button" onClick={onClose} className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span className="h-8 w-8 shrink-0" aria-hidden />
            )}
          </div>
        )}
        <div className={`${bodyClassName} transition-[max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}>{children}</div>
      </div>
    </div>
  )
}

function DisputeRaiseFormBody({
  disputeScope,
  setDisputeScope,
  disputeSelectedTxId,
  setDisputeSelectedTxId,
  disputeBulkTxIds,
  disputeDateFrom,
  setDisputeDateFrom,
  disputeDateTo,
  setDisputeDateTo,
  disputeRefPrefill,
  setDisputeRefPrefill,
  disputeReason,
  setDisputeReason,
  disputeNotes,
  setDisputeNotes,
  disputePickOptions,
}: {
  disputeScope: DisputeScope
  setDisputeScope: (s: DisputeScope) => void
  disputeSelectedTxId: string
  setDisputeSelectedTxId: (id: string) => void
  disputeBulkTxIds: string[]
  disputeDateFrom: string
  setDisputeDateFrom: (v: string) => void
  disputeDateTo: string
  setDisputeDateTo: (v: string) => void
  disputeRefPrefill: string | null
  setDisputeRefPrefill: (r: string | null) => void
  disputeReason: string
  setDisputeReason: (v: string) => void
  disputeNotes: string
  setDisputeNotes: (v: string) => void
  disputePickOptions: TransactionRow[]
}) {
  const bulkRows = useMemo(
    () =>
      disputeBulkTxIds
        .map((id) => ALL_TRANSACTIONS.find((r) => r.id === id))
        .filter((r): r is TransactionRow => r != null),
    [disputeBulkTxIds],
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Report an issue with a movement or a period. Demo only—no case is created.</p>
      {disputeScope === 'selected_transactions' ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2.5">
          <p className="text-xs font-semibold text-indigo-900">
            Selected transactions ({bulkRows.length})
          </p>
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs text-gray-700">
            {bulkRows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-indigo-100/80 pb-1.5 last:border-0 last:pb-0">
                <span className="min-w-0 font-medium text-gray-900">{r.description}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
                  {formatDateTime(r.at)} · {r.referenceId ?? 'no ref'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
      <fieldset className="space-y-2">
        <legend className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Scope</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {(
            [
              { id: 'transaction' as const, label: 'Single transaction' },
              { id: 'period' as const, label: 'Date range' },
              { id: 'general' as const, label: 'General' },
            ] as const
          ).map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="dispute-scope-modal"
                className="accent-indigo-600"
                checked={disputeScope === o.id}
                onChange={() => {
                  setDisputeScope(o.id)
                  if (o.id === 'transaction' && !disputeSelectedTxId) {
                    const first = disputePickOptions[0]
                    if (first) setDisputeSelectedTxId(first.id)
                  }
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      )}
      {disputeScope === 'transaction' ? (
        <div>
          <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-tx-pick-m">
            Transaction
          </label>
          <select
            id="dispute-tx-pick-m"
            value={disputeSelectedTxId}
            onChange={(e) => {
              const id = e.target.value
              setDisputeSelectedTxId(id)
              const row = ALL_TRANSACTIONS.find((r) => r.id === id)
              setDisputeRefPrefill(row?.referenceId ?? null)
            }}
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
          >
            <option value="">Select a transaction</option>
            {disputePickOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {formatDateTime(r.at)} — {r.description.length > 48 ? `${r.description.slice(0, 48)}…` : r.description} ({r.referenceId ?? 'no ref'})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {disputeScope === 'period' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-df-m">
              From
            </label>
            <input
              id="dispute-df-m"
              type="date"
              value={disputeDateFrom}
              onChange={(e) => setDisputeDateFrom(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-dt-m">
              To
            </label>
            <input
              id="dispute-dt-m"
              type="date"
              value={disputeDateTo}
              onChange={(e) => setDisputeDateTo(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      ) : null}
      {disputeScope === 'general' ? (
        <p className="text-xs text-gray-500">Describe the issue below. We will route it without tie-in to a single ledger line.</p>
      ) : null}
      {disputeScope !== 'transaction' ? (
        <div>
          <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-ref-opt-m">
            Reference (optional)
          </label>
          <input
            id="dispute-ref-opt-m"
            value={disputeRefPrefill ?? ''}
            onChange={(e) => setDisputeRefPrefill(e.target.value || null)}
            placeholder="e.g. batch or invoice ID"
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 font-mono text-sm"
          />
        </div>
      ) : null}
      <div>
        <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-reason-sel-m">
          Reason
        </label>
        <select
          id="dispute-reason-sel-m"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
        >
          <option value="amount_mismatch">Amount mismatch</option>
          <option value="duplicate">Duplicate posting</option>
          <option value="timing">Settlement timing</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600" htmlFor="dispute-notes-ta-m">
          Notes
        </label>
        <textarea
          id="dispute-notes-ta-m"
          value={disputeNotes}
          onChange={(e) => setDisputeNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
          placeholder="Include any context…"
        />
      </div>
    </div>
  )
}

// —— Main page ——————————————————————————————————————————————————————————

export default function CdBalanceEnterprise() {
  const { resolveInboxItemsForModule } = useAlerts()
  const { selectedEntity } = useEntity()
  const { getRulesByModule, saveRule, toggleRulePause, deleteRule } = useAlerts()
  const billingEntityLabel = selectedEntity?.label ?? CD_PROFORMA_EMPLOYER.legalName
  const [rechargePanelOpen, setRechargePanelOpen] = useState(false)
  const [rechargePhase, setRechargePhase] = useState<RechargePhase>('form')
  const [rechargeProgress, setRechargeProgress] = useState(0)
  const [proformaAmountInr, setProformaAmountInr] = useState('')
  const [proformaAmountError, setProformaAmountError] = useState('')
  const [lastGeneratedProforma, setLastGeneratedProforma] = useState<{ id: string; ref: string; amount: number } | null>(
    null,
  )
  const proformaPdfCache = useRef<Map<string, Uint8Array>>(new Map())
  const proformaGenTimers = useRef<number[]>([])
  const [disputesList, setDisputesList] = useState<DisputeRecord[]>(() => [...INITIAL_MOCK_DISPUTES])
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeScope, setDisputeScope] = useState<DisputeScope>('transaction')
  const [disputeSelectedTxId, setDisputeSelectedTxId] = useState('')
  const [disputeBulkTxIds, setDisputeBulkTxIds] = useState<string[]>([])
  const [disputeDateFrom, setDisputeDateFrom] = useState('')
  const [disputeDateTo, setDisputeDateTo] = useState('')
  const [disputeRefPrefill, setDisputeRefPrefill] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState<DateRangePreset>('monthly')
  const [txDateFrom, setTxDateFrom] = useState('')
  const [txDateTo, setTxDateTo] = useState('')
  const [activitySubTab, setActivitySubTab] = useState<ActivitySubTab>('transactions')
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null)
  const [endorsementSummaryTx, setEndorsementSummaryTx] = useState<TransactionRow | null>(null)
  const [depositDetailTx, setDepositDetailTx] = useState<TransactionRow | null>(null)
  const [proformaEmailTarget, setProformaEmailTarget] = useState<ProformaInvoice | null>(null)
  const [proformaList, setProformaList] = useState<ProformaInvoice[]>(() => [...INITIAL_PROFORMA_INVOICES])
  const [page, setPage] = useState(1)
  const pageSize = 18

  const [alertChipFilter, setAlertChipFilter] = useState<AlertChipFilter>('all')
  const [alertsModalOpen, setAlertsModalOpen] = useState(false)
  const pageVersion = 'v3' as const

  const activityTabs = useMemo(() => {
    const tabs: { id: ActivitySubTab; label: string }[] = [
      { id: 'transactions', label: 'Transaction history' },
      { id: 'proforma', label: 'Proforma invoices' },
    ]
    if (pageVersion === 'v1') {
      tabs.push({ id: 'disputes', label: 'Disputes' })
    }
    return tabs
  }, [pageVersion])

  useEffect(() => {
    if (isCdCompactExperience(pageVersion) && activitySubTab === 'disputes') {
      setActivitySubTab('transactions')
    }
  }, [pageVersion, activitySubTab])

  const cdAlertRules = useMemo<CdAlertRule[]>(
    () =>
      getRulesByModule('cd_balance').map((r) => ({
        id: r.id,
        title: r.title,
        thresholdInr: r.thresholdInr ?? 0,
        channels: r.channels as AlertChannel[],
        status: r.status as AlertStatus,
      })),
    [getRulesByModule],
  )

  const [disputeReason, setDisputeReason] = useState('amount_mismatch')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [proformaViewer, setProformaViewer] = useState<{ pi: ProformaInvoice; url: string } | null>(null)
  const [disputeDetailTarget, setDisputeDetailTarget] = useState<DisputeRecord | null>(null)
  const proformaViewerUrlRef = useRef<string | null>(null)

  const filtered = useMemo(() => {
    return ALL_TRANSACTIONS.filter((r) => {
      if (!transactionInDateRange(r.at, dateRange)) return false
      const txDay = r.at.slice(0, 10)
      if (txDateFrom && txDay < txDateFrom) return false
      if (txDateTo && txDay > txDateTo) return false
      return true
    })
  }, [dateRange, txDateFrom, txDateTo])

  const totalFiltered = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const pageSafe = Math.min(page, pageCount)
  const sliceStart = (pageSafe - 1) * pageSize
  const pageRows = filtered.slice(sliceStart, sliceStart + pageSize)

  const disputePickOptions = useMemo(() => ALL_TRANSACTIONS.slice(0, 80), [])

  useEffect(() => {
    setPage(1)
  }, [dateRange, txDateFrom, txDateTo, activitySubTab])

  useEffect(() => {
    return () => {
      proformaGenTimers.current.forEach((t) => window.clearTimeout(t))
      if (proformaViewerUrlRef.current) {
        URL.revokeObjectURL(proformaViewerUrlRef.current)
      }
    }
  }, [])

  const ensureProformaBytes = useCallback(async (pi: ProformaInvoice): Promise<Uint8Array> => {
    let bytes = proformaPdfCache.current.get(pi.id)
    if (!bytes) {
      bytes = await generateCdProformaPdf({
        invoiceRef: pi.ref,
        amountInr: pi.amount,
        requestedAt: new Date(pi.requestedAt),
        employerName: pi.employerName,
        gstin: CD_PROFORMA_EMPLOYER.gstin,
      })
      proformaPdfCache.current.set(pi.id, bytes)
    }
    return bytes
  }, [])

  const closeProformaViewer = useCallback(() => {
    if (proformaViewerUrlRef.current) {
      URL.revokeObjectURL(proformaViewerUrlRef.current)
      proformaViewerUrlRef.current = null
    }
    setProformaViewer(null)
  }, [])

  const viewProforma = useCallback(
    async (pi: ProformaInvoice) => {
      closeProformaViewer()
      setProformaViewer({ pi, url: '' })
      try {
        const bytes = await ensureProformaBytes(pi)
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
        proformaViewerUrlRef.current = url
        setProformaViewer({ pi, url })
      } catch {
        closeProformaViewer()
        window.alert('Could not open the proforma PDF. Try downloading instead.')
      }
    },
    [closeProformaViewer, ensureProformaBytes],
  )

  const resetRechargeForm = useCallback(() => {
    setProformaAmountInr('')
    setProformaAmountError('')
    setRechargePhase('form')
    setRechargeProgress(0)
    setLastGeneratedProforma(null)
  }, [])

  const closeRechargePanel = useCallback(() => {
    setRechargePanelOpen(false)
    resetRechargeForm()
  }, [resetRechargeForm])

  const openRechargePanel = useCallback(() => {
    resetRechargeForm()
    setRechargePanelOpen(true)
  }, [resetRechargeForm])

  const downloadProformaById = useCallback(
    async (pi: ProformaInvoice) => {
      const bytes = await ensureProformaBytes(pi)
      downloadProformaPdfBytes(bytes, proformaDownloadFilename(pi.employerName, pi.ref))
    },
    [ensureProformaBytes],
  )

  const downloadLastGenerated = useCallback(() => {
    if (!lastGeneratedProforma) return
    const cached = proformaPdfCache.current.get(lastGeneratedProforma.id)
    if (cached) {
      downloadProformaPdfBytes(
        cached,
        proformaDownloadFilename(billingEntityLabel, lastGeneratedProforma.ref),
      )
      return
    }
    void downloadProformaById({
      id: lastGeneratedProforma.id,
      ref: lastGeneratedProforma.ref,
      requestedAt: new Date().toISOString(),
      amount: lastGeneratedProforma.amount,
      status: 'generated',
      employerName: billingEntityLabel,
    })
  }, [lastGeneratedProforma, downloadProformaById, billingEntityLabel])

  const viewLastGeneratedProforma = useCallback(() => {
    if (!lastGeneratedProforma) return
    void viewProforma({
      id: lastGeneratedProforma.id,
      ref: lastGeneratedProforma.ref,
      requestedAt: new Date().toISOString(),
      amount: lastGeneratedProforma.amount,
      status: 'generated',
      employerName: billingEntityLabel,
    })
  }, [lastGeneratedProforma, viewProforma, billingEntityLabel])

  const toggleTxExpanded = useCallback((id: string) => {
    setExpandedTxId((prev) => (prev === id ? null : id))
  }, [])

  const handleTxRowClick = useCallback(
    (tx: TransactionRow) => {
      if (tx.expandable) toggleTxExpanded(tx.id)
    },
    [toggleTxExpanded],
  )

  const openEndorsementSummary = useCallback((tx: TransactionRow) => {
    setEndorsementSummaryTx(tx)
  }, [])

  const openDepositDetail = useCallback((tx: TransactionRow) => {
    setDepositDetailTx(tx)
  }, [])

  const activeAlertCount = useMemo(
    () => cdAlertRules.filter((r) => r.status === 'active').length,
    [cdAlertRules],
  )

  const toggleAlertPause = useCallback(
    (id: string) => {
      toggleRulePause(id)
    },
    [toggleRulePause],
  )

  const deleteAlert = useCallback(
    (id: string) => {
      deleteRule(id)
    },
    [deleteRule],
  )

  const saveAlertRule = useCallback(
    (rule: CdAlertRule) => {
      const existing = getRulesByModule('cd_balance').find((r) => r.id === rule.id)
      saveRule({
        id: rule.id,
        module: 'cd_balance',
        title: rule.title,
        description: existing?.description ?? '',
        thresholdInr: rule.thresholdInr,
        channels: rule.channels,
        status: rule.status,
        severity: existing?.severity ?? 'warning',
        lastTriggeredAt: existing?.lastTriggeredAt ?? null,
      })
    },
    [saveRule, getRulesByModule],
  )

  const openRaiseDispute = useCallback((ref: string | null) => {
    setDisputeBulkTxIds([])
    setDisputeRefPrefill(ref)
    if (ref) {
      const match = ALL_TRANSACTIONS.find((r) => r.referenceId === ref)
      if (match) {
        setDisputeScope('transaction')
        setDisputeSelectedTxId(match.id)
      } else {
        setDisputeScope('transaction')
        setDisputeSelectedTxId('')
      }
    } else {
      setDisputeScope('transaction')
      setDisputeSelectedTxId('')
    }
    setDisputeModalOpen(true)
  }, [])

  const submitProformaRequest = useCallback(
    (amountInr: number) => {
      const n = Math.floor(1000 + Math.random() * 8999)
      const id = `pi-${Date.now()}`
      const ref = `ACKO/PI/2026/${n}`
      const requestedAt = new Date().toISOString()
      const row: ProformaInvoice = {
        id,
        ref,
        requestedAt,
        amount: amountInr,
        status: 'generated',
        employerName: billingEntityLabel,
      }

      setRechargePhase('generating')
      setRechargeProgress(0)
      proformaGenTimers.current.forEach((t) => window.clearTimeout(t))
      proformaGenTimers.current = []

      let step = 0
      const tick = () => {
        step += 1
        const pct = Math.min(100, Math.round((step / PROFORMA_PDF_STEPS) * 100))
        if (step < PROFORMA_PDF_STEPS) {
          setRechargeProgress(pct)
          proformaGenTimers.current.push(window.setTimeout(tick, PROFORMA_PDF_STEP_MS))
        } else {
          void (async () => {
            try {
              const bytes = await generateCdProformaPdf({
                invoiceRef: ref,
                amountInr,
                requestedAt: new Date(requestedAt),
                employerName: billingEntityLabel,
                gstin: CD_PROFORMA_EMPLOYER.gstin,
              })
              proformaPdfCache.current.set(id, bytes)
              setProformaList((prev) => [row, ...prev])
              setLastGeneratedProforma({ id, ref, amount: amountInr })
              resolveInboxItemsForModule('cd_balance')
              setRechargeProgress(100)
              setRechargePhase('ready')
              setActivitySubTab('proforma')
            } catch {
              setProformaAmountError('Could not generate the proforma PDF. Try again.')
              setRechargePhase('form')
              setRechargeProgress(0)
            }
          })()
        }
      }
      proformaGenTimers.current.push(window.setTimeout(tick, PROFORMA_PDF_STEP_MS))
    },
    [billingEntityLabel],
  )

  const handleGenerateProforma = useCallback(() => {
    const raw = proformaAmountInr.replace(/,/g, '').trim()
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) {
      setProformaAmountError('Enter a valid amount in INR (greater than zero).')
      return
    }
    setProformaAmountError('')
    submitProformaRequest(Math.round(n))
  }, [proformaAmountInr, submitProformaRequest])

  const submitDisputeDemo = useCallback(() => {
    if (disputeScope === 'selected_transactions') {
      const rows = disputeBulkTxIds
        .map((id) => ALL_TRANSACTIONS.find((r) => r.id === id))
        .filter((r): r is TransactionRow => r != null)
      const newRows: DisputeRecord[] = rows.map((row, i) => {
        const n = 700 + Math.floor(Math.random() * 8999) + i
        return {
          id: `DSP-${n}`,
          linkedRef: row.referenceId ?? '—',
          createdAt: new Date().toISOString().slice(0, 10),
          status: 'Submitted',
          reason: disputeReason,
          notes: disputeNotes.trim() || undefined,
          scope: disputeScope,
        }
      })
      setDisputesList((prev) => [...newRows, ...prev])
      setDisputeBulkTxIds([])
      setDisputeModalOpen(false)
      setActivitySubTab('disputes')
      return
    }
    const linked =
      disputeScope === 'transaction'
        ? ALL_TRANSACTIONS.find((r) => r.id === disputeSelectedTxId)?.referenceId ?? disputeRefPrefill ?? '—'
        : (disputeRefPrefill ?? '—')
    const n = 700 + Math.floor(Math.random() * 8999)
    const newRow: DisputeRecord = {
      id: `DSP-${n}`,
      linkedRef: linked,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'Submitted',
      reason: disputeReason,
      notes: disputeNotes.trim() || undefined,
      scope: disputeScope,
    }
    setDisputesList((prev) => [newRow, ...prev])
    setDisputeBulkTxIds([])
    setDisputeModalOpen(false)
    setActivitySubTab('disputes')
  }, [disputeRefPrefill, disputeScope, disputeSelectedTxId, disputeBulkTxIds, disputeReason, disputeNotes])

  const copyRef = useCallback(async (ref: string | null) => {
    if (!ref) return
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }, [])

  const summaryLeft =
    totalFiltered === 0
      ? 'No results'
      : `Showing ${sliceStart + 1}–${sliceStart + pageRows.length} of ${totalFiltered}`

  const downloadStatement = useCallback(() => {
    const blob = new Blob(['CD statement'], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cd-statement.txt'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [])

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-50 px-6 py-6 text-left lg:px-8">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="-mb-1">
          <PageHeader
            title="CD Balance"
            subtitle="Cash deposit wallet for premiums and endorsements"
            breadcrumbs={[]}
          />
        </div>

        <CdMetricsSection
          pageVersion={pageVersion}
          balance={MOCK_METRICS.balance}
          monthlyBurn={MOCK_METRICS.monthlyBurn}
          runwayDays={cdRunwayDays(MOCK_METRICS.balance, MOCK_METRICS.monthlyBurn) ?? 0}
          onRaiseProforma={openRechargePanel}
          onViewProformaList={() => setActivitySubTab('proforma')}
        />

        <CdRechargeModal
          open={rechargePanelOpen}
          phase={rechargePhase}
          progress={rechargeProgress}
          amountInr={proformaAmountInr}
          amountError={proformaAmountError}
          lastGenerated={lastGeneratedProforma ? { ref: lastGeneratedProforma.ref, amount: lastGeneratedProforma.amount } : null}
          onAmountChange={(value) => {
            setProformaAmountInr(value)
            if (proformaAmountError) setProformaAmountError('')
          }}
          onClose={closeRechargePanel}
          onSubmit={handleGenerateProforma}
          onDownload={downloadLastGenerated}
          onViewProforma={viewLastGeneratedProforma}
          onViewProformaList={() => {
            closeRechargePanel()
            setActivitySubTab('proforma')
          }}
          billingEntityLabel={billingEntityLabel}
        />

        <ProformaViewerModal
          open={proformaViewer != null}
          invoiceRef={proformaViewer?.pi.ref ?? ''}
          pdfUrl={proformaViewer?.url || null}
          onClose={closeProformaViewer}
          onDownload={() => {
            if (proformaViewer?.pi) void downloadProformaById(proformaViewer.pi)
          }}
          onEmail={() => {
            if (proformaViewer?.pi) setProformaEmailTarget(proformaViewer.pi)
          }}
        />

        {pageVersion === 'v1' ? (
          <>
            <DisputeDetailModal
              open={disputeDetailTarget != null}
              dispute={disputeDetailTarget}
              onClose={() => setDisputeDetailTarget(null)}
            />

            <ModalShell
              open={disputeModalOpen}
              title={disputeScope === 'selected_transactions' ? `Raise dispute (${disputeBulkTxIds.length})` : 'Raise a dispute'}
              onClose={() => {
                setDisputeModalOpen(false)
                setDisputeBulkTxIds([])
              }}
            >
              <DisputeRaiseFormBody
                disputeScope={disputeScope}
                setDisputeScope={setDisputeScope}
                disputeSelectedTxId={disputeSelectedTxId}
                setDisputeSelectedTxId={setDisputeSelectedTxId}
                disputeBulkTxIds={disputeBulkTxIds}
                disputeDateFrom={disputeDateFrom}
                setDisputeDateFrom={setDisputeDateFrom}
                disputeDateTo={disputeDateTo}
                setDisputeDateTo={setDisputeDateTo}
                disputeRefPrefill={disputeRefPrefill}
                setDisputeRefPrefill={setDisputeRefPrefill}
                disputeReason={disputeReason}
                setDisputeReason={setDisputeReason}
                disputeNotes={disputeNotes}
                setDisputeNotes={setDisputeNotes}
                disputePickOptions={disputePickOptions}
              />
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  onClick={() => setDisputeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={submitDisputeDemo}
                >
                  Submit (demo)
                </button>
              </div>
            </ModalShell>

            <CdBalanceAlertsModal
              open={alertsModalOpen}
              onClose={() => setAlertsModalOpen(false)}
              rules={cdAlertRules}
              chipFilter={alertChipFilter}
              onChipFilterChange={setAlertChipFilter}
              onSave={saveAlertRule}
              onTogglePause={toggleAlertPause}
              onDeleteAlert={deleteAlert}
            />
          </>
        ) : null}

        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
          aria-label="CD wallet activity"
        >
          <div className={`relative flex shrink-0 border-b border-gray-200 pt-3 ${PORTAL_TABLE_SECTION_GUTTER}`}>
            <div
              className="flex min-w-0 flex-wrap gap-4 sm:gap-6"
              role="tablist"
              aria-label="Wallet activity views"
            >
                {activityTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activitySubTab === t.id}
                    id={`cd-tab-${t.id}`}
                    onClick={() => setActivitySubTab(t.id)}
                    className={`-mb-px inline-flex cursor-pointer items-center border-b-2 pb-2.5 pt-0.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                      activitySubTab === t.id
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>
          </div>

          <div className={CD_ACTIVITY_TOOLBAR_SLOT}>
            {activitySubTab === 'transactions' ? (
              <div className={`${CD_ACTIVITY_TOOLBAR_INNER} flex-wrap items-center justify-between gap-2`}>
                <p className="text-sm text-gray-500">Deposits and deductions from your CD wallet.</p>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto sm:[scrollbar-width:none]">
                  <CdDateRangePicker
                    from={txDateFrom}
                    to={txDateTo}
                    onFromChange={(value) => {
                      setTxDateFrom(value)
                      setPage(1)
                    }}
                    onToChange={(value) => {
                      setTxDateTo(value)
                      setPage(1)
                    }}
                  />
                  <select
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value as DateRangePreset)
                      setPage(1)
                    }}
                    className="h-8 min-w-[8.5rem] shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-transparent px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-colors hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    aria-label="View filter"
                  >
                    {(Object.keys(DATE_RANGE_LABELS) as DateRangePreset[]).map((id) => (
                      <option key={id} value={id}>
                        {DATE_RANGE_LABELS[id]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : activitySubTab === 'proforma' ? (
              <div className={CD_ACTIVITY_TOOLBAR_INNER}>
                <p className="text-sm text-gray-500">Proforma invoices for CD wallet top-ups.</p>
              </div>
            ) : pageVersion === 'v1' ? (
              <div className={`${CD_ACTIVITY_TOOLBAR_INNER} min-w-0 justify-between gap-3`}>
                <p className="text-sm text-gray-500">Open disputes on CD wallet movements.</p>
                <CdRaiseDisputeCta mode="manual" selectedCount={0} onClick={() => openRaiseDispute(null)} />
              </div>
            ) : null}
          </div>

          {activitySubTab === 'transactions' ? (
          <>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={PORTAL_TABLE_SCROLL_CLASS}>
            <table className={`${PORTAL_TABLE_CLASS} text-left text-sm`}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead className="sticky top-0 z-[1]">
                <tr className={PORTAL_TABLE_THEAD_TR_CLASS}>
                  <th className={CD_TX_ID_HEAD}>Transaction ID</th>
                  <th className={`${CD_TX_DATA_HEAD} min-w-0`}>Description</th>
                  <th className={`${CD_TX_DATA_HEAD} text-right`}>Amount</th>
                  <th className={`${CD_TX_DATA_HEAD} text-right`}>Balance</th>
                  <th className={`${CD_TX_DATA_HEAD} ${PORTAL_TABLE_HEAD_EDGE_PR}`}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${PORTAL_TABLE_EDGE_PL} ${PORTAL_TABLE_EDGE_PR} py-14 text-center align-middle`}>
                      <p className="text-sm font-normal text-gray-500">No transactions match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const isExpanded = expandedTxId === row.id
                    const deposit = row.depositDetails
                    return (
                    <Fragment key={row.id}>
                    <tr
                      className={`text-gray-800 transition-colors${row.expandable ? ' cursor-pointer hover:bg-gray-50/50' : ''}${isExpanded ? ' bg-indigo-50/20' : ''}`}
                      onClick={() => handleTxRowClick(row)}
                    >
                      <td className={`whitespace-nowrap ${CD_TX_ID_CELL}`}>
                        <div className={CD_TX_ID_INNER}>
                          {row.expandable ? (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-indigo-700"
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleTxExpanded(row.id)
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" aria-hidden />
                              ) : (
                                <ChevronDown className="h-4 w-4" aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
                          )}
                          <span className="min-w-0 truncate font-mono text-xs font-medium text-gray-900">
                            {row.transactionId}
                          </span>
                        </div>
                      </td>
                      <td className={`min-w-0 max-w-0 align-middle ${CD_TX_DATA_CELL}`}>
                        <span className="block text-xs font-semibold text-gray-900">{row.typeLabel}</span>
                        <span className="line-clamp-2 text-xs font-normal text-gray-600" title={row.description}>
                          {row.description}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap align-middle text-right text-xs ${CD_TX_DATA_CELL}`}>
                        <span
                          className={`block font-semibold tabular-nums ${
                            row.amount < 0 ? 'text-rose-600' : row.amount > 0 ? 'text-emerald-600' : 'text-gray-800'
                          }`}
                        >
                          {formatInrSigned(row.amount)}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap align-middle text-right text-xs text-gray-600 ${CD_TX_DATA_CELL}`}>
                        <span className="block font-normal tabular-nums">{formatInr(row.balanceAfter, false)}</span>
                      </td>
                      <td className={`whitespace-nowrap align-middle text-xs text-gray-800 ${PORTAL_TABLE_CELL_EDGE_PR} ${CD_TX_DATA_CELL}`}>
                        {formatDateOnly(row.at)}
                      </td>
                    </tr>
                    {isExpanded && row.expandable ? (
                      <tr className="bg-gray-50/80">
                        <td colSpan={5} className={`align-top py-0 ${PORTAL_TABLE_EDGE_PL} ${PORTAL_TABLE_EDGE_PR}`}>
                          {row.category === 'endorsement' ? (
                            <TxEndorsementNestedRow
                              row={row}
                              onViewDetails={() => openEndorsementSummary(row)}
                            />
                          ) : deposit ? (
                            <TxDepositNestedRow
                              row={row}
                              deposit={deposit}
                              onView={() => openDepositDetail(row)}
                            />
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
          </>
          ) : activitySubTab === 'proforma' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={PORTAL_TABLE_SCROLL_CLASS}>
              <table className={`${PORTAL_TABLE_CLASS} text-left text-sm`}>
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[7.5rem]" />
                </colgroup>
                <thead className="sticky top-0 z-[1]">
                  <tr className={PORTAL_TABLE_THEAD_TR_CLASS}>
                    <th className={`${PORTAL_TABLE_TH_CLASS} ${PORTAL_TABLE_HEAD_EDGE_PL}`}>Invoice number</th>
                    <th className={PORTAL_TABLE_TH_CLASS}>Date</th>
                    <th className={`${PORTAL_TABLE_TH_CLASS} text-right`}>Amount</th>
                    <th className={`${PORTAL_TABLE_TH_CLASS} text-right`}>Total (incl. GST)</th>
                    <th className={PORTAL_TABLE_TH_CLASS}>Status</th>
                    <th className={`${PORTAL_TABLE_TH_CLASS} text-right ${PORTAL_TABLE_HEAD_EDGE_PR}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proformaList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`${PORTAL_TABLE_EDGE_PL} ${PORTAL_TABLE_EDGE_PR} py-14 text-center align-middle`}>
                        <p className="text-sm text-gray-500">No proforma invoices yet.</p>
                      </td>
                    </tr>
                  ) : (
                    proformaList.map((pi) => (
                      <tr key={pi.id} className="text-gray-800 hover:bg-gray-50/50">
                        <td className={`font-mono text-xs font-medium text-gray-900 ${PORTAL_TABLE_CELL_EDGE_PL} py-3`}>{pi.ref}</td>
                        <td className={`text-xs text-gray-600 ${CD_TABLE_CELL_COMFORT}`}>{formatDateOnly(pi.requestedAt)}</td>
                        <td className={`text-right text-xs font-semibold tabular-nums text-gray-900 ${CD_TABLE_CELL_COMFORT}`}>
                          {formatInr(pi.amount, false)}
                        </td>
                        <td className={`text-right text-xs tabular-nums text-gray-700 ${CD_TABLE_CELL_COMFORT}`}>
                          {formatInr(pi.amount, false)}
                        </td>
                        <td className={CD_TABLE_CELL_COMFORT}>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${proformaStatusClass(pi.status)}`}
                          >
                            {proformaStatusLabel(pi.status)}
                          </span>
                        </td>
                        <td className={`whitespace-nowrap text-right ${PORTAL_TABLE_CELL_EDGE_PR} py-3`}>
                          {pi.status === 'expired' ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                              <button
                                type="button"
                                className={CD_TABLE_VIEW_BTN}
                                aria-label={`View proforma ${pi.ref}`}
                                onClick={() => void viewProforma(pi)}
                              >
                                <Eye size={11} className="shrink-0" aria-hidden />
                                View
                              </button>
                              <button
                                type="button"
                                className={CD_TABLE_ROW_ICON_BTN}
                                aria-label={`Email proforma ${pi.ref}`}
                                title="Email"
                                onClick={() => setProformaEmailTarget(pi)}
                              >
                                <Mail className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                              </button>
                              <button
                                type="button"
                                className={CD_TABLE_ROW_ICON_BTN}
                                aria-label={`Download proforma ${pi.ref}`}
                                title="Download"
                                onClick={() => void downloadProformaById(pi)}
                              >
                                <Download className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          ) : pageVersion === 'v1' && activitySubTab === 'disputes' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={PORTAL_TABLE_SCROLL_CLASS}>
              <table className={`${PORTAL_TABLE_CLASS} text-left text-sm`}>
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[7.5rem]" />
                </colgroup>
                <thead className="sticky top-0 z-[1]">
                  <tr className={PORTAL_TABLE_THEAD_TR_CLASS}>
                    <th className={`${PORTAL_TABLE_TH_CLASS} ${PORTAL_TABLE_HEAD_EDGE_PL}`}>Dispute ID</th>
                    <th className={PORTAL_TABLE_TH_CLASS}>Linked ref</th>
                    <th className={PORTAL_TABLE_TH_CLASS}>Created</th>
                    <th className={PORTAL_TABLE_TH_CLASS}>Status</th>
                    <th className={`${PORTAL_TABLE_TH_CLASS} text-right ${PORTAL_TABLE_HEAD_EDGE_PR}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {disputesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`${PORTAL_TABLE_EDGE_PL} ${PORTAL_TABLE_EDGE_PR} py-14 text-center text-sm text-gray-500`}>
                        No disputes yet. Use Raise dispute on the right to open one.
                      </td>
                    </tr>
                  ) : (
                    disputesList.map((d) => (
                      <tr key={d.id} className="text-gray-800 hover:bg-gray-50/50">
                        <td className={`font-mono text-xs font-medium text-gray-900 ${PORTAL_TABLE_CELL_EDGE_PL} py-3`}>{d.id}</td>
                        <td className={`font-mono text-xs text-gray-700 ${CD_TABLE_CELL_COMFORT}`}>{d.linkedRef}</td>
                        <td className={`text-xs text-gray-600 ${CD_TABLE_CELL_COMFORT}`}>{d.createdAt}</td>
                        <td className={`text-xs text-gray-800 ${CD_TABLE_CELL_COMFORT}`}>{d.status}</td>
                        <td className={`whitespace-nowrap text-right ${PORTAL_TABLE_CELL_EDGE_PR} py-3`}>
                          <button
                            type="button"
                            className={CD_TABLE_ROW_ICON_BTN}
                            aria-label={`View dispute ${d.id}`}
                            title="View"
                            onClick={() => setDisputeDetailTarget(d)}
                          >
                            <Eye className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}

          {activitySubTab === 'transactions' ? (
          <CdTablePagination
            currentPage={pageSafe}
            pageCount={pageCount}
            totalItems={totalFiltered}
            summary={summaryLeft}
            onPageChange={setPage}
          />
          ) : null}
        </section>
      </div>

      <CdEndorsementDetailsModal
        open={endorsementSummaryTx != null}
        tx={endorsementSummaryTx}
        onClose={() => setEndorsementSummaryTx(null)}
      />

      <CdDepositDetailsModal
        open={depositDetailTx != null}
        tx={depositDetailTx}
        onClose={() => setDepositDetailTx(null)}
      />

      <CdProformaEmailModal
        open={proformaEmailTarget != null}
        invoice={proformaEmailTarget}
        onClose={() => setProformaEmailTarget(null)}
      />

      {copied ? (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 shadow-md">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Copied to clipboard
        </div>
      ) : null}
    </div>
  )
}
