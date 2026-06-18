export interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'editor' | 'viewer'
  isActive: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export class AuthService {
  private static readonly USER_KEY = 'fuel_control_user'

  static async login(email: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Credenciales inválidas')
    }

    const user: User = await res.json()
    this.setUser(user)
    return user
  }

  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch {}
    localStorage.removeItem(this.USER_KEY)
    window.location.href = '/login'
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    try {
      const userStr = localStorage.getItem(this.USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  private static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  static getInitialAuthState(): AuthState {
    const user = this.getCurrentUser()
    return {
      user,
      isAuthenticated: !!user,
      isLoading: false
    }
  }
}
