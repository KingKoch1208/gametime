import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import GameCard from '../components/GameCard'
import SportFilter from '../components/SportFilter'
import Logo from '../components/Logo'
import ReminderModal from '../components/ReminderModal'
import { useTheme } from '../context/ThemeContext'
import { getReminders, createReminder } from '../api'

const STATUS_OPTS = ['all', 'live', 'upcoming', 'final', 'delayed', 'canceled']
const LEAGUE_OPTS = ['all', 'NFL', 'NBA', 'MLB', 'NHL', 'UFC', 'MLS']
const STREAMING_OPTS = [
  { id: 'espn_plus', label: 'ESPN+' },
  { id: 'peacock', label: 'Peacock' },
  { id: 'paramount_plus', label: 'Paramount+' },
  { id: 'apple_tv', label: 'Apple TV+' },
  { id: 'max', label: 'Max' },
  { id: 'youtube_tv', label: 'YouTube TV' },
]

export default function Discover() {
  const { isDark } = useTheme()
  const [params, setParams] = useSearchParams()
  const [allGames, setAllGames]   = useState([])
  const [reminders, setReminders] = useState([])
  const [query, setQuery]         = useState(params.get('q') || '')
  const [sport, setSport]         = useState(params.get('sport') || 'all')
  const [status, setStatus]       = useState(params.get('status') || 'all')
  const [streaming, setStreaming] = useState(params.get('streaming') || '')
  const [league, setLeague]       = useState(params.get('league') || 'all')
  const [selected, setSelected]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [recentSearches, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gt_searches') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/games?page_size=100').then(r => r.json()),
      getReminders()
    ]).then(([{ games }, r]) => { setAllGames(games); setReminders(r) })
    .finally(() => setLoading(false))
  }, [])

  // Sync URL params
  useEffect(() => {
    const p = {}
    if (query) p.q = query
    if (sport !== 'all') p.sport = sport
    if (status !== 'all') p.status = status
    if (streaming) p.streaming = streaming
    if (league !== 'all') p.league = league
    setParams(p, { replace: true })
  }, [query, sport, status, streaming])

  const saveSearch = (q) => {
    if (!q.trim() || recentSearches.includes(q)) return
    const updated = [q, ...recentSearches].slice(0, 6)
    setRecent(updated)
    localStorage.setItem('gt_searches', JSON.stringify(updated))
  }

  const reminderIds = new Set(reminders.map(r => r.gameId))
  const sportCounts = allGames.reduce((a, g) => { a[g.sport] = (a[g.sport] || 0) + 1; return a }, {})

  const filtered = allGames.filter(g => {
    const q = query.toLowerCase().trim()
    const matchQ = !q ||
      g.homeTeam.name.toLowerCase().includes(q) ||
      g.awayTeam.name.toLowerCase().includes(q) ||
      g.homeTeam.shortName.toLowerCase().includes(q) ||
      g.awayTeam.shortName.toLowerCase().includes(q) ||
      g.sport.toLowerCase().includes(q) ||
      g.venue.toLowerCase().includes(q) ||
      g.city.toLowerCase().includes(q) ||
      g.league.toLowerCase().includes(q)
    const matchSport     = sport === 'all' || g.sport === sport
    const matchStatus    = status === 'all' || g.status === status
    const matchStreaming = !streaming || g.streaming_options?.some(s => s.provider_id === streaming)
    const matchLeague    = league === 'all' || g.league === league
    return matchQ && matchSport && matchStatus && matchStreaming && matchLeague
  })

  const handleConfirm = async (gameId, minutesBefore) => {
    setSaving(true)
    try {
      const r = await createReminder(gameId, minutesBefore)
      setReminders(prev => [...prev, r])
      setSelected(null)
    } catch { setSelected(null) }
    finally { setSaving(false) }
  }

  const clearFilters = () => { setQuery(''); setSport('all'); setStatus('all'); setStreaming(''); setLeague('all') }
  const hasFilters = query || sport !== 'all' || status !== 'all' || streaming || league !== 'all'

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <Logo size={36} variant={isDark ? 'dark' : 'light'} style={{ marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 68px)', letterSpacing: '0.04em', lineHeight: 0.95, marginBottom: 8 }}>
            DISCOVER
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-3)' }}>
            Search teams, leagues, and games across every sport
          </p>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 18, pointerEvents: 'none' }}>
            🔍
          </div>
          <input
            ref={inputRef}
            className="input"
            style={{ paddingLeft: 46, paddingRight: query ? 44 : 16, fontSize: 16, borderRadius: 12 }}
            placeholder="Search teams, games, sports, venues…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && query.trim()) saveSearch(query.trim()) }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>✕</button>
          )}
        </div>

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Recent Searches
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recentSearches.map(s => (
                <button key={s} onClick={() => { setQuery(s); inputRef.current?.focus() }} style={{
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  padding: '5px 12px', borderRadius: 20,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >🕐 {s}</button>
              ))}
              <button onClick={() => { setRecent([]); localStorage.removeItem('gt_searches') }} style={{
                fontFamily: 'var(--font-body)', fontSize: 12, padding: '5px 10px', borderRadius: 20,
                background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer'
              }}>Clear</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: 24 }}>
          <SportFilter value={sport} onChange={setSport} counts={sportCounts} />
          <div style={{ height: 12 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status */}
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUS_OPTS.map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                  background: status === s ? 'var(--surface-3)' : 'transparent',
                  color: status === s ? 'var(--text)' : 'var(--text-3)',
                  border: status === s ? '1px solid var(--border-2)' : '1px solid transparent',
                  transition: 'all 0.12s'
                }}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

            {/* Streaming filter */}
            <select
              value={streaming}
              onChange={e => setStreaming(e.target.value)}
              style={{
                background: streaming ? 'var(--red-dim)' : 'var(--surface)',
                border: `1px solid ${streaming ? 'rgba(232,0,29,0.3)' : 'var(--border)'}`,
                color: streaming ? 'var(--red)' : 'var(--text-3)',
                borderRadius: 5, padding: '5px 10px', cursor: 'pointer',
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase'
              }}
            >
              <option value="">All Streaming</option>
              {STREAMING_OPTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            {/* League filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {LEAGUE_OPTS.map(l => (
                <button key={l} onClick={() => setLeague(l)} style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                  background: league === l ? 'var(--surface-3)' : 'transparent',
                  color: league === l ? 'var(--text)' : 'var(--text-3)',
                  border: league === l ? '1px solid var(--border-2)' : '1px solid transparent',
                  transition: 'all 0.12s'
                }}>{l === 'all' ? 'All Leagues' : l}</button>
              ))}
            </div>

            {hasFilters && (
              <button onClick={clearFilters} style={{
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-3)', transition: 'all 0.12s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
              >✕ Clear All</button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
          {loading ? 'Searching…' : `${filtered.length} game${filtered.length !== 1 ? 's' : ''} found`}
          {query && <span> for "<span style={{ color: 'var(--text-2)' }}>{query}</span>"</span>}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid-cards">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No matching games</div>
            <div className="empty-sub">
              {query ? `No results for "${query}" — try a team name, sport, or city` : 'Try a different filter combination'}
            </div>
          </div>
        ) : (
          <div className="grid-cards">
            {filtered.map((g, i) => (
              <div key={g.id} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                <GameCard game={g} hasReminder={reminderIds.has(g.id)} onReminder={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <ReminderModal game={selected} loading={saving} onConfirm={handleConfirm} onClose={() => setSelected(null)} />}
    </div>
  )
}
