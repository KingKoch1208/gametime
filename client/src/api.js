const BASE = '/api'

export async function getGames({ sport = null, status = null } = {}) {
  const params = new URLSearchParams()
  if (sport && sport !== 'all') params.set('sport', sport)
  if (status) params.set('status', status)
  const res = await fetch(`${BASE}/games?${params}`)
  if (!res.ok) throw new Error('Failed to load games')
  return res.json()
}

export async function getGame(id) {
  const res = await fetch(`${BASE}/games/${id}`)
  if (!res.ok) throw new Error('Game not found')
  return res.json()
}

export async function getSports() {
  const res = await fetch(`${BASE}/sports`)
  if (!res.ok) throw new Error('Failed to load sports')
  return res.json()
}

export async function getReminders() {
  const res = await fetch(`${BASE}/reminders`)
  if (!res.ok) throw new Error('Failed to load reminders')
  return res.json()
}

export async function createReminder(gameId, minutesBefore = 30) {
  const res = await fetch(`${BASE}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, minutesBefore })
  })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error || 'Failed to create reminder'), { data })
  return data
}

export async function deleteReminder(id) {
  const res = await fetch(`${BASE}/reminders/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete reminder')
  return res.json()
}
