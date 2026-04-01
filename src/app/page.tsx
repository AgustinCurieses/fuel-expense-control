'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
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
          const dashboardData = await dashboardResponse.json()
          setDashboardData(prev => ({ 
            ...prev, 
            ...dashboardData,
            fuelPrices: dashboardData.fuelPrices || null 
          }))
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Última Factura */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {loading || !dashboardData.lastFactura ? 'Sin factura' : `Nº ${dashboardData.lastFactura}`}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : dashboardData.lastFacturaTotal}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total última factura emitida</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Período</p>
              <p className="text-sm text-gray-700">
                {loading ? '—' : dashboardData.lastFacturaDateRange
                  ? `${dashboardData.lastFacturaDateRange.min} — ${dashboardData.lastFacturaDateRange.max}`
                  : 'Sin datos de período'}
              </p>
            </div>
          </div>

          {/* Últimos Precios de Combustible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <Fuel className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                Precios por Litro
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-400">Cargando...</p>
              ) : dashboardData.fuelPrices && dashboardData.fuelPrices.length > 0 ? (
                dashboardData.fuelPrices
                  .sort((a, b) => {
                    const order = ['NAFTA SUPER', 'INFINIA', 'D.DIESEL 500', 'INFINIA DIESEL']
                    return order.indexOf(a.product) - order.indexOf(b.product)
                  })
                  .map((fuel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[140px]">{fuel.product}</span>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold text-gray-900">
                          ${fuel.pricePerLiter.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/L</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-400">Sin datos de precios</p>
              )}
            </div>
          </div>

          {/* Alertas & Estado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${!loading && dashboardData.fuelTypeAlerts.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${!loading && dashboardData.fuelTypeAlerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                Estado del Sistema
              </span>
            </div>
            <div className="mb-4">
              {loading ? (
                <p className="text-2xl font-bold text-gray-900">—</p>
              ) : dashboardData.fuelTypeAlerts.length === 0 ? (
                <>
                  <p className="text-2xl font-bold text-green-600">Sin alertas</p>
                  <p className="text-sm text-gray-500 mt-0.5">Combustibles en orden</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.fuelTypeAlerts.reduce((t, a) => t + a.suspiciousLoads.length, 0)} alertas</p>
                  <p className="text-sm text-gray-500 mt-0.5">Cargas sospechosas detectadas</p>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 space-y-2.5">
              {!loading && dashboardData.pendingCards > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-600">Tarjetas por asignar</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {dashboardData.pendingCards}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Última importación</span>
                <span className="text-gray-700 font-medium">{loading ? '—' : dashboardData.lastImportDate ?? 'Sin datos'}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Consumo por Secretaría */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Consumo por Secretaría</h2>
            {dashboardData.lastFactura && (
              <span className="text-sm text-gray-500">Factura Nº {dashboardData.lastFactura}</span>
            )}
          </div>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Cargando...</p>
          ) : dashboardData.consumoPorSecretaria.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin datos de la última factura</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-2">Secretaría</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide pb-2">Litros</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide pb-2">Importe</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide pb-2 w-36">Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dashboardData.consumoPorSecretaria.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 text-sm text-gray-900">{row.areaName}</td>
                      <td className="py-2.5 text-sm text-gray-500 text-right">
                        {row.litros.toLocaleString('es-AR', { maximumFractionDigits: 0 })} L
                      </td>
                      <td className="py-2.5 text-sm font-semibold text-gray-900 text-right">{row.importe}</td>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${row.porcentaje}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{row.porcentaje}%</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Facturas</h2>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Cargando...</p>
          ) : dashboardData.ultimasFacturas.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin facturas importadas</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {dashboardData.ultimasFacturas.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Factura {f.factura}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.minDate} — {f.maxDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${f.hasOficial ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                      {f.hasOficial ? 'Validada' : 'Sin validar'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 min-w-[120px] text-right">{f.total}</span>
                    <a
                      href={`/reports?factura=${encodeURIComponent(f.factura)}`}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
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