import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReminderModal from '../components/ReminderModal'
import { useAuth } from '../context/AuthContext'
import { getGame, getReminders, createReminder, deleteReminder } from '../api'
import { TeamLogoImg, TeamLogoFallback } from '../utils/teamLogos'

const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)' }

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, updateUser, canFollowTeam } = useAuth()
  const [game, setGame]               = useState(null)
  const [reminders, setReminders]     = useState([])
  const [showModal, setShowModal]     = useState(false)
  const [showSpoiler, setShowSpoiler] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([getGame(id), getReminders()])
      .then(([g, r]) => { setGame(g); setReminders(r) })
      .catch(() => navigate('/games'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--text-3)' }}>LOADING…</span>
    </div>
  )
  if (!game) return null

  const color       = SPORT_COLOR[game.sport] || 'var(--accent)'
  const isLive      = game.status === 'live'
  const isFinal     = game.status === 'final'
  const isUpcoming  = game.status === 'upcoming'
  const myReminder  = reminders.find(r => r.gameId === game.id)

  const followedTeams = user?.followedTeams || []
  const isFollowingHome = followedTeams.includes(game.homeTeam.abbreviation)
  const isFollowingAway = followedTeams.includes(game.awayTeam.abbreviation)

  const followTeam = (abbreviation) => {
    if (followedTeams.includes(abbreviation)) {
      updateUser({ followedTeams: followedTeams.filter(t => t !== abbreviation) })
    } else if (canFollowTeam(followedTeams.length)) {
      updateUser({ followedTeams: [...followedTeams, abbreviation] })
    }
  }

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setShowModal(false)
    } catch {
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!myReminder) return
    await deleteReminder(myReminder.id)
    setReminders(prev => prev.filter(r => r.id !== myReminder.id))
  }

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Post-Game Spoiler Popup ─────────────── */}
      {isFinal && !showSpoiler && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24
        }}>
          <div className="scale-in" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '36px 32px',
            maxWidth: 400, width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏁</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.04em', marginBottom: 10 }}>
              GAME OVER
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6 }}>
              This game has ended. Do you want to see the final score?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSpoiler(true)}
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '11px 24px', borderRadius: 8, border: 'none',
                  background: 'var(--red)', color: '#fff', cursor: 'pointer'
                }}
              >View Final Score</button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '11px 24px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-2)', cursor: 'pointer'
                }}
              >Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Back Button ─────────────────────────── */}
      <div className="container" style={{ paddingTop: 28, paddingBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text-3)', padding: '7px 14px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          ← Back
        </button>
      </div>

      {/* ── Hero Header ─────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${game.homeTeam.color}22 0%, ${game.awayTeam.color}22 100%)`,
        borderTop: `1px solid ${color}28`,
        borderBottom: `1px solid ${color}28`,
        padding: '44px 0 36px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', left: '15%', top: '50%', transform: 'translateY(-50%)',
          width: 300, height: 300,
          background: `radial-gradient(circle, ${game.awayTeam.color}18 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-50%)',
          width: 300, height: 300,
          background: `radial-gradient(circle, ${game.homeTeam.color}18 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative' }}>
          {/* Sport / venue */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{
              fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.2em', textTransform: 'uppercase', color
            }}>{game.sport}</span>
            <span style={{ margin: '0 10px', color: 'var(--text-3)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
              {game.venue}, {game.city}
            </span>
          </div>

          {/* Score block */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 0, maxWidth: 640, margin: '0 auto'
          }}>
            <TeamHero team={game.awayTeam} score={game.awayScore}
              isWinning={game.awayScore > game.homeScore}
              showScore={isLive || isFinal} align="left" />

            {/* Center divider */}
            <div style={{
              flex: '0 0 120px', textAlign: 'center', padding: '0 10px'
            }}>
              {isLive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-live" style={{ fontSize: 13, padding: '5px 14px' }}>
                    <span className="live-dot" />
                    LIVE
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>
                    {game.quarter}
                  </span>
                  {game.clock && (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text)', letterSpacing: '0.04em' }}>
                      {game.clock}
                    </span>
                  )}
                </div>
              ) : isFinal ? (
                <span className="badge badge-final" style={{ fontSize: 13, padding: '5px 14px' }}>FINAL</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.06em', color: 'var(--text-3)' }}>VS</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{game.time}</span>
                </div>
              )}
            </div>

            <TeamHero team={game.homeTeam} score={game.homeScore}
              isWinning={game.homeScore > game.awayScore}
              showScore={isLive || isFinal} align="right" isHome />
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────── */}
      <div className="container" style={{ paddingTop: 36, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>

        {/* Left: Info */}
        <div>
          {/* Description */}
          {game.description && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${color}`,
              borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 20
            }}>
              <div style={{
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--text-3)', marginBottom: 10
              }}>Matchup Preview</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
                {game.description}
              </p>
            </div>
          )}

          {/* Game info grid */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 20
          }}>
            <div style={{
              fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-3)', marginBottom: 16
            }}>Game Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                { label: 'Date',       value: game.date },
                { label: 'Time',       value: game.time },
                { label: 'Venue',      value: game.venue },
                { label: 'City',       value: game.city },
                { label: 'Broadcast',  value: game.broadcast || '—' },
                { label: 'Streaming',  value: game.streaming?.length ? game.streaming.join(', ') : '—' },
                { label: 'Status',     value: game.status.charAt(0).toUpperCase() + game.status.slice(1) },
                { label: 'League',     value: game.sport },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {game.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {game.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: 4,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-3)'
                }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right: CTA Panel */}
        <div>
          <div style={{
            background: 'var(--surface)', border: `1px solid ${color}28`,
            borderRadius: 'var(--radius-lg)', padding: '24px',
            position: 'sticky', top: 116
          }}>
            {/* Win Probability */}
            {(isLive || isFinal) && game.win_probability_home != null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                  Win Probability
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>{game.awayTeam.shortName} {game.win_probability_away}%</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>{game.win_probability_home}% {game.homeTeam.shortName}</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${game.win_probability_away}%`, background: 'var(--red)', transition: 'width 0.6s' }} />
                  <div style={{ flex: 1, background: 'var(--text-3)' }} />
                </div>
              </div>
            )}

            {/* Team records + Follow */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
                Records
              </div>
              {[
                { team: game.awayTeam, label: 'AWAY', isFollowing: isFollowingAway },
                { team: game.homeTeam, label: 'HOME', isFollowing: isFollowingHome },
              ].map(({ team, label, isFollowing }, i) => (
                <div key={team.abbreviation} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i === 0 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamLogoImg sport={game.sport} abbreviation={team.abbreviation} name={team.shortName} size={22} />
                    <TeamLogoFallback abbreviation={team.abbreviation} name={team.shortName} size={22} />
                    <div>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{team.shortName}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginLeft: 6 }}>{label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{team.record}</span>
                    {user && (
                      <button
                        onClick={() => followTeam(team.abbreviation)}
                        title={isFollowing ? 'Unfollow team' : 'Follow team'}
                        style={{
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '3px 9px', borderRadius: 4, cursor: 'pointer',
                          border: `1px solid ${isFollowing ? 'rgba(232,0,29,0.35)' : 'var(--border)'}`,
                          background: isFollowing ? 'var(--red-dim)' : 'transparent',
                          color: isFollowing ? 'var(--red)' : 'var(--text-3)',
                          transition: 'all 0.15s'
                        }}
                      >{isFollowing ? '✓ Following' : '+ Follow'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reminder CTA */}
            {isUpcoming && (
              <div>
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />
                {myReminder ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15,
                      color: 'var(--green)', marginBottom: 8, letterSpacing: '0.05em'
                    }}>✓ Reminder Set!</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
                      {myReminder.minutesBefore} min before kickoff
                    </div>
                    <button
                      onClick={handleRemove}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 7,
                        fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--live)'; e.currentTarget.style.color = 'var(--live)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
                    >
                      Remove Reminder
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 8, border: 'none',
                      cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 800,
                      fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase',
                      background: color, color: '#000', transition: 'filter 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    ⏰  Set Reminder
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ReminderModal game={game} loading={saving} onConfirm={handleConfirm} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function TeamHero({ team, score, isWinning, showScore, align, isHome }) {
  return (
    <div style={{ flex: 1, textAlign: align, padding: '0 20px' }}>
      <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>{team.logo}</div>
      <div style={{
        fontFamily: 'var(--font-cond)', fontWeight: 900,
        fontSize: 28, letterSpacing: '0.04em', color: 'var(--text)', marginBottom: 4
      }}>{team.shortName.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
        {team.record} · {isHome ? 'HOME' : 'AWAY'}
      </div>
      {showScore && score != null && (
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 72, lineHeight: 1,
          color: isWinning ? 'var(--text)' : 'var(--text-2)',
          letterSpacing: '0.02em'
        }}>{score}</div>
      )}
    </div>
  )
}
