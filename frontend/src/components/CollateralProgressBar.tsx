export default function CollateralProgressBar({
  releaseTarget,
  remainingAmount,
  status,
}: {
  releaseTarget: number
  remainingAmount: number
  status: string
}) {
  const pct = status === 'Released' ? 100 : Math.min(100, Math.max(0, ((releaseTarget - remainingAmount) / releaseTarget) * 100))

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: status === 'Released' ? 'var(--status-good)' : 'var(--brand)',
          }}
        />
      </div>
      <div className="mt-1.5 text-xs text-[var(--text-muted)]">
        {status === 'Released'
          ? 'Fully repaid toward target'
          : `$${remainingAmount.toLocaleString()} remaining to reach $${releaseTarget.toLocaleString()} target`}
      </div>
    </div>
  )
}
