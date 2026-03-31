'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ToastComponent, useToast } from '@/components/ui/Toast'
import { Shield, Users, ClipboardList, PlusCircle, Pencil, UserX, UserCheck } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface AuditEntry {
  id: string
  userEmail: string | null
  action: string
  entity: string | null
  entityId: string | null
  detail: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador'
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-800'
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  IMPORT_EXCEL: 'Importación de Excel',
  ASSIGN_CARD: 'Asignación de tarjeta',
  CREATE_USER: 'Creación de usuario',
  UPDATE_USER: 'Modificación de usuario',
  DEACTIVATE_USER: 'Desactivación de usuario',
  SAVE_FACTURA_TOTAL: 'Total de factura guardado'
}

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'audit'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPages, setAuditPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('editor')
  const [saving, setSaving] = useState(false)

  // Edit user modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')

  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()

  useEffect(() => { loadUsers() }, [])
  useEffect(() => { if (tab === 'audit') loadAudit(auditPage) }, [tab, auditPage])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const loadAudit = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/audit?page=${page}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs)
        setAuditTotal(data.total)
        setAuditPages(data.pages)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newEmail) { toastError('Email requerido', ''); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName || undefined, role: newRole })
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
        body: JSON.stringify({ name: editName, role: editRole })
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
      body: JSON.stringify({ isActive: !user.isActive })
    })
    if (res.ok) {
      toastSuccess(user.isActive ? 'Usuario desactivado' : 'Usuario activado', user.email)
      loadUsers()
    } else {
      toastError('Error', '')
    }
  }

  const openEdit = (user: AdminUser) => {
    setEditUser(user)
    setEditName(user.name ?? '')
    setEditRole(user.role)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDetail = (detail: string | null) => {
    if (!detail) return '—'
    try {
      const obj = JSON.parse(detail)
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' · ')
    } catch {
      return detail
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-500 text-sm">Usuarios del sistema y registro de auditoría</p>
            </div>
          </div>
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
            onClick={() => setTab('audit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'audit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Auditoría</span>
          </button>
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h2>
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
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay usuarios</td></tr>
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
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1 rounded ${user.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit tab */}
        {tab === 'audit' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Registro de Auditoría</h2>
              <span className="text-sm text-gray-500">{auditTotal} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Sin registros aún</td></tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{log.userEmail ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-800">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-md truncate">{formatDetail(log.detail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">Página {auditPage} de {auditPages}</span>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setAuditPage(p => p - 1)} disabled={auditPage === 1}>Anterior</Button>
                  <Button variant="outline" onClick={() => setAuditPage(p => p + 1)} disabled={auditPage === auditPages}>Siguiente</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create user modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Usuario">
        <div className="space-y-4">
          <Input label="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@municipalidad.gob.ar" />
          <Input label="Nombre" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre completo" />
          <Select
            label="Rol"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'editor', label: 'Editor' },
              { value: 'viewer', label: 'Visualizador' }
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
            <Input label="Nombre" value={editName} onChange={e => setEditName(e.target.value)} />
            <Select
              label="Rol"
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Visualizador' }
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
