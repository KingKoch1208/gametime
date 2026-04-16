import { useState, useEffect } from 'react'
import GameCard from '../components/GameCard'
import SportFilter from '../components/SportFilter'
import Logo from '../components/Logo'
import ReminderModal from '../components/ReminderModal'
import { useTheme } from '../context/ThemeContext'
import { getGames, getReminders, createReminder } from '../api'

const STATUS_TABS = [
  { value: 'all',      label: 'All' },
  { value: 'live',     label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'final',    label: 'Final' },
]

export default function Games() {
  const { isDark } = useTheme()
  const [games, setGames]         = useState([])
  const [reminders, setReminders] = useState([])
  const [sport, setSport]         = useState('all')
  const [status, setStatus]       = useState('all')
  const [selected, setSelected]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getGames(), getReminders()])
      .then(([{ games: g }, r]) => { setGames(g || []); setReminders(r) })
      .finally(() => setLoading(false))
  }, [])

  const reminderIds = new Set(reminders.map(r => r.gameId))

  const sportCounts = games.reduce((acc, g) => {
    acc[g.sport] = (acc[g.sport] || 0) + 1
    return acc
  }, {})

  const filtered = games.filter(g => {
    const matchSport  = sport === 'all' || g.sport === sport
    const matchStatus = status === 'all' || g.status === status
    return matchSport && matchStatus
  })

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setSelected(null)
    } catch {
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <Logo size={38} variant={isDark ? 'dark' : 'light'} />
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 52,
              letterSpacing: '0.05em', color: 'var(--text)', margin: 0
            }}>ALL GAMES</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-3)' }}>
            {loading ? 'Loading...' : `${filtered.length} game${filtered.length !== 1 ? 's' : ''} shown`}
          </p>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28, alignItems: 'center' }}>
          <SportFilter value={sport} onChange={setSport} counts={sportCounts} />

          {/* Divider */}
          <div style={{ width: 1, height: 30, background: 'var(--border)', flexShrink: 0 }} />

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 700,
                  fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 5, cursor: 'pointer', border: 'none',
                  background: status === tab.value ? 'var(--surface-3)' : 'transparent',
                  color: status === tab.value ? 'var(--text)' : 'var(--text-3)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
                {tab.value === 'live' && games.filter(g => g.status === 'live').length > 0 && (
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--live)', marginLeft: 6, verticalAlign: 'middle',
                    animation: 'pulse-dot 1.2s ease infinite'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Game grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏟️</div>
            <div className="empty-title">No games found</div>
            <div className="empty-sub">Try a different filter</div>
          </div>
        ) : (
          <div className="grid-cards">
            {filtered.map((g, i) => (
              <div key={g.id} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
                <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ReminderModal
          game={selected}
          loading={saving}
          onConfirm={handleConfirm}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid-cards">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i} className="skeleton"
          style={{ height: 160, borderRadius: 'var(--radius)' }}
        />
      ))}
    </div>
  )
}
