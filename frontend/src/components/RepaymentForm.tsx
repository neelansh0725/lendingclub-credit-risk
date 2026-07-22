import { useState } from 'react'

export default function RepaymentForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (amount: number) => void
  submitting: boolean
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount)
    if (!amount || Number.isNaN(num) || num <= 0) {
      setError('Enter a positive amount')
      return
    }
    setError(null)
    onSubmit(num)
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Record Repayment ($)</span>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Recording...' : 'Record'}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}
