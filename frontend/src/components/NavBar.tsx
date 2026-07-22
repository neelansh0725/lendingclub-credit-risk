import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Predict' },
  { to: '/batch', label: 'Batch Upload' },
  { to: '/metrics', label: 'Metrics' },
  { to: '/collateral', label: 'Collateral Tracker' },
]

export default function NavBar() {
  return (
    <nav className="flex gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
