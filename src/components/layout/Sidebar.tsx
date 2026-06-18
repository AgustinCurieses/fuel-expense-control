'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  CreditCard,
  FileSpreadsheet,
  MapPin,
  Settings,
  X,
  Fuel,
  TrendingUp,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { clsx } from 'clsx'

type UserRole = 'admin' | 'editor' | 'viewer'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  roles: UserRole[]
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentUser?: {
    name: string | null
    email: string | null
    role?: string | null
  }
  showLogo?: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

const ALL_ROLES: UserRole[] = ['viewer', 'editor', 'admin']
const EDITOR_UP: UserRole[] = ['editor', 'admin']
const ADMIN_ONLY: UserRole[] = ['admin']

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Panel de Control',  icon: <Home className="w-4 h-4" />,          href: '/',               roles: ALL_ROLES  },
  { id: 'import',    label: 'Cargar Datos',       icon: <FileSpreadsheet className="w-4 h-4" />, href: '/import',       roles: EDITOR_UP  },
  { id: 'reports',   label: 'Reportes',           icon: <TrendingUp className="w-4 h-4" />,     href: '/reports',       roles: ALL_ROLES  },
  { id: 'alerts',    label: 'Alertas',            icon: <AlertTriangle className="w-4 h-4" />,  href: '/alerts',        roles: ALL_ROLES  },
  { id: 'cards',     label: 'Tarjetas',           icon: <CreditCard className="w-4 h-4" />,     href: '/cards',         roles: ALL_ROLES  },
  { id: 'areas',     label: 'Gestión de Áreas',   icon: <MapPin className="w-4 h-4" />,         href: '/areas',         roles: ADMIN_ONLY },
  { id: 'settings',  label: 'Configuración',      icon: <Settings className="w-4 h-4" />,       href: '/settings/mapper', roles: ADMIN_ONLY },
  { id: 'admin',     label: 'Administración',     icon: <Shield className="w-4 h-4" />,         href: '/admin',         roles: ADMIN_ONLY },
]

export function Sidebar({ isOpen, onToggle, currentUser, showLogo = false }: SidebarProps) {
  const pathname = usePathname()
  const userRole = (currentUser?.role as UserRole) ?? 'viewer'

  const visibleItems = sidebarItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out',
        'w-56 flex-shrink-0 flex flex-col',
        'bg-navy-600',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-700">
          <div className="flex items-center gap-3 min-w-0">
            {showLogo ? (
              <div className="w-8 h-8 flex-shrink-0 relative">
                <Image
                  src="/logo-municipalidad.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="p-1.5 bg-white/10 rounded-lg flex-shrink-0">
                <Fuel className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">FuelControl</p>
              <p className="text-xs text-navy-200 leading-tight truncate">Mun. de Luján</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            aria-label="Cerrar menú"
            className="lg:hidden p-1.5 rounded-md text-navy-200 hover:bg-navy-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-navy-200 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <span className={isActive ? 'text-white' : 'text-navy-300'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-navy-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser?.name || '—'}</p>
              <p className="text-xs text-navy-300 truncate">
                {userRole !== 'viewer' || currentUser?.role ? ROLE_LABELS[userRole] : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
