import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [tab, setTab]       = useState('signin')
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const [name, setName]     = useState('')
  const [confirm, setConf]  = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, continueAsGuest } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signup') {
        if (password !== confirm) throw new Error('Passwords do not match')
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const guest = () => { continueAsGuest(); navigate('/games') }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, var(--red-dim) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <div className="scale-in" style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '36px 32px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="GameTime" style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.06em' }}>
            GAME<span style={{ color: 'var(--red)' }}>TIME</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Never miss a game
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--surface-2)', borderRadius: 8, padding: 4
        }}>
          {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '8px', borderRadius: 6,
              fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: tab === t ? 'var(--surface-3)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--text-3)',
              border: `1px solid ${tab === t ? 'var(--border-2)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.15s'
            }}>{l}</button>
          ))}
        </div>

        <form onSubmit={submit}>
          {/* Name (signup only) */}
          {tab === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label className="input-label">Name</label>
              <input className="input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {/* Password */}
          <div style={{ marginBottom: tab === 'signup' ? 14 : 20 }}>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder={tab === 'signup' ? 'Min 8 chars, 1 letter + 1 number' : '••••••••'} value={password} onChange={e => setPass(e.target.value)} required />
          </div>

          {/* Confirm (signup only) */}
          {tab === 'signup' && (
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Confirm Password</label>
              <input className="input" type="password" placeholder="Confirm password" value={confirm} onChange={e => setConf(e.target.value)} required />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16, borderRadius: 7,
              background: 'var(--red-dim)', border: '1px solid rgba(232,0,29,0.25)',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--red)'
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn btn-red" style={{
            width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Guest */}
        <button onClick={guest} className="btn btn-dark" style={{
          width: '100%', padding: '11px', fontSize: 13, justifyContent: 'center'
        }}>
          Continue as Guest
        </button>

        <p style={{
          marginTop: 14, textAlign: 'center',
          fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-3)'
        }}>
          {tab === 'signin'
            ? <span>No account? <button onClick={() => setTab('signup')} style={{ color: 'var(--red)', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none' }}>Create one</button></span>
            : <span>Already have one? <button onClick={() => setTab('signin')} style={{ color: 'var(--red)', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none' }}>Sign in</button></span>
          }
        </p>
      </div>
    </div>
  )
}
