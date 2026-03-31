'use client'

import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const routeTitles: Record<string, string> = {
  '/': 'Panel de Control',
  '/import': 'Cargar Datos',
  '/reports': 'Reportes',
  '/alerts': 'Alertas',
  '/areas': 'Gestión de Áreas',
  '/cards': 'Tarjetas',
  '/settings/mapper': 'Configuración',
  '/admin': 'Administración'
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
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentUser={{ name: user?.name ?? null, email: user?.email ?? null }}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900">{pageTitle}</h2>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Última actualización: {new Date().toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name || ''}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 pb-20">
            {children}
          </main>

          {/* Footer */}
          <footer className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-6 py-3 hidden lg:block">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Fuel Control v1.0 - Gestión Empresarial de Gastos de Combustible</p>
              <p>© 2024 Fuel Control. Todos los derechos reservados.</p>
            </div>
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  )
}
