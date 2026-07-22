import { useState } from 'react'

export interface NewLoan {
  applicant_name: string
  loan_amount: number
  predicted_risk_tier: string
}

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
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4 dark:border-gray-700">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Applicant Name</span>
        <input
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Loan Amount ($)</span>
        <input
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          className="w-36 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Risk Tier</span>
        <select
          value={riskTier}
          onChange={(e) => setRiskTier(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create New Loan'}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}
