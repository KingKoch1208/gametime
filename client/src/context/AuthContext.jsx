import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

const BLANK_USER = {
  id: null, email: '', name: '', isGuest: false, isPro: false,
  followedTeams: [], favoriteSports: [], streamingServices: [],
  spoilerFree: false, notifications: true,
  quietHours: { enabled: false, start: null, end: null },
  analyticsConsent: true, theme: 'dark'
}

function load() {
  try {
    const s = localStorage.getItem('gt_user')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function save(u) {
  if (u) localStorage.setItem('gt_user', JSON.stringify(u))
  else localStorage.removeItem('gt_user')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(load)

  const persist = (u) => { setUser(u); save(u) }

  const signUp = (email, password, name) => {
    if (!email || !password) throw new Error('Email and password are required')
    if (password.length < 8) throw new Error('Password must be at least 8 characters')
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      throw new Error('Password needs at least 1 letter and 1 number')
    const u = { ...BLANK_USER, id: 'u_' + Date.now(), email, name: name || email.split('@')[0], createdAt: new Date().toISOString() }
    persist(u)
    return u
  }

  const signIn = (email, password) => {
    if (!email || !password) throw new Error('Enter your email and password')
    // Mock: accept any valid-looking credentials
    const existing = load()
    const u = existing?.email === email
      ? existing
      : { ...BLANK_USER, id: 'u_' + Date.now(), email, name: email.split('@')[0] }
    persist(u)
    return u
  }

  const continueAsGuest = () => {
    persist({ ...BLANK_USER, id: 'guest_' + Date.now(), name: 'Guest', isGuest: true })
  }

  const signOut = () => persist(null)

  const updateUser = (updates) => {
    if (!user) return
    persist({ ...user, ...updates })
  }

  // Toggle isPro for demo purposes
  const togglePro = () => updateUser({ isPro: !user?.isPro })

  // Plan-gated helpers
  const canAddReminder = (currentCount) => {
    if (!user || user.isGuest) return false
    if (user.isPro) return true
    return currentCount < 3
  }

  const canFollowTeam = (currentCount) => {
    if (!user || user.isGuest) return false
    if (user.isPro) return true
    return currentCount < 1
  }

  return (
    <AuthContext.Provider value={{
      user, signUp, signIn, signOut, continueAsGuest, updateUser, togglePro,
      canAddReminder, canFollowTeam,
      isLoggedIn: !!user && !user.isGuest,
      isGuest: user?.isGuest ?? false,
      isPro: user?.isPro ?? false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
