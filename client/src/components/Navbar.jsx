import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLive } from '../context/LiveContext'
import Logo from './Logo'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const { liveCount } = useLive()
  const [scrolled, setScrolled] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const active = (path) => path === '/' ? pathname === '/' : pathname.startsWith(path)

  const navLinks = [
    { to: '/games',    label: 'Games' },
    { to: '/trending', label: 'Trending' },
    { to: '/discover', label: 'Discover' },
    ...(user ? [{ to: '/home', label: 'My Feed' }, { to: '/reminders', label: 'Reminders' }] : []),
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--nav-h)', zIndex: 200,
      background: isDark
        ? (scrolled ? 'rgba(8,8,8,0.98)' : 'rgba(8,8,8,0.88)')
        : (scrolled ? 'rgba(247,247,247,0.98)' : 'rgba(247,247,247,0.92)'),
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: isDark
        ? `1px solid ${scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`
        : `1px solid ${scrolled ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)'}`,
      transition: 'background 0.3s, border-color 0.3s'
    }}>
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Logo */}
        <Link to={user ? '/home' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 16 }}>
          <Logo size={38} variant={isDark ? 'dark' : 'light'} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '0.06em' }}>
            GAME<span style={{ color: 'var(--red)' }}>TIME</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '6px 12px', borderRadius: 6,
              fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
              letterSpacing: '0.09em', textTransform: 'uppercase',
              color: active(to) ? 'var(--text)' : 'var(--text-2)',
              background: active(to) ? 'var(--surface-2)' : 'transparent',
              border: `1px solid ${active(to) ? 'var(--border-2)' : 'transparent'}`,
              transition: 'all 0.15s',
              textDecoration: 'none'
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

          {/* Live pill */}
          {liveCount > 0 && (
            <Link to="/trending" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--red-dim)', border: '1px solid rgba(232,0,29,0.3)',
              borderRadius: 20, padding: '5px 12px',
              animation: 'ring-pulse 2s ease-out infinite'
            }}>
              <div className="live-dot" />
              <span style={{
                fontFamily: 'var(--font-cond)', fontWeight: 800,
                fontSize: 12, letterSpacing: '0.12em', color: 'var(--red)'
              }}>{liveCount} LIVE</span>
            </Link>
          )}

          {/* Reminders bell — visible when logged in */}
          {user && (
            <Link to="/reminders" title="Reminders" style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.15s', textDecoration: 'none',
              color: active('/reminders') ? 'var(--red)' : 'var(--text-2)',
              borderColor: active('/reminders') ? 'rgba(232,0,29,0.4)' : 'var(--border)',
            }}>
              🔔
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.15s', cursor: 'pointer'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Auth */}
          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdown(d => !d)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 8,
                  background: dropdown ? 'var(--surface-3)' : 'var(--surface-2)',
                  border: '1px solid var(--border-2)', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12
                }}>
                  {user.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {user.name?.split(' ')[0] || 'User'}
                </span>
                {user.isPro && (
                  <span style={{
                    background: 'var(--gold)', color: '#000',
                    fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 3,
                    fontFamily: 'var(--font-cond)', letterSpacing: '0.1em'
                  }}>PRO</span>
                )}
                <span style={{ color: 'var(--text-3)', fontSize: 10 }}>▾</span>
              </button>

              {dropdown && (
                <div className="scale-in" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                  borderRadius: 10, padding: '6px', minWidth: 180,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 999
                }}>
                  {[
                    { to: '/home',      label: 'My Feed',   icon: '🏠' },
                    { to: '/reminders', label: 'Reminders', icon: '🔔' },
                    { to: '/settings',  label: 'Settings',  icon: '⚙️' },
                  ].map(({ to, label, icon }) => (
                    <Link key={to} to={to} onClick={() => setDropdown(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 7, color: 'var(--text-2)',
                      fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 13,
                      transition: 'all 0.12s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
                    >
                      <span>{icon}</span>{label}
                    </Link>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={() => { signOut(); setDropdown(false); navigate('/') }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 13,
                      color: 'var(--red)', transition: 'all 0.12s', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>→</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-red" style={{ padding: '7px 18px', fontSize: 13 }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
