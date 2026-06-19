'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { ClipboardList } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/ui/PageHeader'

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
  LOGIN:              'bg-green-50 text-green-800 border border-green-200',
  LOGOUT:             'bg-slate-100 text-slate-600 border border-slate-200',
  IMPORT_EXCEL:       'bg-navy-50 text-navy-700 border border-navy-200',
  ASSIGN_CARD:        'bg-purple-50 text-purple-800 border border-purple-200',
  SAVE_FACTURA_TOTAL: 'bg-amber-50 text-amber-800 border border-amber-200',
  CREATE_USER:        'bg-red-50 text-red-700 border border-red-200',
  UPDATE_USER:        'bg-orange-50 text-orange-700 border border-orange-200',
  DEACTIVATE_USER:    'bg-red-100 text-red-800 border border-red-200',
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
        <PageHeader
          title="Administración"
          subtitle="Registro de auditoría de la instancia"
        />

        {/* Audit log */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Registro de Auditoría</h2>
            </div>
            <span className="text-xs text-slate-500">{auditTotal} registros</span>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))
            ) : auditLogs.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">Sin registros aún</p>
            ) : auditLogs.map(log => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <span className="text-xs text-slate-500 font-mono shrink-0">{formatDate(log.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700">{log.userEmail ?? '—'}</p>
                {formatDetail(log.detail) !== '—' && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{formatDetail(log.detail)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-navy-600">
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Acción</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-5 py-3"><Skeleton className="h-3 w-28" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-5 w-32 rounded-full" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-3 w-48" /></td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">Sin registros aún</td>
                  </tr>
                ) : auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {log.userEmail ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-sm truncate">
                      {formatDetail(log.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                Página {auditPage} de {auditPages} · {auditTotal} registros
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAuditPage(p => p - 1)} disabled={auditPage === 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAuditPage(p => p + 1)} disabled={auditPage === auditPages}>
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
