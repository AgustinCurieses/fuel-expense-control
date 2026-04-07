'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
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
  Shield,
  ShieldCheck
} from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentUser?: {
    name: string | null
    email: string | null
  }
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Panel de Control',  icon: <Home className="w-4 h-4" />,          href: '/' },
  { id: 'import',    label: 'Cargar Datos',       icon: <FileSpreadsheet className="w-4 h-4" />, href: '/import' },
  { id: 'reports',   label: 'Reportes',           icon: <TrendingUp className="w-4 h-4" />,     href: '/reports' },
  { id: 'alerts',    label: 'Alertas',            icon: <AlertTriangle className="w-4 h-4" />,  href: '/alerts' },
  { id: 'areas',     label: 'Gestión de Áreas',   icon: <MapPin className="w-4 h-4" />,         href: '/areas' },
  { id: 'cards',     label: 'Tarjetas',           icon: <CreditCard className="w-4 h-4" />,     href: '/cards' },
  { id: 'settings',  label: 'Configuración',      icon: <Settings className="w-4 h-4" />,       href: '/settings/mapper' },
  { id: 'admin',     label: 'Administración',     icon: <Shield className="w-4 h-4" />,         href: '/admin' },
  { id: 'superadmin',label: 'Super Admin',        icon: <ShieldCheck className="w-4 h-4" />,    href: '/superadmin' },
]

export function Sidebar({ isOpen, onToggle, currentUser }: SidebarProps) {
  const pathname = usePathname()

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
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">FuelControl</p>
              <p className="text-xs text-navy-200 leading-tight">Mun. de Luján</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-md text-navy-200 hover:bg-navy-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
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
              <p className="text-xs text-navy-300 truncate">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
