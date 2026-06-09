import { NavLink, Outlet, Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/classes', label: 'Classes', icon: '📅' },
  { to: '/grading', label: 'Grading', icon: '🥋' },
  { to: '/retention', label: 'Retention', icon: '❤️‍🩹' },
  { to: '/pipeline', label: 'Pipeline', icon: '🧲' },
  { to: '/inbox', label: 'Inbox', icon: '💬' },
  { to: '/billing', label: 'Billing', icon: '💳' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout() {
  const { db } = useStore()
  const openTasks = db.tasks.filter((t) => t.status === 'open').length

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 z-40">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-lg font-bold text-white tracking-tight">🥋 DojoOS</div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">{db.school.name}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'
                )
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {item.label === 'Dashboard' && openTasks > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold rounded-full px-1.5">{openTasks}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <Link
            to="/kiosk"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 text-sm font-semibold"
          >
            ✅ Launch Check-in Kiosk
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-56 p-6 max-w-[1400px]">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
