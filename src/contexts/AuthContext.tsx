'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { AuthService, User, AuthState } from '@/lib/auth'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      AuthService.logout()
    }, INACTIVITY_TIMEOUT_MS)
  }

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false
    })

    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
      events.forEach(e => window.addEventListener(e, resetInactivityTimer))
      resetInactivityTimer()
      return () => {
        events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const user = await AuthService.login(email, password)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = () => {
    AuthService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
