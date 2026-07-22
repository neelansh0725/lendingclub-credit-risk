const CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Low: { bg: 'bg-[var(--status-good-tint)]', text: 'text-[var(--status-good)]', dot: 'bg-[var(--status-good)]' },
  Medium: { bg: 'bg-[var(--status-warning-tint)]', text: 'text-[var(--status-warning)]', dot: 'bg-[var(--status-warning)]' },
  High: { bg: 'bg-[var(--status-critical-tint)]', text: 'text-[var(--status-critical)]', dot: 'bg-[var(--status-critical)]' },
}

export default function RiskTierBadge({ tier, size = 'md' }: { tier: string; size?: 'sm' | 'md' }) {
  const cfg = CONFIG[tier] ?? CONFIG.Medium
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {tier}{size === 'md' ? ' Risk' : ''}
    </span>
  )
}
