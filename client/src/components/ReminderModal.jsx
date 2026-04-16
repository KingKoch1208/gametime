import { useState } from 'react'

const OPTIONS = [
  { label: 'At kickoff', value: 0 },
  { label: '5 min',  value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
]

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)' }

export default function ReminderModal({ game, onConfirm, onClose, loading }) {
  const [minutes, setMinutes] = useState(30)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const color = SPORT_COLOR[game?.sport] || 'var(--accent)'

  const effectiveMinutes = useCustom
    ? Math.max(1, Math.min(1440, parseInt(custom) || 30))
    : minutes

  if (!game) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${color}35`,
          borderTop: `3px solid ${color}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          width: '100%', maxWidth: 400,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${color}12`,
          position: 'relative'
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--surface-3)',
            color: 'var(--text-2)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-3)'}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-cond)', fontWeight: 800,
            fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color, marginBottom: 8
          }}>Set Reminder · {game.sport}</div>
          <div style={{
            fontFamily: 'var(--font-cond)', fontWeight: 800,
            fontSize: 22, letterSpacing: '0.03em', lineHeight: 1.2,
            color: 'var(--text)'
          }}>
            {game.awayTeam.shortName} vs {game.homeTeam.shortName}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-3)', marginTop: 6
          }}>
            {game.date} · {game.time} · {game.venue}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 22 }} />

        {/* Notify me label */}
        <div style={{
          fontFamily: 'var(--font-cond)', fontWeight: 700,
          fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-2)', marginBottom: 12
        }}>Notify me before kickoff</div>

        {/* Time options */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setMinutes(opt.value); setUseCustom(false) }}
              style={{
                flex: '1 1 72px',
                fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 13, letterSpacing: '0.04em',
                padding: '9px 8px', borderRadius: 7, cursor: 'pointer',
                border: (!useCustom && minutes === opt.value) ? `1px solid ${color}66` : '1px solid var(--border)',
                background: (!useCustom && minutes === opt.value) ? `${color}1a` : 'var(--surface)',
                color: (!useCustom && minutes === opt.value) ? color : 'var(--text-2)',
                transition: 'all 0.15s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom time */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setUseCustom(c => !c)}
              style={{
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${useCustom ? `${color}55` : 'var(--border)'}`,
                background: useCustom ? `${color}12` : 'transparent',
                color: useCustom ? color : 'var(--text-3)',
                transition: 'all 0.15s'
              }}
            >
              Custom
            </button>
            {useCustom && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  placeholder="e.g. 45"
                  className="input"
                  style={{ padding: '7px 12px', fontSize: 14, flex: 1 }}
                  autoFocus
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>min before</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={() => onConfirm(game.id, effectiveMinutes)}
          disabled={loading}
          style={{
            width: '100%',
            fontFamily: 'var(--font-cond)', fontWeight: 800,
            fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: loading ? 'var(--surface-3)' : color,
            color: loading ? 'var(--text-3)' : '#000',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {loading ? 'Setting...' : effectiveMinutes === 0 ? '⏰  Remind me at kickoff' : `⏰  Remind me ${effectiveMinutes < 60 ? effectiveMinutes + ' min' : (effectiveMinutes / 60) + ' hr'} before`}
        </button>

        {/* Footnote */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--text-3)', textAlign: 'center', marginTop: 12
        }}>
          Reminders are stored until you remove them or the server restarts.
        </p>
      </div>
    </div>
  )
}
