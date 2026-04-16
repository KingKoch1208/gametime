const SPORTS = ['all', 'NFL', 'NBA', 'MLB', 'NHL']
const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)' }

export default function SportFilter({ value, onChange, counts = {} }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {SPORTS.map(sport => {
        const active = value === sport
        const color = SPORT_COLOR[sport] || 'var(--accent)'
        const count = sport === 'all'
          ? Object.values(counts).reduce((s, n) => s + n, 0)
          : (counts[sport] || 0)

        return (
          <button
            key={sport}
            onClick={() => onChange(sport)}
            style={{
              fontFamily: 'var(--font-cond)', fontWeight: 800,
              fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
              border: active ? `1px solid ${color}55` : '1px solid var(--border)',
              background: active ? `${color}18` : 'var(--surface)',
              color: active ? color : 'var(--text-2)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 7
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${color}33` }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {sport === 'all' ? 'All Sports' : sport}
            {count > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                background: active ? `${color}30` : 'var(--surface-2)',
                color: active ? color : 'var(--text-3)',
                borderRadius: 4, padding: '1px 5px'
              }}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
