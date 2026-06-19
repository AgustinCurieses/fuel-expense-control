'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Download, FileSpreadsheet, Calendar, Filter, Search, X, TrendingUp, DollarSign, Fuel, CreditCard, Hash } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToastContext } from '@/contexts/ToastContext'
import { FuelLog, Card, MainArea, SubArea } from '@/types'

export default function ReportsPage() {
  const [fuelLogs, setFuelLogs] = useState<(FuelLog & {
    card: Card & { area: MainArea; subArea?: SubArea }
  })[]>([])
  const [mainAreas, setMainAreas] = useState<MainArea[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [facturaFilter, setFacturaFilter] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'period' | 'factura'>('period')
  const [availableFacturas, setAvailableFacturas] = useState<any[]>([])
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToastContext()
  const [isExporting, setIsExporting] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>('')
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [areasResponse, facturasResponse] = await Promise.all([
        fetch('/api/areas'),
        fetch('/api/facturas')
      ])
      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setMainAreas(areasData.mainAreas)
      }
      if (facturasResponse.ok) {
        setAvailableFacturas(await facturasResponse.json())
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }


  const handleFilterModeChange = (mode: 'period' | 'factura') => {
    setFilterMode(mode)
    setFuelLogs([])
    if (mode === 'period') {
      setFacturaFilter('')
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  const fetchFilteredLogs = async () => {
    if (filterMode === 'period' && (!startDate || !endDate)) {
      toastWarning('Fechas requeridas', 'Seleccione fecha de inicio y de fin')
      return
    }
    if (filterMode === 'factura' && !facturaFilter) {
      toastWarning('Factura requerida', 'Seleccione un número de factura')
      return
    }
    const params = new URLSearchParams()
    if (filterMode === 'period') {
      params.append('startDate', startDate)
      params.append('endDate', endDate)
    } else {
      params.append('factura', facturaFilter)
    }
    if (selectedArea) params.append('areaId', selectedArea)
    setIsLoadingLogs(true)
    try {
      const res = await fetch(`/api/fuel-logs?${params.toString()}`)
      if (res.ok) setFuelLogs(await res.json())
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const clearFilters = () => {
    setSelectedArea('')
    setStartDate('')
    setEndDate('')
    setFacturaFilter('')
    setFuelLogs([])
  }

  const handleGenerateReport = async () => {
    if (filterMode === 'period' && (!startDate || !endDate)) {
      toastWarning('Fechas requeridas', 'Seleccione fecha de inicio y de fin')
      return
    }
    if (filterMode === 'factura' && !facturaFilter) {
      toastWarning('Factura requerida', 'Seleccione un número de factura')
      return
    }

    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (filterMode === 'period') {
        params.append('startDate', startDate!)
        params.append('endDate', endDate!)
      } else {
        params.append('factura', facturaFilter!)
      }
      if (selectedArea) {
        params.append('areaId', selectedArea)
      }

      const response = await fetch(`/api/generate-report?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Reporte de Combustible.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toastError('Error al generar reporte', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsExporting(false)
    }
  }

  // Derive available months from facturas: { key: "2026-01", label: "Enero 2026" }[]
  const availableMonths = (() => {
    const spanishMonths = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const seen = new Map<string, string>()
    availableFacturas.forEach(f => {
      // Extract year/month from the label (e.g. "Primera quincena Enero 2026")
      // Fallback: parse from the factura dates via label
      const parts = f.label.split(' ')
      const monthName = parts[parts.length - 2]
      const year = parts[parts.length - 1]
      const monthIndex = spanishMonths.indexOf(monthName)
      if (monthIndex === -1 || !year) return
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      if (!seen.has(key)) {
        seen.set(key, `${monthName} ${year}`)
      }
    })
    return Array.from(seen.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key))
  })()

  const handleGenerateSummary = async (monthKey?: string) => {
    const month = monthKey ?? selectedSummaryMonth
    if (!month) return

    const spanishMonths = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const getMonthKey = (label: string) => {
      const parts = label.split(' ')
      const monthName = parts[parts.length - 2]
      const year = parts[parts.length - 1]
      const idx = spanishMonths.indexOf(monthName)
      if (idx === -1 || !year) return null
      return `${year}-${String(idx + 1).padStart(2, '0')}`
    }

    const currFacturasData = availableFacturas.filter(f => getMonthKey(f.label) === month)
    const currFacturas = currFacturasData.map((f: any) => f.factura)

    if (currFacturas.length === 0) {
      toastWarning('Sin facturas', 'No hay facturas importadas para el mes seleccionado')
      return
    }

    const [yearNum, monNum] = month.split('-').map(Number)
    const prevDate = new Date(yearNum, monNum - 2, 1)
    const prevKey  = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    let monthLabelStr: string
    let prevFacturas: string[]

    const isPartial = currFacturasData.length === 1

    if (isPartial) {
      const facturaLabel: string = currFacturasData[0].label
      const isFirst = facturaLabel.startsWith('Primera')
      const quincenaDisplay = isFirst ? '1ra quincena' : '2da quincena'
      const quincenaPrefix  = isFirst ? 'Primera' : 'Segunda'
      monthLabelStr = `${quincenaDisplay} ${spanishMonths[monNum - 1]} ${yearNum}`
      prevFacturas  = availableFacturas
        .filter((f: any) => getMonthKey(f.label) === prevKey && f.label.startsWith(quincenaPrefix))
        .map((f: any) => f.factura)
    } else {
      monthLabelStr = availableMonths.find(m => m.key === month)?.label ?? month
      prevFacturas  = availableFacturas
        .filter((f: any) => getMonthKey(f.label) === prevKey)
        .map((f: any) => f.factura)
    }

    setShowSummaryModal(false)
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.append('facturas', currFacturas.join(','))
      if (prevFacturas.length > 0) {
        params.append('prevFacturas', prevFacturas.join(','))
      }
      params.append('monthLabel', monthLabelStr)

      const response = await fetch(`/api/generate-summary?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to generate summary report')
      }

      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Resumen Ejecutivo ${monthLabelStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toastError('Error al generar resumen', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsExporting(false)
    }
  }



  const formatARS = (n: number) =>
    '$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Calculate summary statistics (excluding PENDING rows)
  const validData = fuelLogs.filter(log => log.card !== null && log.card?.area !== null)
  const summary = {
    totalAmount: validData.reduce((sum, log) => sum + log.amount, 0),
    totalLiters: validData.reduce((sum, log) => sum + log.gallons, 0),
    avgPricePerLiter: validData.length > 0 ? 
      validData.reduce((sum, log) => sum + log.amount, 0) / 
      validData.reduce((sum, log) => sum + log.gallons, 0) : 0,
    recordCount: validData.length,
    uniqueCards: new Set(validData.map(log => log.cardId)).size
  }

  // Group data by area
  const dataByArea = fuelLogs
    .filter(log => log.card !== null && log.card?.area !== null)
    .reduce((groups, log) => {
      const areaName = log.card?.area?.name ?? 'Sin Área'
      if (!groups[areaName]) {
        groups[areaName] = []
      }
      groups[areaName].push(log)
      return groups
    }, {} as Record<string, any[]>)

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          subtitle="Consulte y exporte datos por área o factura"
          actions={
            <>
              <Button variant="outline" onClick={handleGenerateReport} disabled={isExporting || fuelLogs.length === 0}>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                {isExporting ? 'Generando...' : 'Reporte Detallado'}
              </Button>
              <Button onClick={() => { setSelectedSummaryMonth(''); setShowSummaryModal(true) }} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                {isExporting ? 'Generando...' : 'Resumen Ejecutivo'}
              </Button>
            </>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          {/* Header row: title + mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
            </div>
            <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm font-medium">
              <button
                onClick={() => handleFilterModeChange('period')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
                  filterMode === 'period'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                Por Período
              </button>
              <button
                onClick={() => handleFilterModeChange('factura')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 border-l border-slate-200 transition-colors',
                  filterMode === 'factura'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Por Factura
              </button>
            </div>
          </div>

          {/* Filter fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Área / Secretaría"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              options={[
                { value: '', label: 'Todas las áreas' },
                ...mainAreas.map(area => ({ value: area.id, label: area.name }))
              ]}
            />

            {filterMode === 'period' ? (
              <>
                <Input
                  label="Fecha de Inicio"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Fecha de Fin"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            ) : (
              <div className="md:col-span-2">
                <Select
                  label="Número de Factura"
                  value={facturaFilter}
                  onChange={(e) => {
                    setFacturaFilter(e.target.value)


                  }}
                  options={
                    availableFacturas.length > 0
                      ? [
                          { value: '', label: 'Seleccione una factura...' },
                          ...availableFacturas.map(f => ({
                            value: f.factura,
                            label: `${f.hasTotal ? '✓ ' : ''}${f.factura} — ${f.label}`
                          }))
                        ]
                      : [{ value: '', label: 'No hay facturas disponibles' }]
                  }
                  disabled={availableFacturas.length === 0}
                />
              </div>
            )}
          </div>

          {/* Active filter badges + action buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {selectedArea && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy-700 border border-navy-200">
                  {mainAreas.find(a => a.id === selectedArea)?.name}
                  <button onClick={() => setSelectedArea('')} className="ml-0.5 hover:text-navy-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterMode === 'period' && startDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy-700 border border-navy-200">
                  Desde {startDate.split('-').reverse().join('/')}
                  <button onClick={() => setStartDate('')} className="ml-0.5 hover:text-navy-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterMode === 'period' && endDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy-700 border border-navy-200">
                  Hasta {endDate.split('-').reverse().join('/')}
                  <button onClick={() => setEndDate('')} className="ml-0.5 hover:text-navy-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterMode === 'factura' && facturaFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy-700 border border-navy-200">
                  Factura {facturaFilter}
                  <button onClick={() => setFacturaFilter('')} className="ml-0.5 hover:text-navy-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {fuelLogs.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {fuelLogs.length} registro{fuelLogs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(selectedArea || startDate || endDate || facturaFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
              <Button onClick={fetchFilteredLogs} disabled={isLoadingLogs}>
                <Search className="w-4 h-4 mr-2" />
                {isLoadingLogs ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards — solo visibles cuando hay resultados */}
        {fuelLogs.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: <Hash className="w-4 h-4 text-navy-600" />,     label: 'Registros',      value: summary.recordCount.toLocaleString('es-AR') },
            { icon: <DollarSign className="w-4 h-4 text-navy-600" />,label: 'Importe Total',  value: formatARS(summary.totalAmount) },
            { icon: <Fuel className="w-4 h-4 text-navy-600" />,      label: 'Litros Totales', value: `${summary.totalLiters.toFixed(1)} L` },
            { icon: <TrendingUp className="w-4 h-4 text-navy-600" />,label: 'Precio Prom./L', value: formatARS(summary.avgPricePerLiter) },
            { icon: <CreditCard className="w-4 h-4 text-navy-600" />,label: 'Tarjetas',       value: summary.uniqueCards },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
              <div className="p-2 bg-navy-50 rounded-lg flex-shrink-0">{item.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{item.label}</p>
                <p className="text-lg font-semibold text-slate-800 font-mono">{item.value}</p>
              </div>
            </div>
          ))}
        </div>}

        {/* Data Table */}
        {fuelLogs.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Datos Importados</h2>
              <span className="text-xs text-slate-400 sm:hidden">← Deslizá para ver más</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-navy-600">
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Tarjeta</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Área</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Subárea</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Importe</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Litros</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fuelLogs
                    .filter(log => log.card !== null && log.card?.area !== null)
                    .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                        {new Date(log.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-800 font-mono">
                        {log.card?.cardNumber ?? ''}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-700">
                        {log.card?.area?.name ?? 'Sin Área'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-500">
                        {log.card?.subArea?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-800 font-mono text-right">
                        {formatARS(log.amount)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">
                        {log.gallons.toFixed(1)} L
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-500">
                        {log.location || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {fuelLogs.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Sin datos para mostrar</p>
            <p className="text-xs text-slate-400 mt-1">Seleccione filtros y haga clic en Buscar para consultar los registros</p>
          </div>
        )}
      </div>

      {/* Summary Month Selector Modal */}
      <Modal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title="Resumen Ejecutivo — Seleccionar Mes"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Seleccioná el mes para generar el Resumen Ejecutivo con todas las facturas del período.
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {availableMonths.length === 0 ? (
              <p className="text-sm text-slate-500">No hay facturas importadas.</p>
            ) : (
              availableMonths.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedSummaryMonth(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSummaryMonth === key
                      ? 'border-navy-600 bg-navy-50 text-navy-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => setShowSummaryModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleGenerateSummary(selectedSummaryMonth)}
              disabled={!selectedSummaryMonth || isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Generando...' : 'Generar'}
            </Button>
          </div>
        </div>
      </Modal>


    </MainLayout>
  )
}