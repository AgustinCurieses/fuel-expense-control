'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToastContext } from '@/contexts/ToastContext'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ShieldCheck, Lock, Users, Settings,
  PlusCircle, Pencil, UserX, UserCheck, Save
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface SystemSettings {
  org_name: string
  org_province: string
  card_inactivity_days: string
  excel_sheet_index: string
  billing_period: string
  factura_tolerance_green: string
  factura_tolerance_yellow: string
  show_org_logo: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin:  'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

const DEFAULT_SETTINGS: SystemSettings = {
  org_name:                 'Municipalidad de Luján',
  org_province:             'Buenos Aires',
  card_inactivity_days:     '30',
  excel_sheet_index:        '0',
  billing_period:           'quincenal',
  factura_tolerance_green:  '1',
  factura_tolerance_yellow: '100',
  show_org_logo:            'false',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [tab, setTab] = useState<'users' | 'sistema'>('users')

  // Users
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('editor')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPassword, setEditPassword] = useState('')

  // System settings
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const { success: toastSuccess, error: toastError } = useToastContext()

  useEffect(() => {
    if (!authenticated) return
    if (tab === 'users') loadUsers()
    if (tab === 'sistema') loadSettings()
  }, [authenticated, tab])

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleAuth = async () => {
    if (!keyInput) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/superadmin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput }),
      })
      if (res.ok) {
        setAuthenticated(true)
        setKeyInput('')
      } else {
        const data = await res.json()
        setAuthError(data.error ?? 'Clave incorrecta')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setUsersLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newEmail) { toastError('Email requerido', ''); return }
    if (!newPassword) { toastError('Contraseña requerida', ''); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName || undefined, role: newRole, password: newPassword }),
      })
      if (res.ok) {
        toastSuccess('Usuario creado', newEmail)
        setShowCreate(false)
        setNewEmail(''); setNewName(''); setNewRole('editor'); setNewPassword('')
        loadUsers()
      } else {
        const data = await res.json()
        toastError('Error', data.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const body: Record<string, string> = { name: editName, role: editRole }
      if (editPassword) body.password = editPassword
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toastSuccess('Usuario actualizado', editUser.email)
        setEditUser(null)
        setEditPassword('')
        loadUsers()
      } else {
        toastError('Error al actualizar', '')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    if (res.ok) {
      toastSuccess(user.isActive ? 'Usuario desactivado' : 'Usuario activado', user.email)
      loadUsers()
    } else {
      toastError('Error', '')
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`¿Eliminar permanentemente a ${user.email}?`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      toastSuccess('Usuario eliminado', user.email)
      loadUsers()
    } else {
      toastError('Error al eliminar', '')
    }
  }

  const openEdit = (user: AdminUser) => {
    setEditUser(user)
    setEditName(user.name ?? '')
    setEditRole(user.role)
    setEditPassword('')
  }

  // ── System settings ───────────────────────────────────────────────────────

  const loadSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/superadmin/settings')
      if (res.ok) setSettings(await res.json())
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) toastSuccess('Configuración guardada', '')
      else toastError('Error al guardar', '')
    } finally {
      setSettingsSaving(false)
    }
  }

  const setSetting = (key: keyof SystemSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(prev => ({ ...prev, [key]: e.target.value }))

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'danger' as const
    if (role === 'editor') return 'info' as const
    return 'neutral' as const
  }

  // ── Render: password gate ─────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-xl border border-slate-200 p-10 w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-navy-600 rounded-xl mb-4">
                <Lock className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Panel Super Admin</h1>
              <p className="text-sm text-slate-500 mt-1 text-center">
                Acceso restringido al operador de la plataforma
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clave de acceso</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                  placeholder="••••••••••••"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
              <Button
                onClick={handleAuth}
                disabled={authLoading || !keyInput}
                className="w-full justify-center"
                size="lg"
              >
                {authLoading ? 'Verificando...' : 'Ingresar'}
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // ── Render: main panel ────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-navy-600 rounded-lg px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Panel Super Admin</h1>
              <p className="text-navy-200 text-xs">Gestión de la instancia</p>
            </div>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-xs text-navy-300 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            Usuarios
          </button>
          <button
            onClick={() => setTab('sistema')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'sistema' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            Sistema
          </button>
        </div>

        {/* ── Users tab ──────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-800">Usuarios del Sistema</h2>
                <Badge variant="neutral">{users.length}</Badge>
              </div>
              <Button onClick={() => setShowCreate(true)} size="sm">
                <PlusCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Nuevo Usuario
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-navy-600">
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Rol</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Creado</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-white/80 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-3 w-28" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-6 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No hay usuarios registrados</td></tr>
                  ) : users.map(user => (
                    <tr key={user.id} className={`hover:bg-slate-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3 text-sm font-medium text-slate-800">{user.name || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.email}</td>
                      <td className="px-5 py-3">
                        <Badge variant={roleBadgeVariant(user.role)}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={user.isActive ? 'success' : 'neutral'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <button
                          onClick={() => openEdit(user)}
                          aria-label={`Editar ${user.email}`}
                          className="p-1.5 text-navy-600 hover:bg-navy-50 rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          aria-label={user.isActive ? `Desactivar ${user.email}` : `Activar ${user.email}`}
                          className={`p-1.5 rounded-md transition-colors ${user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" aria-hidden="true" /> : <UserCheck className="w-4 h-4" aria-hidden="true" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          aria-label={`Eliminar ${user.email}`}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <UserX className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Sistema tab ────────────────────────────────────────────────────── */}
        {tab === 'sistema' && (
          <div className="space-y-5">
            {/* Organización */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Organización</h3>
              {settingsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-16 rounded-md" />
                  <Skeleton className="h-16 rounded-md" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre de la organización"
                    value={settings.org_name}
                    onChange={setSetting('org_name')}
                    placeholder="Municipalidad de Luján"
                  />
                  <Input
                    label="Provincia"
                    value={settings.org_province}
                    onChange={setSetting('org_province')}
                    placeholder="Buenos Aires"
                  />
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={settings.show_org_logo === 'true'}
                          onChange={e => setSettings(prev => ({ ...prev, show_org_logo: e.target.checked ? 'true' : 'false' }))}
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${settings.show_org_logo === 'true' ? 'bg-navy-600' : 'bg-slate-300'}`} />
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.show_org_logo === 'true' ? 'translate-x-4' : ''}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Mostrar logo en el sidebar</p>
                        <p className="text-xs text-slate-400">El archivo debe estar en <code className="bg-slate-100 px-1 rounded text-slate-600">public/logo-municipalidad.png</code></p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Importación */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Importación Excel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hoja del Excel a importar
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                    value={settings.excel_sheet_index}
                    onChange={setSetting('excel_sheet_index')}
                  />
                  <p className="text-xs text-slate-400 mt-1">0 = primera hoja</p>
                </div>
                <Select
                  label="Período de facturación YPF"
                  value={settings.billing_period}
                  onChange={setSetting('billing_period')}
                  options={[
                    { value: 'quincenal', label: 'Quincenal (1–15 / 16–fin de mes)' },
                    { value: 'mensual',   label: 'Mensual' },
                  ]}
                />
              </div>
            </div>

            {/* Parámetros operativos */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Parámetros Operativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Días de inactividad de tarjetas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                    value={settings.card_inactivity_days}
                    onChange={setSetting('card_inactivity_days')}
                  />
                  <p className="text-xs text-slate-400 mt-1">Para separar tarjetas activas/inactivas en el export</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tolerancia verde ($ diferencia)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    value={settings.factura_tolerance_green}
                    onChange={setSetting('factura_tolerance_green')}
                  />
                  <p className="text-xs text-slate-400 mt-1">Diferencia aceptable en validación de factura</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tolerancia amarilla ($ diferencia)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={settings.factura_tolerance_yellow}
                    onChange={setSetting('factura_tolerance_yellow')}
                  />
                  <p className="text-xs text-slate-400 mt-1">Por encima → diferencia crítica (rojo)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                {settingsSaving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create user modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Usuario">
        <div className="space-y-4">
          <Input label="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@municipalidad.gob.ar" />
          <Input label="Nombre completo" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre completo" />
          <Input label="Contraseña" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Contraseña inicial" />
          <Select
            label="Rol"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            options={[
              { value: 'admin',  label: 'Administrador' },
              { value: 'editor', label: 'Editor' },
              { value: 'viewer', label: 'Visualizador' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving}>{saving ? 'Guardando...' : 'Crear Usuario'}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit user modal */}
      {editUser && (
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Editar: ${editUser.email}`}>
          <div className="space-y-4">
            <Input label="Nombre completo" value={editName} onChange={e => setEditName(e.target.value)} />
            <Select
              label="Rol"
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              options={[
                { value: 'admin',  label: 'Administrador' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Visualizador' },
              ]}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button onClick={handleEditUser} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  )
}
