'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Shield, ClipboardList } from 'lucide-react'

interface AuditEntry {
  id: string
  userEmail: string | null
  action: string
  entity: string | null
  entityId: string | null
  detail: string | null
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN:            'Inicio de sesión',
  LOGOUT:           'Cierre de sesión',
  IMPORT_EXCEL:     'Importación de Excel',
  ASSIGN_CARD:      'Asignación de tarjeta',
  CREATE_USER:      'Creación de usuario',
  UPDATE_USER:      'Modificación de usuario',
  DEACTIVATE_USER:  'Desactivación de usuario',
  SAVE_FACTURA_TOTAL: 'Total de factura guardado',
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN:              'bg-green-50 text-green-800',
  LOGOUT:             'bg-gray-100 text-gray-700',
  IMPORT_EXCEL:       'bg-blue-50 text-blue-800',
  ASSIGN_CARD:        'bg-purple-50 text-purple-800',
  SAVE_FACTURA_TOTAL: 'bg-yellow-50 text-yellow-800',
  CREATE_USER:        'bg-red-50 text-red-800',
  UPDATE_USER:        'bg-orange-50 text-orange-800',
  DEACTIVATE_USER:    'bg-red-100 text-red-800',
}

export default function AdminPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPages, setAuditPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAudit(auditPage) }, [auditPage])

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
              <p className="text-gray-500 text-sm">Registro de auditoría de la instancia</p>
            </div>
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Registro de Auditoría</h2>
            </div>
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
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Cargando...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Sin registros aún</td>
                  </tr>
                ) : auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {log.userEmail ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 max-w-sm truncate">
                      {formatDetail(log.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Página {auditPage} de {auditPages} · {auditTotal} registros
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setAuditPage(p => p - 1)} disabled={auditPage === 1}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setAuditPage(p => p + 1)} disabled={auditPage === auditPages}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
