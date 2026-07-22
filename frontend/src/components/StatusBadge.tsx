const STYLES: Record<string, string> = {
  Held: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  Released: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status] ?? ''}`}>
      {status}
    </span>
  )
}
