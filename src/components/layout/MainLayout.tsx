'use client'

import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const routeTitles: Record<string, string> = {
  '/':               'Panel de Control',
  '/import':         'Cargar Datos',
  '/reports':        'Reportes',
  '/alerts':         'Alertas',
  '/areas':          'Gestión de Áreas',
  '/cards':          'Tarjetas',
  '/settings/mapper':'Configuración',
  '/admin':          'Administración',
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const pageTitle = routeTitles[pathname] ?? 'Panel de Control'

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentUser={{ name: user?.name ?? null, email: user?.email ?? null }}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-slate-800">{pageTitle}</h2>
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
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 pb-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
