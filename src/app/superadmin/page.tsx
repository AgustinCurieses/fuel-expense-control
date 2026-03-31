'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ToastComponent, useToast } from '@/components/ui/Toast'
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin:  'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-800',
}

const DEFAULT_SETTINGS: SystemSettings = {
  org_name:                 'Municipalidad de Luján',
  org_province:             'Buenos Aires',
  card_inactivity_days:     '30',
  excel_sheet_index:        '0',
  billing_period:           'quincenal',
  factura_tolerance_green:  '1',
  factura_tolerance_yellow: '100',
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
  const [saving, setSaving] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')

  // System settings
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()

  // Load data after auth
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
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName || undefined, role: newRole }),
      })
      if (res.ok) {
        toastSuccess('Usuario creado', newEmail)
        setShowCreate(false)
        setNewEmail(''); setNewName(''); setNewRole('editor')
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
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: editRole }),
      })
      if (res.ok) {
        toastSuccess('Usuario actualizado', editUser.email)
        setEditUser(null)
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  // ── Render: password gate ─────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <div className="p-4 bg-gray-900 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Panel Super Admin</h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Acceso restringido al operador de la plataforma
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave de acceso</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
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
        <div className="bg-gray-900 rounded-lg p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Panel Super Admin</h1>
              <p className="text-gray-400 text-sm">Gestión de la instancia</p>
            </div>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios</span>
          </button>
          <button
            onClick={() => setTab('sistema')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'sistema' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Sistema</span>
          </button>
        </div>

        {/* ── Users tab ──────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h2>
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              </div>
              <Button onClick={() => setShowCreate(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Cargando...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No hay usuarios</td></tr>
                  ) : users.map(user => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded ${user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                          <UserX className="w-4 h-4" />
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
          <div className="space-y-6">
            {/* Organización */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Organización</h3>
              {settingsLoading ? (
                <p className="text-sm text-gray-400">Cargando...</p>
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
                </div>
              )}
            </div>

            {/* Importación */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Importación Excel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hoja del Excel a importar
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.excel_sheet_index}
                    onChange={setSetting('excel_sheet_index')}
                  />
                  <p className="text-xs text-gray-400 mt-1">0 = primera hoja</p>
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

            {/* Tarjetas y validación */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Parámetros Operativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días de inactividad de tarjetas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.card_inactivity_days}
                    onChange={setSetting('card_inactivity_days')}
                  />
                  <p className="text-xs text-gray-400 mt-1">Para separar tarjetas activas/inactivas en el export</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tolerancia verde ($ diferencia)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={settings.factura_tolerance_green}
                    onChange={setSetting('factura_tolerance_green')}
                  />
                  <p className="text-xs text-gray-400 mt-1">Diferencia aceptable en validación de factura</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tolerancia amarilla ($ diferencia)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    value={settings.factura_tolerance_yellow}
                    onChange={setSetting('factura_tolerance_yellow')}
                  />
                  <p className="text-xs text-gray-400 mt-1">Por encima → diferencia crítica (rojo)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                <Save className="w-4 h-4 mr-2" />
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
          <div className="flex justify-end space-x-3 pt-2">
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
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button onClick={handleEditUser} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </MainLayout>
  )
}
