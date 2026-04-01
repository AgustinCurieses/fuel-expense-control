'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, Fuel, AlertTriangle } from 'lucide-react'

interface DashboardData {
  lastFactura: string | null
  lastFacturaTotal: string
  lastFacturaDateRange: { min: string; max: string } | null
  mostActiveArea: string
  mostActiveAreaCount: number
  pendingCards: number
  lastImportDate: string | null
  recentActivity: Array<{
    type: 'import' | 'assignment'
    title: string
    description: string
    date: string
  }>
  fuelTypeAlerts: Array<{
    cardNumber: string
    dominio: string
    subArea: string
    mainArea: string
    primaryGroup: 'nafta' | 'gasoil'
    suspiciousLoads: Array<{
      date: string
      product: string
      liters: number
      amount: number
      remito: string
    }>
  }>
  fuelPrices: Array<{
    product: string
    pricePerLiter: number
    date: Date
  }> | null
  consumoPorSecretaria: Array<{
    areaName: string
    litros: number
    importe: string
    porcentaje: number
  }>
  ultimasFacturas: Array<{
    factura: string
    minDate: string
    maxDate: string
    total: string
    hasOficial: boolean
  }>
}

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    lastFactura: null,
    lastFacturaTotal: '$ 0,00',
    lastFacturaDateRange: null,
    mostActiveArea: 'Cargando...',
    mostActiveAreaCount: 0,
    pendingCards: 0,
    lastImportDate: null,
    recentActivity: [],
    fuelTypeAlerts: [],
    fuelPrices: null,
    consumoPorSecretaria: [],
    ultimasFacturas: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, alertsResponse] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/alerts/fuel-type')
        ])
        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json()
          setDashboardData(prev => ({ ...prev, ...data, fuelPrices: data.fuelPrices || null }))
        }
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          setDashboardData(prev => ({ ...prev, fuelTypeAlerts: alertsData }))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const hasAlerts = !loading && dashboardData.fuelTypeAlerts.length > 0
  const totalAlerts = dashboardData.fuelTypeAlerts.reduce((t, a) => t + a.suspiciousLoads.length, 0)

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Última Factura */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-navy-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-navy-600" />
              </div>
              <Badge variant="info">
                {loading || !dashboardData.lastFactura ? 'Sin factura' : `Nº ${dashboardData.lastFactura}`}
              </Badge>
            </div>
            <p className="text-2xl font-semibold text-slate-800 font-mono">
              {loading ? '—' : dashboardData.lastFacturaTotal}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">Total última factura</p>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Período</p>
              <p className="text-sm text-slate-600">
                {loading ? '—' : dashboardData.lastFacturaDateRange
                  ? `${dashboardData.lastFacturaDateRange.min} — ${dashboardData.lastFacturaDateRange.max}`
                  : 'Sin datos de período'}
              </p>
            </div>
          </div>

          {/* Precios de Combustible */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-navy-50 rounded-lg">
                <Fuel className="w-5 h-5 text-navy-600" />
              </div>
              <Badge variant="neutral">Precio por Litro</Badge>
            </div>
            <div className="space-y-2.5">
              {loading ? (
                <p className="text-sm text-slate-400">Cargando...</p>
              ) : dashboardData.fuelPrices && dashboardData.fuelPrices.length > 0 ? (
                dashboardData.fuelPrices
                  .sort((a, b) => {
                    const order = ['NAFTA SUPER', 'INFINIA', 'D.DIESEL 500', 'INFINIA DIESEL']
                    return order.indexOf(a.product) - order.indexOf(b.product)
                  })
                  .map((fuel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 truncate max-w-[140px]">{fuel.product}</span>
                      <span className="text-sm font-semibold text-slate-800 font-mono shrink-0">
                        ${fuel.pricePerLiter.toFixed(2).replace('.', ',')}<span className="text-xs text-slate-400 font-sans"> /L</span>
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate-400">Sin datos de precios</p>
              )}
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${hasAlerts ? 'bg-red-50' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${hasAlerts ? 'text-red-700' : 'text-slate-400'}`} />
              </div>
              <Badge variant="neutral">Estado</Badge>
            </div>
            {loading ? (
              <p className="text-2xl font-semibold text-slate-800">—</p>
            ) : hasAlerts ? (
              <>
                <p className="text-2xl font-semibold text-red-700 font-mono">{totalAlerts} alertas</p>
                <p className="text-sm text-slate-500 mt-0.5">Cargas sospechosas</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-green-700">Sin alertas</p>
                <p className="text-sm text-slate-500 mt-0.5">Combustibles en orden</p>
              </>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              {!loading && dashboardData.pendingCards > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tarjetas por asignar</span>
                  <Badge variant="warning">{dashboardData.pendingCards}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Última importación</span>
                <span className="text-slate-700 font-medium text-xs">
                  {loading ? '—' : dashboardData.lastImportDate ?? 'Sin datos'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Consumo por Secretaría */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Consumo por Secretaría</h2>
            {dashboardData.lastFactura && (
              <span className="text-xs text-slate-400">Factura Nº {dashboardData.lastFactura}</span>
            )}
          </div>
          {loading ? (
            <p className="text-center text-slate-400 py-10 text-sm">Cargando...</p>
          ) : dashboardData.consumoPorSecretaria.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Sin datos de la última factura</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy-600">
                    <th className="text-left text-xs font-medium text-white/80 uppercase tracking-wide px-5 py-3">Secretaría</th>
                    <th className="text-right text-xs font-medium text-white/80 uppercase tracking-wide px-5 py-3">Litros</th>
                    <th className="text-right text-xs font-medium text-white/80 uppercase tracking-wide px-5 py-3">Importe</th>
                    <th className="text-right text-xs font-medium text-white/80 uppercase tracking-wide px-5 py-3 w-36">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.consumoPorSecretaria.map((row, i) => (
                    <tr key={i} className={`border-t border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-5 py-2.5 text-sm text-slate-800">{row.areaName}</td>
                      <td className="px-5 py-2.5 text-sm text-slate-500 text-right font-mono">
                        {row.litros.toLocaleString('es-AR', { maximumFractionDigits: 0 })} L
                      </td>
                      <td className="px-5 py-2.5 text-sm font-semibold text-slate-800 text-right font-mono">{row.importe}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-1.5">
                            <div className="bg-navy-600 h-1.5 rounded-full" style={{ width: `${row.porcentaje}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right font-mono">{row.porcentaje}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimas Facturas */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Últimas Facturas</h2>
          </div>
          {loading ? (
            <p className="text-center text-slate-400 py-10 text-sm">Cargando...</p>
          ) : dashboardData.ultimasFacturas.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Sin facturas importadas</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboardData.ultimasFacturas.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Factura {f.factura}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{f.minDate} — {f.maxDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={f.hasOficial ? 'success' : 'warning'}>
                      {f.hasOficial ? 'Validada' : 'Sin validar'}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-800 font-mono min-w-[120px] text-right">{f.total}</span>
                    <a
                      href={`/reports?factura=${encodeURIComponent(f.factura)}`}
                      className="text-navy-600 hover:text-navy-700 text-sm font-medium"
                    >
                      Ver →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  )
}
