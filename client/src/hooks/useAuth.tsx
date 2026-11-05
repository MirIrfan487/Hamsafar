import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, tokenStorage } from '../services/api'
import { authApi, type CurrentUser } from '../services/auth'

// AuthContext shares "who is logged in" with every page.
// Any component can call useAuth() to read the user or to log in / log out.

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean // true while we check a saved token on page load
  login: (email: string, password: string) => Promise<CurrentUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On page load: if a token is saved, ask the API who it belongs to
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch((e) => {
        // 401 = token expired or invalid -> forget it
        if (e instanceof ApiError && e.status === 401) tokenStorage.clear()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    tokenStorage.set(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
