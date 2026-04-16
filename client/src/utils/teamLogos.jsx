// ESPN CDN logo URLs — load official team logos wherever possible
const ESPN = 'https://a.espncdn.com/i/teamlogos'

const SPORT_PATH = { NFL: 'nfl', NBA: 'nba', MLB: 'mlb', NHL: 'nhl' }

// Abbreviation overrides where our data differs from ESPN's
const ABBR_OVERRIDE = {
  SF:  'sf',   // 49ers (ESPN uses 'sf')
  TB:  'tb',   // Buccaneers
  TBL: 'tb',   // Lightning
  LV:  'lv',   // Raiders
  LAR: 'lar',  // Rams
  LAC: 'lac',  // Chargers
  LAL: 'lal',  // Lakers
  LAC_NBA: 'lac', // Clippers
  GS:  'gs',   // Warriors
  SA:  'sa',   // Spurs
  NO:  'no',   // Pelicans / Saints
  NE:  'ne',   // Patriots
  NYG: 'nyg',
  NYJ: 'nyj',
  NYY: 'nyy',
  NYM: 'nym',
  NYK: 'ny',   // Knicks
  OKC: 'okc',
  SJ:  'sj',   // Sharks
}

export function getTeamLogoUrl(sport, abbreviation) {
  const path = SPORT_PATH[sport]
  if (!path || !abbreviation) return null
  const abbr = (ABBR_OVERRIDE[abbreviation] ?? abbreviation).toLowerCase()
  return `${ESPN}/${path}/500/${abbr}.png`
}

// Renders as an <img> with initials fallback — use in JSX:
// <TeamLogo sport={game.sport} abbreviation={team.abbreviation} name={team.shortName} size={28} />
export function TeamLogoImg({ sport, abbreviation, name, size = 28, style = {} }) {
  const url = getTeamLogoUrl(sport, abbreviation)
  const initials = (name || abbreviation || '?').slice(0, 2).toUpperCase()

  if (!url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 4,
        background: 'var(--surface-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontWeight: 800,
        fontSize: size * 0.38, color: 'var(--text-3)',
        flexShrink: 0, ...style
      }}>{initials}</div>
    )
  }

  return (
    <img
      src={url}
      alt={name || abbreviation}
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
      onError={e => {
        e.currentTarget.style.display = 'none'
        const fb = e.currentTarget.nextSibling
        if (fb) fb.style.display = 'flex'
      }}
    />
  )
}

// Invisible fallback div — rendered next to the img, hidden by default
export function TeamLogoFallback({ name, abbreviation, size = 28, style = {} }) {
  const initials = (name || abbreviation || '?').slice(0, 2).toUpperCase()
  return (
    <div style={{
      display: 'none',
      width: size, height: size, borderRadius: 4,
      background: 'var(--surface-3)',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)', fontWeight: 800,
      fontSize: size * 0.38, color: 'var(--text-2)',
      flexShrink: 0, ...style
    }}>{initials}</div>
  )
}
