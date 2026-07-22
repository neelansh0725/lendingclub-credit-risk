import { useState } from 'react'

export interface NewCollateral {
  type: string
  description: string
  estimated_value: number
  release_target_amount: number
}

const inputClasses =
  'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]'

export default function AddCollateralForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (collateral: NewCollateral) => void
  submitting: boolean
}) {
  const [type, setType] = useState('vehicle')
  const [description, setDescription] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [releaseTarget, setReleaseTarget] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(estimatedValue)
    const target = Number(releaseTarget)
    if (!description.trim() || !estimatedValue || !releaseTarget || Number.isNaN(value) || Number.isNaN(target) || value <= 0 || target <= 0) {
      setError('Fill in all fields with positive numbers')
      return
    }
    setError(null)
    onSubmit({ type, description, estimated_value: value, release_target_amount: target })
    setDescription('')
    setEstimatedValue('')
    setReleaseTarget('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputClasses}>
          <option value="vehicle">Vehicle</option>
          <option value="property">Property</option>
          <option value="deposit">Deposit</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Description</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClasses} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Estimated Value ($)</span>
        <input
          type="number"
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          className={`w-36 ${inputClasses}`}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Release Target ($)</span>
        <input
          type="number"
          value={releaseTarget}
          onChange={(e) => setReleaseTarget(e.target.value)}
          className={`w-36 ${inputClasses}`}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add Collateral'}
      </button>
      {error && <span className="text-xs font-medium text-[var(--status-critical)]">{error}</span>}
    </form>
  )
}
