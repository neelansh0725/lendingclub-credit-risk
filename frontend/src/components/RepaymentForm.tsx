import { useState } from 'react'

const inputClasses =
  'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]'

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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Record Repayment ($)</span>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClasses}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-50"
      >
        {submitting ? 'Recording...' : 'Record'}
      </button>
      {error && <span className="text-xs font-medium text-[var(--status-critical)]">{error}</span>}
    </form>
  )
}
