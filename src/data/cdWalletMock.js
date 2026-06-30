/**
 * Single source for CD wallet mock data (Quick Add, CD Balance page, dashboard alignment).
 * Replace with API in production.
 */

export const CD_CURRENT_BALANCE_RUPEES = 48_50_000

export const CD_THRESHOLDS = {
  minimum: 5_00_000,
  buffer: 7_50_000,
}

/** Monthly burn estimate for runway (illustrative). */
export const CD_MONTHLY_BURN_RUPEES = 11_20_000

/** ISO timestamp — balance / ledger freshness for trust UI (mock). */
export const CD_BALANCE_AS_OF_ISO = '2026-03-30T14:30:00+05:30'

/** Shown next to “as of” (mock data source). */
export const CD_BALANCE_SOURCE_LABEL = 'Policy billing sync (demo)'

/**
 * Last point must equal `CD_CURRENT_BALANCE_RUPEES` so dashboard + CD page match.
 * @type {{ labels: string[], values: number[] }}
 */
export const cdBalanceTrend = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  values: [58_20_000, 56_10_000, 54_40_000, 52_80_000, 50_60_000, CD_CURRENT_BALANCE_RUPEES],
}

/**
 * Typical GMC vs GPA *ratio* (same numbers as monthly premium for continuity across screens).
 * On CD Balance (enterprise), this ratio is applied to **current CD balance** to show illustrative
 * apportionment — not the next invoice amount. See `CdBalance.jsx` for next-cycle copy.
 */
export const CD_PREMIUM_SPLIT = {
  periodLabel: 'Next billing cycle (est.)',
  gmcPremiumMonthly: 8_40_000,
  gpaPremiumMonthly: 2_80_000,
}

/** sessionStorage key — set from endorsement preview before navigating to CD balance. */
export const CD_DRAFT_IMPACT_STORAGE_KEY = 'mlp_cd_draft_impact_v1'

/**
 * @typedef {{ projectedBalanceAfter: number, estimatedDraw: number, sourceLabel: string, at: string }} CdDraftImpactPayload
 */

/** @returns {CdDraftImpactPayload | null} */
export function readCdDraftImpact() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CD_DRAFT_IMPACT_STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (
      typeof o?.projectedBalanceAfter !== 'number' ||
      typeof o?.estimatedDraw !== 'number' ||
      typeof o?.sourceLabel !== 'string'
    ) {
      return null
    }
    return {
      projectedBalanceAfter: o.projectedBalanceAfter,
      estimatedDraw: o.estimatedDraw,
      sourceLabel: o.sourceLabel,
      at: typeof o.at === 'string' ? o.at : '',
    }
  } catch {
    return null
  }
}

export function writeCdDraftImpact(payload) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(CD_DRAFT_IMPACT_STORAGE_KEY, JSON.stringify(payload))
}

export function clearCdDraftImpact() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(CD_DRAFT_IMPACT_STORAGE_KEY)
}

export function cdRunwayWeeks(balance = CD_CURRENT_BALANCE_RUPEES, monthlyBurn = CD_MONTHLY_BURN_RUPEES) {
  if (!monthlyBurn || monthlyBurn <= 0) return null
  const weeks = (balance / monthlyBurn) * 4.33
  return Math.max(0, Math.floor(weeks))
}

/** Full months of runway at current burn (floor). */
export function cdRunwayMonths(balance = CD_CURRENT_BALANCE_RUPEES, monthlyBurn = CD_MONTHLY_BURN_RUPEES) {
  if (!monthlyBurn || monthlyBurn <= 0) return null
  return Math.max(0, Math.floor(balance / monthlyBurn))
}

/** Exact days of runway at current burn (rounded). */
export function cdRunwayDays(balance = CD_CURRENT_BALANCE_RUPEES, monthlyBurn = CD_MONTHLY_BURN_RUPEES) {
  if (!monthlyBurn || monthlyBurn <= 0) return null
  return Math.max(0, Math.round((balance / monthlyBurn) * 30.437))
}

const CD_UTILIZATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/**
 * @typedef {{ at: string, type: string, amount: number, balanceAfter: number }} CdLedgerTx
 */

/**
 * Wallet utilization since the last recharge, capped to the last 30 days of that period.
 * Opening balance is the wallet balance at period start (last top-up, or 30 days ago if older).
 *
 * @param {number} [balance]
 * @param {CdLedgerTx[]} [transactions]
 * @param {string} [asOfIso]
 */
export function cdWalletUtilization(
  balance = CD_CURRENT_BALANCE_RUPEES,
  transactions = cdTransactions,
  asOfIso = CD_BALANCE_AS_OF_ISO,
) {
  const asOfMs = new Date(asOfIso).getTime()
  if (!Number.isFinite(asOfMs) || !transactions?.length) {
    return { remainingBalance: balance, utilizedInr: 0, remainingPct: 100 }
  }

  const windowStartMs = asOfMs - CD_UTILIZATION_WINDOW_MS
  const sortedNewestFirst = [...transactions].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )

  const lastRecharge = sortedNewestFirst.find(
    (tx) => tx.type === 'deposit' && new Date(tx.at).getTime() <= asOfMs,
  )

  if (!lastRecharge) {
    return { remainingBalance: balance, utilizedInr: 0, remainingPct: 100 }
  }

  const rechargeMs = new Date(lastRecharge.at).getTime()
  const periodStartMs = Math.max(rechargeMs, windowStartMs)

  let openingBalance = lastRecharge.balanceAfter
  if (periodStartMs > rechargeMs) {
    const chronological = [...transactions].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    )
    for (const tx of chronological) {
      if (new Date(tx.at).getTime() <= periodStartMs) {
        openingBalance = tx.balanceAfter
      } else {
        break
      }
    }
  }

  const utilizedInr = Math.max(0, openingBalance - balance)
  const remainingPct =
    openingBalance > 0 ? Math.min(100, Math.round((balance / openingBalance) * 100)) : 0

  return { remainingBalance: balance, utilizedInr, remainingPct }
}

export function cdRiskLevel(balance = CD_CURRENT_BALANCE_RUPEES) {
  if (balance < CD_THRESHOLDS.minimum) return 'critical'
  if (balance < CD_THRESHOLDS.buffer) return 'warning'
  return 'healthy'
}

/** Recent ledger rows for CD Balance screen (mock). `settlement` drives nuance badge in UI. */
export const cdTransactions = [
  {
    id: 't1',
    at: '2026-03-30T14:22:00',
    type: 'deduction',
    description: 'Premium settlement — Mar cycle',
    amount: -12_40_000,
    balanceAfter: 48_50_000,
    endorsementRef: 'END-MAR-2026',
    settlement: 'settled',
  },
  {
    id: 't2',
    at: '2026-03-28T10:05:00',
    type: 'deduction',
    description: 'Endorsement — Quick Add (3 employees)',
    amount: -42_300,
    balanceAfter: 60_90_000,
    endorsementRef: 'QA-9921',
    settlement: 'settled',
  },
  {
    id: 't3',
    at: '2026-03-15T09:00:00',
    type: 'deposit',
    description: 'Wallet top-up — NEFT',
    amount: 25_00_000,
    balanceAfter: 61_32_300,
    endorsementRef: null,
    settlement: 'settled',
  },
  {
    id: 't4',
    at: '2026-03-10T16:40:00',
    type: 'deduction',
    description: 'Endorsement — Bulk upload (add)',
    amount: -1_85_000,
    balanceAfter: 36_32_300,
    endorsementRef: 'BU-4410',
    settlement: 'pending_recon',
  },
]

/** Open / in-flight CD ledger disputes (mock). */
export const cdDisputes = [
  {
    id: 'd1',
    openedAt: '2026-03-22T11:00:00+05:30',
    amount: 42_300,
    status: 'under_review',
    summary: 'Possible duplicate debit — same window as Quick Add QA-9921',
    relatedRef: 'QA-9921',
  },
]

