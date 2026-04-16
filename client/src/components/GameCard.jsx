import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TeamLogoImg, TeamLogoFallback } from '../utils/teamLogos.jsx'

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)', UFC: 'var(--ufc)', MLS: 'var(--mls)' }

export default function GameCard({ game, hasReminder, onReminder, style }) {
  const { user } = useAuth()
  const [revealed, setRevealed] = useState(false)

  const color      = SPORT_COLOR[game.sport] || 'var(--red)'
  const isLive     = game.status === 'live'
  const isFinal    = game.status === 'final'
  const spoilerFree = user?.spoilerFree || false
  const blurScore  = spoilerFree && (isFinal || isLive) && !revealed
  const isUpcoming = game.status === 'upcoming'
  const isDelayed  = game.status === 'delayed'
  const isCanceled = game.status === 'canceled'
  const isChamp    = game.is_championship

  const borderColor = isChamp ? 'var(--gold)' : color

  return (
    <Link to={`/games/${game.id}`}>
      <div
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--surface)',
          border: `1px solid ${isChamp ? 'rgba(212,146,10,0.25)' : 'var(--border)'}`,
          borderLeft: `3px solid ${borderColor}`,
          borderRadius: 'var(--radius)',
          padding: '16px 16px 12px',
          cursor: 'pointer',
          transition: 'transform 0.18s, box-shadow 0.18s',
          opacity: isCanceled ? 0.6 : 1,
          animation: isChamp ? 'gold-pulse 3s ease infinite' : 'none',
          ...style
        }}
        onMouseEnter={e => {
          if (isCanceled) return
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 10px 36px rgba(0,0,0,0.45), 0 0 0 1px ${borderColor}35`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Tinted background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isChamp
            ? 'linear-gradient(120deg, rgba(212,146,10,0.07) 0%, transparent 50%)'
            : `linear-gradient(120deg, ${color}09 0%, transparent 55%)`
        }} />

        {/* Row 1: Sport + Championship + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: isChamp ? 'var(--gold)' : color,
              background: isChamp ? 'var(--gold-dim)' : `${color}18`,
              padding: '2px 7px', borderRadius: 4
            }}>{game.sport}</span>
            {isChamp && (
              <span className="badge badge-championship" style={{ fontSize: 9, padding: '1px 6px' }}>
                🏆 Championship
              </span>
            )}
          </div>
          <StatusBadge game={game} />
        </div>

        {/* Rows 2-3: Teams */}
        <div style={{ position: 'relative' }}>
          <TeamRow team={game.awayTeam} score={game.awayScore} isWinning={game.awayScore > game.homeScore} showScore={isLive || isFinal} label="AWAY" sport={game.sport} blurScore={blurScore} />
          <div style={{ height: 5 }} />
          <TeamRow team={game.homeTeam} score={game.homeScore} isWinning={game.homeScore > game.awayScore} showScore={isLive || isFinal} label="HOME" sport={game.sport} blurScore={blurScore} />
          {blurScore && (
            <div
              onClick={e => { e.preventDefault(); e.stopPropagation(); setRevealed(true) }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)'
              }}
            >🙈 Tap to reveal score</div>
          )}
        </div>

        {/* Delayed reason */}
        {isDelayed && game.delayed_reason && (
          <div style={{
            marginTop: 10, padding: '6px 10px',
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--orange)', lineHeight: 1.4
          }}>
            ⚠ {game.delayed_reason}
          </div>
        )}

        {/* Divider + footer */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0 8px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isUpcoming || isDelayed ? `${game.time}` : game.venue}
              {game.broadcast ? ` · ${game.broadcast}` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {/* Watch Now button */}
            {(isLive || isUpcoming || isDelayed) && game.streaming_options?.length > 0 && (
              <a
                href={game.streaming_options[0].web_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 4,
                  background: isLive ? 'var(--red-dim)' : 'var(--surface-3)',
                  border: `1px solid ${isLive ? 'rgba(232,0,29,0.3)' : 'var(--border)'}`,
                  color: isLive ? 'var(--red)' : 'var(--text-3)',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                ▶ Watch
              </a>
            )}

            {/* Remind button */}
            {(isUpcoming || isDelayed) && !isCanceled && (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onReminder?.(game) }}
                style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: hasReminder ? 'var(--green-dim)' : 'var(--red)',
                  color: hasReminder ? 'var(--green)' : '#fff',
                  transition: 'all 0.12s'
                }}
              >
                {hasReminder ? '✓ SET' : '+ REMIND'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function TeamRow({ team, score, isWinning, showScore, label, sport, blurScore }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamLogoImg sport={sport} abbreviation={team.abbreviation} name={team.shortName} size={26} />
        <TeamLogoFallback abbreviation={team.abbreviation} name={team.shortName} size={26} />
        <div>
          <div style={{
            fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15,
            color: (showScore && !isWinning) ? 'var(--text-2)' : 'var(--text)'
          }}>{team.shortName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
            {team.record} · {label}
          </div>
        </div>
      </div>
      {showScore && score != null && (
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1,
          color: isWinning ? 'var(--text)' : 'var(--text-2)', letterSpacing: '0.02em',
          filter: blurScore ? 'blur(8px)' : 'none', userSelect: blurScore ? 'none' : 'auto'
        }}>{score}</span>
      )}
    </div>
  )
}

function StatusBadge({ game }) {
  if (game.status === 'live') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {game.quarter && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}>
          {game.quarter}{game.clock ? ' ' + game.clock : ''}
        </span>
      )}
      <span className="badge badge-live"><span className="live-dot" />LIVE</span>
    </div>
  )
  if (game.status === 'final')   return <span className="badge badge-final">FINAL</span>
  if (game.status === 'delayed') return <span className="badge badge-delayed">⚠ DELAYED</span>
  if (game.status === 'canceled') return <span className="badge badge-canceled">CANCELED</span>
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{game.time}</span>
  )
}
