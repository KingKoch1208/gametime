import { createContext, useContext, useState, useEffect } from 'react'

const LiveContext = createContext({ liveGames: [], liveCount: 0 })

export function LiveProvider({ children }) {
  const [liveGames, setLiveGames] = useState([])

  useEffect(() => {
    const load = () => {
      fetch('/api/games?status=live')
        .then(r => r.json())
        .then(d => setLiveGames(d.games ?? []))
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <LiveContext.Provider value={{ liveGames, liveCount: liveGames.length }}>
      {children}
    </LiveContext.Provider>
  )
}

export const useLive = () => useContext(LiveContext)
