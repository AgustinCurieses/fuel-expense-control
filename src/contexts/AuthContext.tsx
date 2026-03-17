'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService, User, AuthState } from '@/lib/auth'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  useEffect(() => {
    // Check authentication on mount
    const user = AuthService.getCurrentUser()
    console.log('AuthContext - Initial user check:', user)
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false
    })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const user = await AuthService.login(email, password)
      console.log('AuthContext - Login successful:', user)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      console.log('AuthContext - Login failed:', error)
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
