import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import GameCard from '../components/GameCard'
import Logo from '../components/Logo'
import ReminderModal from '../components/ReminderModal'
import UpgradeModal from '../components/UpgradeModal'
import { getGames, getReminders, createReminder } from '../api'
import { TeamLogoImg, TeamLogoFallback } from '../utils/teamLogos.jsx'

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)', UFC: 'var(--ufc)' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, canAddReminder } = useAuth()
  const { isDark } = useTheme()
  const [games, setGames]           = useState([])
  const [reminders, setReminders]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    Promise.all([getGames(), getReminders()])
      .then(([{ games: g }, r]) => { setGames(g); setReminders(r) })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false))
  }, [])

  const reminderIds = new Set(reminders.map(r => r.gameId))
  const liveGames   = games.filter(g => g.status === 'live')
  const myRemGames  = reminders.map(r => r.game).filter(Boolean).filter(g => g.status !== 'final')
  const featured    = games.filter(g => g.featured).slice(0, 3)
  const upcoming    = games.filter(g => g.status === 'upcoming' && !g.featured).slice(0, 6)

  // Streaming games (games on user's services)
  const myServices = user?.streamingServices || []
  const streamingGames = games.filter(g =>
    g.status !== 'final' && g.status !== 'canceled' &&
    g.streaming_options?.some(s => myServices.includes(s.provider_id))
  ).slice(0, 6)

  const handleReminder = (game) => {
    const active = reminders.filter(r => r.game?.status !== 'final' && r.status === 'active')
    if (!canAddReminder(active.length)) {
      setUpgradeReason(`You've used all 3 of your free reminder slots. Upgrade to Pro for unlimited reminders.`)
      setShowUpgrade(true)
      return
    }
    setSelected(game)
  }

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setSelected(null)
    } catch (err) {
      if (err.data?.error === 'Reminder already set') setSelected(null)
    } finally { setSaving(false) }
  }

  if (loading) return <Loader />
  if (error) return <ErrorState msg={error} />

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 36 }}>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Logo size={32} variant={isDark ? 'dark' : 'light'} />
            <p style={{ fontFamily: 'var(--font-cond)', fontSize: 14, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              {getGreeting()},
            </p>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '0.04em', color: 'var(--text)' }}>
            {user?.name?.split(' ')[0] || 'Fan'}.
          </h1>
          {user?.isPro && (
            <span style={{
              display: 'inline-block', marginTop: 8,
              background: 'var(--gold)', color: '#000',
              fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 11,
              letterSpacing: '0.15em', padding: '3px 10px', borderRadius: 4
            }}>⭐ PRO MEMBER</span>
          )}
        </div>

        {/* Section 1: Live Now — MOST PROMINENT, always at top */}
        {liveGames.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHD title={<><span className="live-dot" style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />Live Now — {liveGames.length} game{liveGames.length > 1 ? 's' : ''}</>} />
            <div className="grid-cards">
              {liveGames.map((g, i) => (
                <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={handleReminder} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Active Reminders */}
        {myRemGames.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHD title="Your Upcoming Reminders" link="/reminders" linkLabel={`${myRemGames.length} set →`} />
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {reminders.filter(r => r.game && r.game.status !== 'final').map((reminder, i) => (
                <ReminderChip key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </section>
        )}

        {/* Plan usage (basic users) */}
        {!user?.isPro && (
          <div style={{
            marginBottom: 28, padding: '12px 16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Basic Plan · {reminders.length}/3 reminders used
              </span>
              <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, width: 160, marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, background: reminders.length >= 3 ? 'var(--red)' : 'var(--green)', width: `${(reminders.length / 3) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
            <button onClick={() => { setUpgradeReason('Upgrade to Pro for unlimited reminders, widgets, and more.'); setShowUpgrade(true) }}
              className="btn btn-outline" style={{ fontSize: 12, padding: '6px 14px' }}>
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Section 2: Featured */}
        {featured.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHD title="Featured Tonight" link="/games" linkLabel="All Games →" />
            <div className="grid-featured">
              {featured.map((game, i) => (
                <FeaturedCard key={game.id} game={game} hasReminder={reminderIds.has(game.id)} onReminder={handleReminder} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Streaming games */}
        {streamingGames.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHD title="On Your Services" />
            <div className="grid-cards">
              {streamingGames.map((g, i) => (
                <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={handleReminder} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Upcoming */}
        <section style={{ marginBottom: 40 }}>
          <SectionHD title="Coming Up" link="/games" linkLabel="See all →" />
          <div className="grid-cards">
            {upcoming.map((g, i) => (
              <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={handleReminder} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected && <ReminderModal game={selected} loading={saving} onConfirm={handleConfirm} onClose={() => setSelected(null)} />}
      {showUpgrade && <UpgradeModal triggerReason={upgradeReason} onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}

function ReminderChip({ reminder }) {
  const game = reminder.game
  const color = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)', UFC: 'var(--ufc)' }[game?.sport] || 'var(--red)'
  if (!game) return null
  return (
    <Link to={`/games/${game.id}`}>
      <div style={{
        flexShrink: 0, padding: '12px 16px',
        background: 'var(--surface)', border: `1px solid ${color}30`,
        borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius)',
        minWidth: 200, cursor: 'pointer',
        transition: 'transform 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
      >
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
          {game.awayTeam.shortName} vs {game.homeTeam.shortName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{game.time}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, background: `${color}18`, padding: '1px 6px', borderRadius: 3 }}>
            ⏰ {reminder.minutesBefore}m before
          </span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedCard({ game, hasReminder, onReminder, style }) {
  const color = SPORT_COLOR[game.sport] || 'var(--red)'
  const isLive = game.status === 'live'
  const isChamp = game.is_championship

  return (
    <Link to={`/games/${game.id}`}>
      <div className="fade-up" style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${game.homeTeam.color}1e 0%, ${game.awayTeam.color}1e 100%), var(--surface-2)`,
        border: `1px solid ${isChamp ? 'rgba(212,146,10,0.35)' : `${color}28`}`,
        borderRadius: 'var(--radius-lg)', padding: '24px 24px 18px',
        cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
        animation: isChamp ? 'gold-pulse 3s ease infinite' : 'none', ...style
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.5)` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: isChamp ? 'var(--gold)' : color }}>
              {game.sport}
            </span>
            {isChamp && <span className="badge badge-championship" style={{ fontSize: 10 }}>🏆 Championship</span>}
          </div>
          {isLive
            ? <span className="badge badge-live"><span className="live-dot" />LIVE · {game.quarter}{game.clock ? ' ' + game.clock : ''}</span>
            : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{game.date} · {game.time}</span>
          }
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
          <ScoreBlock team={game.awayTeam} score={game.awayScore} isWinning={game.awayScore > game.homeScore} showScore={isLive || game.status === 'final'} sport={game.sport} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-3)', letterSpacing: '0.06em' }}>VS</div>
          <ScoreBlock team={game.homeTeam} score={game.homeScore} isWinning={game.homeScore > game.awayScore} showScore={isLive || game.status === 'final'} isHome sport={game.sport} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            {game.venue} {game.broadcast ? `· ${game.broadcast}` : ''}
          </span>
          {game.status === 'upcoming' && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onReminder?.(game) }} style={{
              fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: hasReminder ? 'var(--green-dim)' : 'var(--red)',
              color: hasReminder ? 'var(--green)' : '#fff', transition: 'all 0.15s', flexShrink: 0
            }}>
              {hasReminder ? '✓ Reminder Set' : '⏰ Set Reminder'}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

function ScoreBlock({ team, score, isWinning, showScore, isHome, sport }) {
  return (
    <div style={{ textAlign: isHome ? 'right' : 'left', minWidth: 110 }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: isHome ? 'flex-end' : 'flex-start' }}>
        <TeamLogoImg sport={sport} abbreviation={team.abbreviation} name={team.shortName} size={36} />
        <TeamLogoFallback abbreviation={team.abbreviation} name={team.shortName} size={36} />
      </div>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 17, letterSpacing: '0.04em', marginBottom: 2 }}>{team.shortName.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{team.record} · {isHome ? 'HOME' : 'AWAY'}</div>
      {showScore && score != null && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, color: isWinning ? 'var(--text)' : 'var(--text-2)', letterSpacing: '0.02em' }}>{score}</div>
      )}
    </div>
  )
}

function SectionHD({ title, link, linkLabel }) {
  return (
    <div className="section-hd">
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{title}</div>
      {link && <Link to={link} style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: 'var(--red)', letterSpacing: '0.05em' }}>{linkLabel}</Link>}
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-dot 0.8s ease infinite' }} />
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 16, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Loading</span>
    </div>
  )
}

function ErrorState({ msg }) {
  return (
    <div className="empty" style={{ paddingTop: '15vh' }}>
      <div className="empty-icon">⚠️</div>
      <div className="empty-title">Server Not Connected</div>
      <div className="empty-sub">{msg}</div>
    </div>
  )
}
