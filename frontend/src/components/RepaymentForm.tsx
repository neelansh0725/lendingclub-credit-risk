import { useState } from 'react'
import { motion } from 'framer-motion'

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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
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
      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: submitting ? 1 : 1.03 }}
        whileTap={{ scale: submitting ? 1 : 0.97 }}
        className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50"
        style={{ background: 'var(--gradient-accent)' }}
      >
        {submitting ? 'Recording...' : 'Record'}
      </motion.button>
      {error && <span className="text-xs font-medium text-[var(--status-critical)]">{error}</span>}
    </form>
  )
}
