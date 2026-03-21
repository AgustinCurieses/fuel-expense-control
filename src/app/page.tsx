'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { TrendingUp, MapPin, CreditCard, DollarSign } from 'lucide-react'

interface DashboardData {
  totalSpending: string
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
}

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSpending: '$ 0,00',
    mostActiveArea: 'Cargando...',
    mostActiveAreaCount: 0,
    pendingCards: 0,
    lastImportDate: null,
    recentActivity: [],
    fuelTypeAlerts: [],
    fuelPrices: null
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'import':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'assignment':
        return <CreditCard className="w-4 h-4 text-green-600" />
      default:
        return <MapPin className="w-4 h-4 text-purple-600" />
    }
  }

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case 'import':
        return 'bg-blue-100'
      case 'assignment':
        return 'bg-green-100'
      default:
        return 'bg-purple-100'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a Fuel Control
          </h1>
          <p className="text-gray-600">
            Gestione sus gastos de combustible de manera eficiente con nuestro sistema integral de seguimiento.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Spending this Month */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 bg-opacity-30 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm bg-blue-500 bg-opacity-30 px-2 py-1 rounded">
                Este Mes
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{loading ? '$ 0,00' : dashboardData.totalSpending}</p>
              <p className="text-blue-100 text-sm">Gasto Total</p>
            </div>
          </div>

          {/* Últimos Precios de Combustible */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 bg-opacity-30 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                Últimos Precios
              </span>
            </div>
            <div className="space-y-2">
              {loading ? (
                <p className="text-green-100 text-sm">Cargando...</p>
              ) : dashboardData.fuelPrices && dashboardData.fuelPrices.length > 0 ? (
                dashboardData.fuelPrices
                  .sort((a, b) => {
                    // Define order: NAFTA SUPER, INFINIA, D.DIESEL 500, INFINIA DIESEL
                    const order = ['NAFTA SUPER', 'INFINIA', 'D.DIESEL 500', 'INFINIA DIESEL']
                    return order.indexOf(a.product) - order.indexOf(b.product)
                  })
                  .map((fuel, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center text-sm">
                      <span className="text-green-100 text-left">{fuel.product}</span>
                      <span className="text-white font-medium text-center">
                        ${fuel.pricePerLiter.toFixed(2).replace('.', ',')} /L
                      </span>
                      <span className="text-green-100 text-xs text-right">
                        {new Date(fuel.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-green-100 text-sm">Sin datos</p>
              )}
            </div>
          </div>

          {/* Pending Cards to Assign */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 bg-opacity-30 rounded-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-sm bg-orange-500 bg-opacity-30 px-2 py-1 rounded">
                Acción Requerida
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{loading ? '0' : dashboardData.pendingCards}</p>
              <p className="text-orange-100 text-sm">Tarjetas por Asignar</p>
            </div>
            {dashboardData.lastImportDate && (
              <div className="mt-4 pt-4 border-t border-orange-500 border-opacity-30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-100">Última imp</span>
                  <span className="text-white">{dashboardData.lastImportDate}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/import"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Cargar Excel</p>
                <p className="text-sm text-gray-500">Subir datos de gastos de combustible</p>
              </div>
            </a>
            
            <a
              href="/cards"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gestionar Tarjetas</p>
                <p className="text-sm text-gray-500">Asignar tarjetas de combustible a áreas</p>
              </div>
            </a>
            
            <a
              href="/reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver Reportes</p>
                <p className="text-sm text-gray-500">Generar reportes de gastos</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                Cargando actividad reciente...
              </div>
            ) : dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${getActivityIconBg(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>

        {/* Fuel Type Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Alertas de Combustible</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Cargando alertas de combustible...
            </div>
          ) : dashboardData.fuelTypeAlerts.length === 0 ? (
            <div className="text-center text-green-600 py-8">
              ✅ Sin alertas de combustible
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  {dashboardData.fuelTypeAlerts.reduce((total, alert) => total + alert.suspiciousLoads.length, 0)} alertas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dominio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secretaría</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencia</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Esperado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga Sospechosa</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.fuelTypeAlerts
                      .flatMap(alert => 
                        alert.suspiciousLoads.map(load => ({
                          ...alert,
                          suspiciousLoad: load
                        }))
                      )
                      .slice(0, 5)
                      .map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{row.dominio}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.mainArea}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.subArea}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              row.primaryGroup === 'nafta' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.primaryGroup === 'nafta' ? 'Nafta' : 'Gasoil'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.suspiciousLoad.product}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.suspiciousLoad.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.suspiciousLoad.liters.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <a 
                  href="/alerts" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver todas las alertas →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
