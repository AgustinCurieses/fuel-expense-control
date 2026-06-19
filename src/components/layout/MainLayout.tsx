'use client'

import { useEffect, useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

type UserRole = 'admin' | 'editor' | 'viewer'

const routeTitles: Record<string, string> = {
  '/':               'Panel de Control',
  '/import':         'Cargar Datos',
  '/reports':        'Reportes',
  '/alerts':         'Alertas',
  '/areas':          'Gestión de Áreas',
  '/cards':          'Tarjetas',
  '/settings/mapper':'Configuración',
  '/admin':          'Administración',
  '/superadmin':     'Super Admin',
}

// Minimum role required to access each route prefix
const ROUTE_PERMISSIONS: Array<{ prefix: string; minRole: UserRole }> = [
  { prefix: '/import',   minRole: 'editor' },
  { prefix: '/areas',    minRole: 'admin'  },
  { prefix: '/settings', minRole: 'admin'  },
  { prefix: '/admin',    minRole: 'admin'  },
]

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
}

function hasAccess(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = routeTitles[pathname] ?? 'Panel de Control'

  useEffect(() => {
    fetch('/api/superadmin/settings')
      .then(r => r.json())
      .then(data => { if (data.show_org_logo === 'true') setShowLogo(true) })
      .catch(() => {})
  }, [])

  // Role-based route protection
  useEffect(() => {
    if (isLoading || !user) return
    const userRole = (user.role as UserRole) ?? 'viewer'
    for (const { prefix, minRole } of ROUTE_PERMISSIONS) {
      if (pathname.startsWith(prefix) && !hasAccess(userRole, minRole)) {
        router.replace('/')
        break
      }
    }
  }, [pathname, user, isLoading, router])

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentUser={{ name: user?.name ?? null, email: user?.email ?? null, role: user?.role ?? null }}
          showLogo={showLogo}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3.5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Abrir menú"
                  className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Menu className="w-5 h-5" aria-hidden="true" />
                </button>
                <p className="text-base font-semibold text-slate-800">{pageTitle}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-slate-400">
                  {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-slate-700 leading-tight">{user?.name || ''}</p>
                    <p className="text-xs text-slate-400 leading-tight">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Cerrar sesión"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-3 sm:p-6 pb-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
