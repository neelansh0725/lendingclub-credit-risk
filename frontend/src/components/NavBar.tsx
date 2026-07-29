import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Predict' },
  { to: '/batch', label: 'Batch Upload' },
  { to: '/metrics', label: 'Metrics' },
  { to: '/collateral', label: 'Collateral Tracker' },
]

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eb6834" />
          <stop offset="100%" stopColor="#d95a86" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="7" fill="url(#logoGrad)" />
      <path d="M7 16.5V12L12 8.5L17 12V16.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 16.5V13.5H14.5V16.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function NavBar() {
  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3.5">
        <div className="mr-8 flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            Credit Risk
          </span>
        </div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
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
    </motion.nav>
  )
}
