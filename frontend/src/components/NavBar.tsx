import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Predict' },
  { to: '/batch', label: 'Batch Upload' },
  { to: '/metrics', label: 'Metrics' },
  { to: '/collateral', label: 'Collateral Tracker' },
]

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--brand)" />
      <path d="M7 16.5V12L12 8.5L17 12V16.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 16.5V13.5H14.5V16.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3">
        <div className="mr-6 flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Credit Risk
          </span>
        </div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--brand-tint)] text-[var(--brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--brand-tint)]/60 hover:text-[var(--text-primary)]'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
