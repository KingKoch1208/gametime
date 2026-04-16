import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GameCard from '../components/GameCard'
import ReminderModal from '../components/ReminderModal'
import { getGames, getReminders, createReminder } from '../api'

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)' }

export default function Home() {
  const [games, setGames]           = useState([])
  const [reminders, setReminders]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    Promise.all([getGames(), getReminders()])
      .then(([g, r]) => { setGames(g); setReminders(r) })
      .catch(() => setError('Could not connect to server. Make sure it is running.'))
      .finally(() => setLoading(false))
  }, [])

  const reminderIds = new Set(reminders.map(r => r.gameId))

  const featured  = games.filter(g => g.featured || g.status === 'live').slice(0, 3)
  const liveGames = games.filter(g => g.status === 'live')
  const upcoming  = games.filter(g => g.status === 'upcoming').slice(0, 8)

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setSelected(null)
    } catch {
      // already set or error — just close
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Hero: Featured Games ───────────────────── */}
      <section style={{ padding: '44px 0 36px' }}>
        <div className="container">
          <SectionHeader title="Featured Tonight" link="/games" linkLabel="All Games →" />
          <div className="grid-featured">
            {featured.map((game, i) => (
              <FeaturedCard
                key={game.id}
                game={game}
                hasReminder={reminderIds.has(game.id)}
                onReminder={setSelected}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Now ──────────────────────────────── */}
      {liveGames.length > 0 && (
        <section style={{ paddingBottom: 36 }}>
          <div className="container">
            <SectionHeader
              title={<><span className="live-dot" style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />Live Now</>}
            />
            <div className="grid-cards">
              {liveGames.map((g, i) => (
                <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Coming Up ────────────────────────────── */}
      <section style={{ paddingBottom: 36 }}>
        <div className="container">
          <SectionHeader title="Coming Up" link="/games" linkLabel="See all →" />
          <div className="grid-cards">
            {upcoming.map((g, i) => (
              <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modal ────────────────────────────────── */}
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

/* ── Featured Card ─────────────────────────────────────── */
function FeaturedCard({ game, hasReminder, onReminder, style }) {
  const color = SPORT_COLOR[game.sport] || 'var(--accent)'
  const isLive = game.status === 'live'

  return (
    <Link to={`/games/${game.id}`}>
      <div
        className="fade-up"
        style={{
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${game.homeTeam.color}1e 0%, ${game.awayTeam.color}1e 100%), var(--surface-2)`,
          border: `1px solid ${color}28`,
          borderRadius: 'var(--radius-lg)',
          padding: '26px 26px 20px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          ...style
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${color}40`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 240, height: 240,
          background: `radial-gradient(circle, ${color}1a 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        {/* Sport + Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, position: 'relative' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.18em', textTransform: 'uppercase', color
            }}>{game.sport}</span>
            <span style={{ color: 'var(--text-3)', margin: '0 8px', fontSize: 10 }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
              {game.venue}
            </span>
          </div>
          {isLive ? (
            <span className="badge badge-live">
              <span className="live-dot" />
              LIVE · {game.quarter}{game.clock ? ' ' + game.clock : ''}
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
              {game.date} · {game.time}
            </span>
          )}
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, position: 'relative' }}>
          <ScoreBlock team={game.awayTeam} score={game.awayScore} isWinning={game.awayScore > game.homeScore} showScore={isLive || game.status === 'final'} />
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            color: 'var(--text-3)', letterSpacing: '0.06em'
          }}>VS</div>
          <ScoreBlock team={game.homeTeam} score={game.homeScore} isWinning={game.homeScore > game.awayScore} showScore={isLive || game.status === 'final'} isHome />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)',
          position: 'relative'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
            {game.broadcast && <span>📺 {game.broadcast}</span>}
            {game.streaming?.map(s => <span key={s}>· {s}</span>)}
          </div>
          {game.status === 'upcoming' && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onReminder?.(game) }}
              style={{
                fontFamily: 'var(--font-cond)', fontWeight: 800,
                fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: hasReminder ? `${color}22` : color,
                color: hasReminder ? color : '#000',
                transition: 'all 0.15s', flexShrink: 0
              }}
            >
              {hasReminder ? '✓ Reminder Set' : '⏰ Set Reminder'}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

function ScoreBlock({ team, score, isWinning, showScore, isHome }) {
  return (
    <div style={{ textAlign: isHome ? 'right' : 'left', minWidth: 120 }}>
      <div style={{ fontSize: 26, marginBottom: 6, lineHeight: 1 }}>{team.logo}</div>
      <div style={{
        fontFamily: 'var(--font-cond)', fontWeight: 900,
        fontSize: 18, letterSpacing: '0.04em', color: 'var(--text)', marginBottom: 2
      }}>{team.shortName.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 12 }}>
        {team.record} · {isHome ? 'HOME' : 'AWAY'}
      </div>
      {showScore && score != null && (
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1,
          color: isWinning ? 'var(--text)' : 'var(--text-2)',
          letterSpacing: '0.02em'
        }}>{score}</div>
      )}
    </div>
  )
}

/* ── Shared ─────────────────────────────────────────────── */
function SectionHeader({ title, link, linkLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <h2 style={{
        fontFamily: 'var(--font-cond)', fontWeight: 800,
        fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8
      }}>{title}</h2>
      {link && (
        <Link to={link} style={{
          fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
          color: 'var(--accent)', letterSpacing: '0.05em',
          transition: 'opacity 0.15s'
        }}
        onMouseEnter={e => e.target.style.opacity = '0.7'}
        onMouseLeave={e => e.target.style.opacity = '1'}
        >{linkLabel}</Link>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 0.8s ease infinite' }} />
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 16, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
        Loading Games
      </span>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="empty" style={{ paddingTop: '15vh' }}>
      <div className="empty-icon">⚠️</div>
      <div className="empty-title">Server Not Connected</div>
      <div className="empty-sub" style={{ maxWidth: 380, margin: '0 auto' }}>{message}</div>
    </div>
  )
}
