import { useState } from 'react'

export interface NewLoan {
  applicant_name: string
  loan_amount: number
  predicted_risk_tier: string
}

const inputClasses =
  'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]'

export default function CreateLoanForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (loan: NewLoan) => void
  submitting: boolean
}) {
  const [applicantName, setApplicantName] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [riskTier, setRiskTier] = useState('Medium')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(loanAmount)
    if (!applicantName.trim() || !loanAmount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter an applicant name and a positive loan amount')
      return
    }
    setError(null)
    onSubmit({ applicant_name: applicantName, loan_amount: amount, predicted_risk_tier: riskTier })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Applicant Name</span>
        <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className={inputClasses} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Loan Amount ($)</span>
        <input
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          className={`w-36 ${inputClasses}`}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Risk Tier</span>
        <select value={riskTier} onChange={(e) => setRiskTier(e.target.value)} className={inputClasses}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-[var(--page)] shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create New Loan'}
      </button>
      {error && <span className="text-xs font-medium text-[var(--status-critical)]">{error}</span>}
    </form>
  )
}
