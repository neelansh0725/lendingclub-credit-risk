import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import AddCollateralForm, { type NewCollateral } from '../components/AddCollateralForm'
import CollateralProgressBar from '../components/CollateralProgressBar'
import CreateLoanForm, { type NewLoan } from '../components/CreateLoanForm'
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
  const [creatingLoan, setCreatingLoan] = useState(false)
  const [addingCollateral, setAddingCollateral] = useState(false)
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

  const handleCreateLoan = (loan: NewLoan) => {
    setCreatingLoan(true)
    setError(null)
    apiClient
      .post<{ id: number }>('/loans', loan)
      .then((res) => {
        setNewlyReleased([])
        setLoanIdInput(String(res.data.id))
        setLoanId(res.data.id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to create loan'))
      .finally(() => setCreatingLoan(false))
  }

  const handleAddCollateral = (collateral: NewCollateral) => {
    if (loanId === null) return
    setAddingCollateral(true)
    apiClient
      .post<Collateral[]>(`/loans/${loanId}/collaterals`, [collateral])
      .then(() => fetchCollaterals(loanId, false))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to add collateral'))
      .finally(() => setAddingCollateral(false))
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Collateral Tracker</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pledge collateral against a secured loan and track its release as repayments come in.
        </p>
      </div>

      <CreateLoanForm onSubmit={handleCreateLoan} submitting={creatingLoan} />

      <form onSubmit={handleLoadLoan} className="mb-6 flex items-end gap-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--text-secondary)]">Loan ID</span>
          <input
            type="number"
            value={loanIdInput}
            onChange={(e) => setLoanIdInput(e.target.value)}
            className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
        >
          Load
        </button>
      </form>

      {error && <p className="mb-4 text-sm font-medium text-[var(--status-critical)]">{error}</p>}

      {newlyReleased.length > 0 && (
        <div
          className="mb-6 flex items-start gap-2 rounded-xl border p-4 text-sm"
          style={{ borderColor: 'var(--status-good)', background: 'var(--status-good-tint)', color: 'var(--status-good)' }}
        >
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--status-good)' }} />
          <span>
            <strong>{newlyReleased.length}</strong> collateral{newlyReleased.length > 1 ? 's' : ''} newly qualified for release:{' '}
            {newlyReleased.map((c) => c.description).join(', ')}
          </span>
        </div>
      )}

      {collaterals && (
        <div className="flex flex-col gap-4">
          {collaterals.map((c) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-[var(--text-primary)]">{c.description}</span>{' '}
                  <span className="text-sm text-[var(--text-muted)]">({c.type})</span>
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

          <div className="mt-2 flex flex-col gap-4">
            <AddCollateralForm onSubmit={handleAddCollateral} submitting={addingCollateral} />
            <RepaymentForm onSubmit={handleRepayment} submitting={submitting} />
          </div>
        </div>
      )}
    </div>
  )
}
