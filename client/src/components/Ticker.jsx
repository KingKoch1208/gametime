import { useLive } from '../context/LiveContext'

export default function Ticker() {
  const { liveGames } = useLive()
  const duration = Math.max(20, liveGames.length * 9)

  const buildText = (games) =>
    games.map(g => {
      const score = (g.homeScore != null && g.awayScore != null)
        ? `${g.awayTeam.abbreviation} ${g.awayScore}  —  ${g.homeTeam.abbreviation} ${g.homeScore}`
        : `${g.awayTeam.abbreviation} vs ${g.homeTeam.abbreviation}`
      const clock = g.quarter ? `  ${g.quarter}${g.clock ? ' ' + g.clock : ''}` : ''
      return `${g.sport}  ·  ${score}${clock}`
    }).join('          ◆          ')

  const text = buildText(liveGames)

  return (
    <div style={{
      position: 'fixed',
      top: 'var(--nav-h)', left: 0, right: 0,
      height: 'var(--ticker-h)', zIndex: 199,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* LIVE pill */}
      <div style={{
        flexShrink: 0,
        height: '100%', padding: '0 16px',
        background: 'var(--live)',
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#fff', animation: 'pulse-dot 1s ease infinite'
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 16,
          letterSpacing: '0.1em', color: '#fff', lineHeight: 1
        }}>LIVE</span>
      </div>

      {/* Scrolling scores */}
      {liveGames.length > 0 ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            display: 'inline-flex',
            animation: `ticker-scroll ${duration}s linear infinite`,
            whiteSpace: 'nowrap'
          }}>
            {[text, text].map((t, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-2)', letterSpacing: '0.05em',
                padding: '0 48px'
              }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <span style={{
          padding: '0 20px',
          fontFamily: 'var(--font-cond)', fontSize: 12,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--text-3)'
        }}>
          No live games right now — check back soon
        </span>
      )}
    </div>
  )
}
