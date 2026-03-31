export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export class AuthService {
  private static readonly USER_KEY = 'fuel_control_user'
  private static readonly MOCK_USER: User = {
    id: '1',
    email: 'admin@fuelcontrol.com',
    name: 'Administrator',
    role: 'admin'
  }

  static async login(email: string, password: string): Promise<User> {
    // Mock authentication - replace with real API call
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay

    if (email === 'admin' && password === 'admin') {
      const user = this.MOCK_USER
      this.setUser(user)
      return user
    }

    throw new Error('Invalid credentials')
  }

  static logout(): void {
    localStorage.removeItem(this.USER_KEY)
    window.location.href = '/login'
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userStr = localStorage.getItem(this.USER_KEY)
      const user = userStr ? JSON.parse(userStr) : null
      return user
    } catch (error) {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  private static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
      // Verify it was saved
      const saved = localStorage.getItem(this.USER_KEY)
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