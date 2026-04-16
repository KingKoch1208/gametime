// Vercel serverless entry — wraps Express app
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { games } from '../server/data/games.js'

const app = express()
app.use(cors())
app.use(express.json())

let reminders = []

// ── Games ──────────────────────────────────────────────────

app.get('/api/games', (req, res) => {
  const { sport, status, is_championship, sort, page = 1, page_size = 50 } = req.query
  let result = [...games]

  if (sport && sport !== 'all')
    result = result.filter(g => g.sport.toLowerCase() === sport.toLowerCase())
  if (status && status !== 'all')
    result = result.filter(g => g.status === status)
  if (is_championship === 'true')
    result = result.filter(g => g.is_championship)

  const order = { live: 0, delayed: 1, upcoming: 2, final: 3, canceled: 4 }

  if (sort === 'trending_desc') {
    result.sort((a, b) => (b.trending_score ?? 0) - (a.trending_score ?? 0))
  } else if (sort === 'importance_desc') {
    result.sort((a, b) => (b.importance_level ?? 0) - (a.importance_level ?? 0))
  } else {
    result.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))
  }

  const p = parseInt(page), ps = parseInt(page_size)
  const paginated = result.slice((p - 1) * ps, p * ps)
  res.json({ games: paginated, total: result.length, page: p, page_size: ps })
})

app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id)
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(game)
})

// ── Trending ───────────────────────────────────────────────

app.get('/api/trending', (req, res) => {
  const trending = [...games]
    .filter(g => g.status !== 'canceled')
    .sort((a, b) => (b.trending_score ?? 0) - (a.trending_score ?? 0))
    .slice(0, 20)
  res.json(trending)
})

// ── Sports + Leagues ───────────────────────────────────────

app.get('/api/sports', (req, res) => {
  const map = {}
  games.forEach(g => { map[g.sport] = (map[g.sport] || 0) + 1 })
  res.json(Object.entries(map).map(([name, count]) => ({ name, count })))
})

app.get('/api/leagues', (req, res) => {
  const leagues = [...new Set(games.map(g => g.league))]
    .map(l => ({ name: l, sport: games.find(g => g.league === l)?.sport }))
  res.json(leagues)
})

// ── Teams ──────────────────────────────────────────────────

app.get('/api/teams', (req, res) => {
  const teamMap = {}
  games.forEach(g => {
    const addTeam = (t, side) => {
      if (!teamMap[t.abbreviation]) {
        teamMap[t.abbreviation] = { ...t, sport: g.sport, league: g.league, side }
      }
    }
    addTeam(g.homeTeam, 'home')
    addTeam(g.awayTeam, 'away')
  })
  res.json(Object.values(teamMap).sort((a, b) => a.name.localeCompare(b.name)))
})

app.get('/api/teams/:abbreviation', (req, res) => {
  const abbr = req.params.abbreviation.toUpperCase()
  const teamGames = games.filter(g =>
    g.homeTeam.abbreviation === abbr || g.awayTeam.abbreviation === abbr
  )
  if (!teamGames.length) return res.status(404).json({ error: 'Team not found' })
  const team = teamGames[0].homeTeam.abbreviation === abbr
    ? teamGames[0].homeTeam
    : teamGames[0].awayTeam
  res.json({ ...team, games: teamGames })
})

// ── Reminders ──────────────────────────────────────────────

app.get('/api/reminders', (req, res) => {
  const { user_id } = req.query
  let result = reminders
  if (user_id) result = result.filter(r => r.userId === user_id)
  res.json(result.map(r => ({ ...r, game: games.find(g => g.id === r.gameId) || null })))
})

app.post('/api/reminders', (req, res) => {
  const { gameId, minutesBefore = 30, userId = 'anonymous', type = 'manual' } = req.body
  if (!gameId) return res.status(400).json({ error: 'gameId required' })

  const game = games.find(g => g.id === gameId)
  if (!game) return res.status(404).json({ error: 'Game not found' })
  if (game.status === 'final' || game.status === 'canceled')
    return res.status(400).json({ error: 'Cannot set reminder for finished or canceled games' })

  const exists = reminders.find(r => r.gameId === gameId && r.userId === userId)
  if (exists) return res.status(409).json({ error: 'Reminder already set', reminder: exists })

  const reminder = {
    id: uuidv4(), gameId, userId,
    minutesBefore: Number(minutesBefore),
    type, status: 'active',
    createdAt: new Date().toISOString()
  }
  reminders.push(reminder)
  res.status(201).json({ ...reminder, game })
})

app.patch('/api/reminders/:id', (req, res) => {
  const r = reminders.find(r => r.id === req.params.id)
  if (!r) return res.status(404).json({ error: 'Reminder not found' })
  Object.assign(r, req.body, { updatedAt: new Date().toISOString() })
  res.json({ ...r, game: games.find(g => g.id === r.gameId) })
})

app.delete('/api/reminders/:id', (req, res) => {
  const idx = reminders.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Reminder not found' })
  reminders.splice(idx, 1)
  res.json({ success: true })
})

// ── Search ─────────────────────────────────────────────────

app.get('/api/search', (req, res) => {
  const { q = '' } = req.query
  if (q.length < 2) return res.json([])
  const lower = q.toLowerCase()
  const results = games.filter(g =>
    g.homeTeam.name.toLowerCase().includes(lower) ||
    g.awayTeam.name.toLowerCase().includes(lower) ||
    g.homeTeam.shortName.toLowerCase().includes(lower) ||
    g.awayTeam.shortName.toLowerCase().includes(lower) ||
    g.sport.toLowerCase().includes(lower) ||
    g.venue.toLowerCase().includes(lower) ||
    g.city.toLowerCase().includes(lower) ||
    g.league.toLowerCase().includes(lower)
  )
  res.json(results.slice(0, 12))
})

// ── Health ─────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', games: games.length, reminders: reminders.length, timestamp: new Date().toISOString() })
})

export default app
