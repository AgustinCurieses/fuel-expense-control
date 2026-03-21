'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  CreditCard, 
  FileSpreadsheet, 
  Users, 
  MapPin, 
  Settings,
  Menu,
  X,
  Fuel,
  TrendingUp,
  AlertTriangle
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
  {
    id: 'dashboard',
    label: 'Panel de Control',
    icon: <Home className="w-5 h-5" />,
    href: '/'
  },
  {
    id: 'import',
    label: 'Cargar Datos',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    href: '/import'
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/reports'
  },
  {
    id: 'alerts',
    label: 'Alertas',
    icon: <AlertTriangle className="w-5 h-5" />,
    href: '/alerts'
  },
  {
    id: 'areas',
    label: 'Gestión de Áreas',
    icon: <MapPin className="w-5 h-5" />,
    href: '/areas'
  },
  {
    id: 'cards',
    label: 'Tarjetas',
    icon: <CreditCard className="w-5 h-5" />,
    href: '/cards'
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings/mapper'
  }
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle, currentUser }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={clsx(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out',
        'w-64 flex-shrink-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-navy-600 rounded-lg">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FuelControl</h1>
                <p className="text-xs text-gray-500">Gestión de Gastos</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={clsx(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200',
                      pathname === item.href
                        ? 'bg-navy-50 text-navy-600 border-l-4 border-navy-600'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'Cargando...'}</p>
                <p className="text-xs text-gray-500">{currentUser?.email || 'cargando@ejemplo.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
