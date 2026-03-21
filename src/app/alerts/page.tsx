'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'

interface SuspiciousLoad {
  date: string
  product: string
  liters: number
  amount: number
  remito: string
}

interface FuelTypeAlert {
  cardNumber: string
  dominio: string
  subArea: string
  mainArea: string
  primaryGroup: 'nafta' | 'gasoil'
  suspiciousLoads: SuspiciousLoad[]
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<FuelTypeAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts/fuel-type')
        if (response.ok) {
          const data = await response.json()
          setAlerts(data)
        }
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/alerts/fuel-type/export')
      if (!response.ok) {
        throw new Error('Error exporting alerts')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'Alertas_Combustible.xlsx'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting alerts:', error)
      alert('Error al exportar alertas')
    }
  }

  // Flatten all suspicious loads for the table
  const allAlerts = alerts.flatMap(alert =>
    alert.suspiciousLoads.map(load => ({
      ...alert,
      suspiciousLoad: load
    }))
  )

  // Sort by date (most recent first)
  allAlerts.sort((a, b) => {
    const dateA = new Date(a.suspiciousLoad.date.split('/').reverse().join('-'))
    const dateB = new Date(b.suspiciousLoad.date.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getFuelTypeText = (primaryGroup: string) => {
    return primaryGroup === 'nafta' ? 'Nafta' : 'Gasoil'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas de Combustible</h1>
            <p className="text-gray-600">Detección de cambios sospechosos en el tipo de combustible</p>
          </div>
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Cargando alertas de combustible...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center text-green-600 py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-medium">Sin alertas de tipo de combustible detectadas</p>
              <p className="text-sm text-green-500 mt-2">No se encontraron cargas sospechosas en el período analizado</p>
            </div>
          ) : (
            <div>
              {/* Summary */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Resumen de Alertas</h3>
                    <p className="text-red-600">
                      {alerts.length} tarjetas con {allAlerts.length} cargas sospechosas detectadas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{allAlerts.length}</div>
                    <div className="text-sm text-red-500">Alertas totales</div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dominio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secretaría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combustible Permitido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto Cargado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remito</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allAlerts.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.dominio}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.mainArea}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.subArea}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row.primaryGroup === 'nafta' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getFuelTypeText(row.primaryGroup)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.suspiciousLoad.product}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.suspiciousLoad.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.suspiciousLoad.liters.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(row.suspiciousLoad.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.suspiciousLoad.remito}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> Estas alertas se generan cuando se detecta una carga de combustible que no corresponde al tipo 
                  habitual del vehículo. Puede indicar un error en la carga o un uso indebido de la tarjeta.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
