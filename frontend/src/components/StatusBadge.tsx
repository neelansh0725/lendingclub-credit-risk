const CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Held: { bg: 'bg-[var(--border)]/50', text: 'text-[var(--text-secondary)]', dot: 'bg-[var(--text-muted)]' },
  Released: { bg: 'bg-[var(--status-good-tint)]', text: 'text-[var(--status-good)]', dot: 'bg-[var(--status-good)]' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? CONFIG.Held
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}
