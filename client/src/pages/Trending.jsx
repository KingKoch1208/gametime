import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GameCard from '../components/GameCard'
import Logo from '../components/Logo'
import ReminderModal from '../components/ReminderModal'
import { useTheme } from '../context/ThemeContext'
import { getReminders, createReminder } from '../api'

export default function Trending() {
  const { isDark } = useTheme()
  const [trending, setTrending]   = useState([])
  const [reminders, setReminders] = useState([])
  const [selected, setSelected]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/trending').then(r => r.json()),
      getReminders()
    ]).then(([t, r]) => { setTrending(t); setReminders(r) })
    .finally(() => setLoading(false))
  }, [])

  const reminderIds = new Set(reminders.map(r => r.gameId))
  const live    = trending.filter(g => g.status === 'live')
  const rest    = trending.filter(g => g.status !== 'live')

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setSelected(null)
    } catch { setSelected(null) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Logo size={36} variant={isDark ? 'dark' : 'light'} style={{ marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 7vw, 80px)', letterSpacing: '0.04em', lineHeight: 0.9, marginBottom: 12 }}>
            TRENDING<br /><span style={{ color: 'var(--red)' }}>NOW</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-3)', maxWidth: 480 }}>
            The hottest games ranked by excitement — championship stakes, close scores, and fan interest.
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={10} />
        ) : (
          <>
            {/* Live games first */}
            {live.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div className="section-hd">
                  <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="live-dot" />
                    Live & Heating Up
                  </div>
                </div>
                <div className="grid-cards">
                  {live.map((g, i) => (
                    <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s`, position: 'relative' }}>
                      <TrendingRank rank={trending.indexOf(g) + 1} score={g.trending_score} />
                      <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Championship games */}
            {trending.filter(g => g.is_championship && g.status !== 'live').length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div className="section-hd">
                  <div className="section-title">🏆 Championship Games</div>
                </div>
                <div className="grid-cards">
                  {trending.filter(g => g.is_championship && g.status !== 'live').map((g, i) => (
                    <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.08}s`, position: 'relative' }}>
                      <TrendingRank rank={trending.indexOf(g) + 1} score={g.trending_score} />
                      <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Full ranked list */}
            <section>
              <div className="section-hd">
                <div className="section-title">Full Trending List</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trending.map((game, i) => (
                  <TrendingRow key={game.id} game={game} rank={i + 1} hasReminder={reminderIds.has(game.id)} onReminder={setSelected} delay={i * 0.04} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {selected && <ReminderModal game={selected} loading={saving} onConfirm={handleConfirm} onClose={() => setSelected(null)} />}
    </div>
  )
}

function TrendingRank({ rank, score }) {
  const label = rank === 1 ? '🔥 #1 Trending' : rank === 2 ? '📈 #2 Trending' : rank === 3 ? '⚡ #3 Trending' : `#${rank} Trending`
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 2,
      background: rank <= 3 ? 'var(--red)' : 'var(--surface-3)',
      border: rank <= 3 ? 'none' : '1px solid var(--border)',
      borderRadius: 5, padding: '3px 9px'
    }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontWeight: 700,
        fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: rank <= 3 ? '#fff' : 'var(--text-3)'
      }}>{label}</span>
    </div>
  )
}

function TrendingRow({ game, rank, hasReminder, onReminder, delay }) {
  const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)', UFC: 'var(--ufc)' }
  const color = SPORT_COLOR[game.sport] || 'var(--red)'
  const isLive = game.status === 'live'

  return (
    <Link to={`/games/${game.id}`}>
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${game.is_championship ? 'var(--gold)' : color}`,
        borderRadius: 'var(--radius)', padding: '14px 16px',
        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        animationDelay: `${delay}s`
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.25)` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        {/* Rank */}
        <div style={{
          width: 48, flexShrink: 0, textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: rank <= 3 ? 26 : 18,
            color: rank === 1 ? 'var(--red)' : rank <= 3 ? 'var(--text-2)' : 'var(--text-3)',
          }}>#{rank}</div>
          {rank <= 3 && (
            <div style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 8,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: rank === 1 ? 'var(--red)' : 'var(--text-3)', marginTop: 2
            }}>{rank === 1 ? 'HOT' : rank === 2 ? 'RISING' : 'TOP'}</div>
          )}
        </div>

        {/* Teams */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
              {game.awayTeam.shortName} vs {game.homeTeam.shortName}
            </span>
            {game.is_championship && <span style={{ fontSize: 14 }}>🏆</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color }}>
              {game.sport} · {game.league}
            </span>
            {isLive && (
              <span className="badge badge-live" style={{ fontSize: 9, padding: '1px 6px' }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} />LIVE · {game.quarter}
              </span>
            )}
            {game.status === 'final' && <span className="badge badge-final" style={{ fontSize: 9, padding: '1px 6px' }}>FINAL</span>}
            {game.is_championship && <span className="badge badge-championship" style={{ fontSize: 9, padding: '1px 6px' }}>🏆 Championship</span>}
          </div>
        </div>

        {/* Score or time */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isLive && game.homeScore != null ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.02em', color: 'var(--text)' }}>
              {game.awayScore} — {game.homeScore}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{game.time}</div>
          )}
        </div>

        {/* Trending score bar */}
        <div style={{ flexShrink: 0, width: 50, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: game.trending_score >= 80 ? 'var(--red)' : 'var(--text-3)', letterSpacing: '0.02em' }}>
            {game.trending_score}
          </div>
          <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, marginTop: 4 }}>
            <div style={{ height: '100%', background: 'var(--red)', borderRadius: 2, width: `${game.trending_score}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)' }} />
      ))}
    </div>
  )
}
