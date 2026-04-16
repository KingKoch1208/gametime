import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import UpgradeModal from '../components/UpgradeModal'

const SPORTS = ['Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer', 'UFC/MMA', 'Tennis', 'Golf']
const STREAMING = [
  { id: 'espn_plus', label: 'ESPN+' },
  { id: 'peacock', label: 'Peacock' },
  { id: 'paramount_plus', label: 'Paramount+' },
  { id: 'apple_tv', label: 'Apple TV+' },
  { id: 'max', label: 'Max' },
  { id: 'youtube_tv', label: 'YouTube TV' },
  { id: 'nba_league_pass', label: 'NBA League Pass' },
  { id: 'nhl_tv', label: 'NHL.TV' },
  { id: 'tubi', label: 'Tubi (Free)' },
]

export default function Settings() {
  const { user, updateUser, signOut, togglePro, isPro } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const [name, setName]       = useState(user?.name || '')
  const [saved, setSaved]     = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const toggleSport = (sport) => {
    const current = user?.favoriteSports || []
    const updated = current.includes(sport) ? current.filter(s => s !== sport) : [...current, sport]
    updateUser({ favoriteSports: updated })
  }

  const toggleService = (id) => {
    const current = user?.streamingServices || []
    const updated = current.includes(id) ? current.filter(s => s !== id) : [...current, id]
    updateUser({ streamingServices: updated })
  }

  const saveName = () => {
    if (!name.trim()) return
    updateUser({ name: name.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const favSports  = user?.favoriteSports || []
  const favService = user?.streamingServices || []

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 40, maxWidth: 720 }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, letterSpacing: '0.04em', marginBottom: 36 }}>SETTINGS</h1>

        {/* ── Profile ─────────────────────────────── */}
        <SettingsCard title="Profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--red)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 32
            }}>
              {user?.name?.[0]?.toUpperCase() || 'G'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 18 }}>{user?.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{user?.email || 'Guest'}</div>
              {isPro && (
                <span style={{ display: 'inline-block', marginTop: 4, background: 'var(--gold)', color: '#000', fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', padding: '2px 8px', borderRadius: 4 }}>
                  ⭐ PRO MEMBER
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label className="input-label">Display Name</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ flex: 1 }} />
              <button onClick={saveName} className="btn btn-red" style={{ padding: '10px 18px', fontSize: 13 }}>
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* ── Plan ──────────────────────────────────── */}
        <SettingsCard title="Subscription">
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderRadius: 10,
            background: isPro ? 'var(--gold-dim)' : 'var(--surface-2)',
            border: `1px solid ${isPro ? 'rgba(212,146,10,0.3)' : 'var(--border)'}`,
            marginBottom: 14
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 16 }}>
                {isPro ? '⭐ Pro Plan' : 'Basic Plan'}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                {isPro ? 'Unlimited reminders · All features' : '3 reminder slots · Limited features'}
              </div>
            </div>
            {!isPro && (
              <button onClick={() => setShowUpgrade(true)} className="btn btn-red" style={{ padding: '8px 16px', fontSize: 12 }}>
                Upgrade
              </button>
            )}
          </div>

          {/* Demo toggle */}
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)'
          }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 6 }}>
              🎓 Demo Mode
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-2)' }}>Toggle Pro status (for presentation)</span>
              <Toggle value={isPro} onChange={togglePro} />
            </div>
          </div>
        </SettingsCard>

        {/* ── Appearance ──────────────────────────── */}
        <SettingsCard title="Appearance">
          <SettingsRow label="Dark Mode" sub="Dark background with light text">
            <Toggle value={isDark} onChange={toggle} />
          </SettingsRow>
          <SettingsRow label="Spoiler-Free Mode" sub="Blurs scores until you tap to reveal">
            <Toggle value={user?.spoilerFree || false} onChange={v => updateUser({ spoilerFree: v })} />
          </SettingsRow>
        </SettingsCard>

        {/* ── Notifications ─────────────────────── */}
        <SettingsCard title="Notifications">
          <SettingsRow label="Enable Notifications" sub="Required to receive game reminders">
            <Toggle value={user?.notifications ?? true} onChange={v => updateUser({ notifications: v })} />
          </SettingsRow>
          <SettingsRow label="Analytics" sub="Help improve GameTime with anonymous usage data">
            <Toggle value={user?.analyticsConsent ?? true} onChange={v => updateUser({ analyticsConsent: v })} />
          </SettingsRow>
        </SettingsCard>

        {/* ── Favorite Sports ───────────────────── */}
        <SettingsCard title="Favorite Sports">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
            Your favorites get prioritized in your feed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPORTS.map(sport => {
              const on = favSports.includes(sport)
              return (
                <button key={sport} onClick={() => toggleSport(sport)} style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
                  background: on ? 'var(--red-dim)' : 'var(--surface-2)',
                  border: `1px solid ${on ? 'rgba(232,0,29,0.35)' : 'var(--border)'}`,
                  color: on ? 'var(--red)' : 'var(--text-2)',
                  transition: 'all 0.15s'
                }}>{on ? '✓ ' : ''}{sport}</button>
              )
            })}
          </div>
        </SettingsCard>

        {/* ── Streaming Services ────────────────── */}
        <SettingsCard title="Your Streaming Services">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
            Select services you subscribe to for personalized Watch Now links.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {STREAMING.map(s => {
              const on = favService.includes(s.id)
              return (
                <button key={s.id} onClick={() => toggleService(s.id)} style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  background: on ? 'var(--red-dim)' : 'var(--surface-2)',
                  border: `1px solid ${on ? 'rgba(232,0,29,0.35)' : 'var(--border)'}`,
                  color: on ? 'var(--red)' : 'var(--text-2)',
                  transition: 'all 0.15s', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ fontSize: 16 }}>{on ? '✓' : '+'}</span>
                  {s.label}
                </button>
              )
            })}
          </div>
        </SettingsCard>

        {/* ── Sign Out ──────────────────────────── */}
        <SettingsCard title="Account">
          <button onClick={signOut} className="btn btn-outline" style={{
            color: 'var(--red)', borderColor: 'rgba(232,0,29,0.3)', fontSize: 14
          }}>
            Sign Out
          </button>
          <p style={{ marginTop: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-3)' }}>
            Your preferences are saved locally on this device.
          </p>
        </SettingsCard>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}

function SettingsCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 16
    }}>
      <div style={{
        fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12,
        letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)',
        marginBottom: 18
      }}>{title}</div>
      {children}
    </div>
  )
}

function SettingsRow({ label, sub, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: value ? 'var(--red)' : 'var(--surface-3)',
        border: `1px solid ${value ? 'rgba(232,0,29,0.4)' : 'var(--border)'}`,
        position: 'relative', transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </button>
  )
}
