import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getReminders, deleteReminder } from '../api'

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)' }

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)

  useEffect(() => {
    getReminders()
      .then(setReminders)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteReminder(id)
      setReminders(prev => prev.filter(r => r.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 52,
            letterSpacing: '0.05em', marginBottom: 6
          }}>MY REMINDERS</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-3)' }}>
            {loading ? 'Loading...' : `${reminders.length} reminder${reminders.length !== 1 ? 's' : ''} set`}
          </p>
        </div>

        {/* Plan usage bar — Basic users only */}
        {!loading && !user?.isPro && (
          <div style={{
            marginBottom: 28, padding: '16px 20px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Basic Plan — Reminder Slots
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: reminders.length >= 3 ? 'var(--red)' : 'var(--text-2)' }}>
                  {reminders.length} / 3 used
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: reminders.length >= 3 ? 'var(--red)' : 'var(--text-2)',
                  width: `${Math.min((reminders.length / 3) * 100, 100)}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
              {reminders.length >= 3 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--red)', marginTop: 6 }}>
                  Slot limit reached — delete a reminder or upgrade to add more.
                </p>
              )}
            </div>
            <Link to="/settings" style={{
              flexShrink: 0, fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '8px 16px', borderRadius: 7,
              border: '1px solid rgba(232,0,29,0.35)', color: 'var(--red)',
              background: 'var(--red-dim)', transition: 'filter 0.15s'
            }}>Upgrade →</Link>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--text-3)' }}>LOADING…</span>
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
            {reminders.map((reminder, i) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                onDelete={handleDelete}
                deleting={deleting === reminder.id}
                style={{ animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReminderRow({ reminder, onDelete, deleting, style }) {
  const { game } = reminder
  if (!game) return null

  const color = SPORT_COLOR[game.sport] || 'var(--accent)'
  const label = reminder.minutesBefore < 60
    ? `${reminder.minutesBefore} min before`
    : `${reminder.minutesBefore / 60} hr before`

  const createdDate = new Date(reminder.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'box-shadow 0.18s',
        ...style
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.3), 0 0 0 1px ${color}25`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Sport badge */}
      <div style={{
        flexShrink: 0, width: 44, height: 44, borderRadius: 8,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12,
        letterSpacing: '0.1em', color, textTransform: 'uppercase'
      }}>
        {game.sport}
      </div>

      {/* Game info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/games/${game.id}`} style={{ display: 'block' }}>
          <div style={{
            fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 17,
            letterSpacing: '0.02em', color: 'var(--text)',
            marginBottom: 3,
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.target.style.color = color}
          onMouseLeave={e => e.target.style.color = 'var(--text)'}
          >
            {game.awayTeam.shortName} vs {game.homeTeam.shortName}
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            {game.date} · {game.time}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            {game.venue}
          </span>
        </div>
      </div>

      {/* Remind time badge */}
      <div style={{
        flexShrink: 0, textAlign: 'center',
        padding: '8px 14px', borderRadius: 8,
        background: `${color}12`, border: `1px solid ${color}28`
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color, letterSpacing: '0.04em', lineHeight: 1 }}>
          ⏰
        </div>
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-2)', marginTop: 4 }}>
          {label}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(reminder.id)}
        disabled={deleting}
        title="Remove reminder"
        style={{
          flexShrink: 0,
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: 'var(--text-3)', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
          opacity: deleting ? 0.4 : 1
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--live-dim)'; e.currentTarget.style.borderColor = 'rgba(255,51,85,0.3)'; e.currentTarget.style.color = 'var(--live)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
      >
        {deleting ? '…' : '✕'}
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon">🔔</div>
      <div className="empty-title">No reminders yet</div>
      <div className="empty-sub" style={{ marginBottom: 24 }}>
        Browse games and tap "+ Remind" to never miss a game
      </div>
      <Link to="/games" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '11px 24px', borderRadius: 8,
        background: 'var(--accent)', color: '#000',
        transition: 'filter 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        Browse Games →
      </Link>
    </div>
  )
}
