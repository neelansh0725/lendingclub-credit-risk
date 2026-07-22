import { useState } from 'react'

export interface NewCollateral {
  type: string
  description: string
  estimated_value: number
  release_target_amount: number
}

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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4 dark:border-gray-700">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="vehicle">Vehicle</option>
          <option value="property">Property</option>
          <option value="deposit">Deposit</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Description</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Estimated Value ($)</span>
        <input
          type="number"
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          className="w-36 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Release Target ($)</span>
        <input
          type="number"
          value={releaseTarget}
          onChange={(e) => setReleaseTarget(e.target.value)}
          className="w-36 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add Collateral'}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}
