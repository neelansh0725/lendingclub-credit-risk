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
      <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-2.5 rounded-full transition-all ${status === 'Released' ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {status === 'Released' ? 'Fully repaid toward target' : `$${remainingAmount.toLocaleString()} remaining to reach $${releaseTarget.toLocaleString()} target`}
      </div>
    </div>
  )
}
