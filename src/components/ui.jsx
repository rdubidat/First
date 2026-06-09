// Small shared UI primitives.

import { cn, initials, gbp } from '../lib/utils'

export function Card({ title, action, children, className, pad = true }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {action}
        </div>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </div>
  )
}

const BADGE_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

export function Badge({ color = 'slate', children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', BADGE_STYLES[color], className)}>
      {children}
    </span>
  )
}

const STATUS_COLORS = {
  lead: 'blue', trial: 'purple', active: 'green', frozen: 'amber', cancelled: 'red', alumni: 'slate',
  paid: 'green', failed: 'red', retrying: 'amber', refunded: 'slate',
  sent: 'green', received: 'blue', scheduled: 'blue', held_quiet_hours: 'amber',
  blocked_optout: 'red', sent_from_device: 'purple', queued: 'slate',
  'at-risk': 'red', watch: 'amber', healthy: 'green',
  open: 'amber', done: 'green', pass: 'green', fail: 'red', pending: 'slate', completed: 'green',
}

export function StatusBadge({ status }) {
  return <Badge color={STATUS_COLORS[status] || 'slate'}>{String(status).replace(/_/g, ' ')}</Badge>
}

export function Stat({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={cn('mt-1 text-2xl font-bold', accent || 'text-slate-900')}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export function Avatar({ name, size = 'md', color = 'bg-slate-200 text-slate-600' }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' }
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold shrink-0', sizes[size], color)}>
      {initials(name)}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500',
  }
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-sm', lg: 'px-5 py-2.5 text-base' }
  return (
    <button
      className={cn('rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl w-full max-h-[85vh] overflow-y-auto', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'

export function EmptyState({ children }) {
  return <div className="text-center py-8 text-sm text-slate-400">{children}</div>
}

export function Money({ pence, className }) {
  return <span className={className}>{gbp(pence)}</span>
}

// Tiny inline bar chart (no chart library needed).
export function Sparkbar({ values, max, height = 32, barClass = 'bg-slate-700' }) {
  const m = max || Math.max(1, ...values)
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn('flex-1 rounded-sm min-w-[4px]', v === 0 ? 'bg-slate-200' : barClass)}
          style={{ height: `${Math.max(8, (v / m) * 100)}%` }}
          title={String(v)}
        />
      ))}
    </div>
  )
}
