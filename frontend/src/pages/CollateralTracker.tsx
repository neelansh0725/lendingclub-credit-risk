import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import CollateralProgressBar from '../components/CollateralProgressBar'
import RepaymentForm from '../components/RepaymentForm'
import StatusBadge from '../components/StatusBadge'

interface Collateral {
  id: number
  type: string
  description: string
  estimated_value: number
  release_target_amount: number
  status: 'Held' | 'Released'
  released_at: string | null
  remaining_amount: number
}

const SEEN_RELEASED_KEY_PREFIX = 'lc_seen_released_collaterals_loan_'

function getSeenReleasedIds(loanId: number): Set<number> {
  const raw = localStorage.getItem(SEEN_RELEASED_KEY_PREFIX + loanId)
  return raw ? new Set(JSON.parse(raw)) : new Set()
}

function saveSeenReleasedIds(loanId: number, ids: Set<number>) {
  localStorage.setItem(SEEN_RELEASED_KEY_PREFIX + loanId, JSON.stringify([...ids]))
}

export default function CollateralTracker() {
  const [loanIdInput, setLoanIdInput] = useState('1')
  const [loanId, setLoanId] = useState<number | null>(1)
  const [collaterals, setCollaterals] = useState<Collateral[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newlyReleased, setNewlyReleased] = useState<Collateral[]>([])

  const fetchCollaterals = (id: number, flagNewReleases: boolean) => {
    setError(null)
    apiClient
      .get<Collateral[]>(`/loans/${id}/collaterals`)
      .then((res) => {
        setCollaterals(res.data)

        if (flagNewReleases) {
          const seen = getSeenReleasedIds(id)
          const released = res.data.filter((c) => c.status === 'Released')
          const newlySeen = released.filter((c) => !seen.has(c.id))
          if (newlySeen.length > 0) setNewlyReleased(newlySeen)
          saveSeenReleasedIds(id, new Set(released.map((c) => c.id)))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load collaterals'))
  }

  // FR-30: flag newly-released collaterals on this dashboard load, compared
  // against what was already seen (persisted) from a prior visit.
  useEffect(() => {
    if (loanId !== null) fetchCollaterals(loanId, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId])

  const handleLoadLoan = (e: React.FormEvent) => {
    e.preventDefault()
    const id = Number(loanIdInput)
    if (Number.isNaN(id) || id <= 0) {
      setError('Enter a valid loan ID')
      return
    }
    setNewlyReleased([])
    setLoanId(id)
  }

  const handleRepayment = (amount: number) => {
    if (loanId === null) return
    setSubmitting(true)
    apiClient
      .post<Collateral[]>(`/loans/${loanId}/repayments`, { amount })
      .then(() => {
        // Not flagging here — the notification is for the *next* dashboard load,
        // per FR-30, not immediately after the analyst's own action.
        fetchCollaterals(loanId, false)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to record repayment'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Collateral Tracker</h1>

      <form onSubmit={handleLoadLoan} className="mb-6 flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Loan ID</span>
          <input
            type="number"
            value={loanIdInput}
            onChange={(e) => setLoanIdInput(e.target.value)}
            className="w-32 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <button type="submit" className="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
          Load
        </button>
      </form>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {newlyReleased.length > 0 && (
        <div className="mb-6 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
          {newlyReleased.length} collateral{newlyReleased.length > 1 ? 's' : ''} newly qualified for release:{' '}
          {newlyReleased.map((c) => c.description).join(', ')}
        </div>
      )}

      {collaterals && (
        <div className="flex flex-col gap-4">
          {collaterals.map((c) => (
            <div key={c.id} className="rounded border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-medium">{c.description}</span>{' '}
                  <span className="text-sm text-gray-500 dark:text-gray-400">({c.type})</span>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <CollateralProgressBar
                releaseTarget={c.release_target_amount}
                remainingAmount={c.remaining_amount}
                status={c.status}
              />
            </div>
          ))}

          <div className="mt-2">
            <RepaymentForm onSubmit={handleRepayment} submitting={submitting} />
          </div>
        </div>
      )}
    </div>
  )
}
