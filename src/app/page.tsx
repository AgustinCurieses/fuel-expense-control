import { MainLayout } from '@/components/layout/MainLayout'
import { TrendingUp, MapPin, CreditCard, DollarSign } from 'lucide-react'

export default function HomePage() {
  // Mock data - replace with actual API calls
  const currentMonthSpending = 1247.89
  const mostActiveArea = 'North Region'
  const pendingCards = 3

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
              <p className="text-3xl font-bold">${currentMonthSpending.toFixed(2)}</p>
              <p className="text-blue-100 text-sm">Gasto Total</p>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-500 border-opacity-30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">vs mes anterior</span>
                <span className="text-green-300">+12.5%</span>
              </div>
            </div>
          </div>

          {/* Most Active Area */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 bg-opacity-30 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-sm bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                Más Activa
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{mostActiveArea}</p>
              <p className="text-green-100 text-sm">Área Más Activa</p>
            </div>
            <div className="mt-4 pt-4 border-t border-green-500 border-opacity-30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">Transacciones</span>
                <span className="text-white">47</span>
              </div>
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
              <p className="text-3xl font-bold">{pendingCards}</p>
              <p className="text-orange-100 text-sm">Tarjetas por Asignar</p>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-500 border-opacity-30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-100">De importaciones</span>
                <span className="text-white">Esta semana</span>
              </div>
            </div>
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
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Archivo Excel importado</p>
                <p className="text-xs text-gray-500">23 registros procesados hace 2 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nueva tarjeta asignada</p>
                <p className="text-xs text-gray-500">Tarjeta 4567 asignada a Región Norte hace 5 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Reporte generado</p>
                <p className="text-xs text-gray-500">Reporte mensual para Región Sur hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
