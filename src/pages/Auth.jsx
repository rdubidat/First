// Live-mode auth: staff sign-in/sign-up, then first-run onboarding that
// creates the school (optionally pre-loaded with the demo dataset).

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { createSchool } from '../data/remote'
import { buildSeedDb } from '../data/seed'
import { useStore } from '../data/store'
import { Button, Field, inputCls } from '../components/ui'

function AuthShell({ title, sub, children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl">🥋</div>
          <h1 className="text-xl font-bold text-white mt-1">DojoOS</h1>
          <p className="text-sm text-slate-400 mt-1">{sub}</p>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword(form)
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp(form)
        if (error) throw error
        if (!data.session) {
          setNotice({ ok: true, text: 'Account created — check your email to confirm, then sign in.' })
          setMode('signin')
        }
      }
    } catch (err) {
      setNotice({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={mode === 'signin' ? 'Staff sign in' : 'Create staff account'} sub="Martial arts school CRM">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email">
          <input type="email" required autoComplete="email" className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        {notice && (
          <p className={`text-xs ${notice.ok ? 'text-emerald-600' : 'text-red-600'}`}>{notice.text}</p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      <button
        className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-700"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setNotice(null) }}
      >
        {mode === 'signin' ? "New school? Create an account →" : '← Back to sign in'}
      </button>
    </AuthShell>
  )
}

export function Onboarding() {
  const { live } = useStore()
  const [name, setName] = useState('')
  const [withDemo, setWithDemo] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createSchool({
        name: name.trim(),
        user: live.session.user,
        seedDb: withDemo ? buildSeedDb() : null,
      })
      await live.refreshProfile()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Set up your school" sub={`Signed in as ${live.session.user.email}`}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="School name">
          <input required className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="MACE Martial Arts" />
        </Field>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={withDemo} onChange={(e) => setWithDemo(e.target.checked)} />
          <span>
            Start with example data
            <span className="block text-xs text-slate-400">24 families, attendance history, leads — handy for exploring. Untick for a clean slate.</span>
          </span>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={busy || !name.trim()} className="w-full">
          {busy ? 'Creating school…' : 'Create school'}
        </Button>
      </form>
      <button className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-700" onClick={live.signOut}>
        Sign out
      </button>
    </AuthShell>
  )
}

export function Splash({ text = 'Loading your school…', error = null, onSignOut }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
      <div className="text-3xl animate-pulse">🥋</div>
      <p className="text-sm">{error ? `Something went wrong: ${error}` : text}</p>
      {error && onSignOut && (
        <button className="text-xs underline" onClick={onSignOut}>Sign out and retry</button>
      )}
    </div>
  )
}
