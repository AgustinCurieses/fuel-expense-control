'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Download, FileSpreadsheet, Calendar, Filter, Search, X, TrendingUp, DollarSign, Fuel, CreditCard, Hash } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ToastComponent, useToast } from '@/components/ui/Toast'
import { FuelLog, Card, MainArea, SubArea, ImportSettings, ImportMapping } from '@/types'

export default function ReportsPage() {
  const [fuelLogs, setFuelLogs] = useState<(FuelLog & { 
    card: Card & { area: MainArea; subArea?: SubArea }
  })[]>([])
  const [mainAreas, setMainAreas] = useState<MainArea[]>([])
  const [importSettings, setImportSettings] = useState<ImportSettings[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [facturaFilter, setFacturaFilter] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'period' | 'factura'>('period')
  const [availableFacturas, setAvailableFacturas] = useState<any[]>([])
  const { toasts, removeToast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  // Column mappings state - EXACT 12 FIELDS WITH SPANISH LABELS
  const [columnMappings, setColumnMappings] = useState({
    fecha: 'FECHA', // Line 30
    tarjeta: 'TARJETA', // Line 31
    conductorAutorizado: 'CONDUCTOR', // Line 32
    dominio: 'IDENTIFICACION TARJETA', // Line 33
    establecimiento: 'ESTABLECIMIENTO', // Line 34
    localidad: 'LOCALIDAD', // Line 35
    remito: 'REMITO', // Line 36
    producto: 'PRODUCTO', // Line 37
    factura: 'FACTURA', // Line 30
    litros: 'LITROS UNIDADES', // Line 38
    importe: 'IMP TOT PVP ESTABLECIMIENTO', // Line 39
    importeYER: 'IMP TOT YER' // Line 40
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [areasResponse, settingsResponse, facturasResponse] = await Promise.all([
        fetch('/api/areas'),
        fetch('/api/import-settings'),
        fetch('/api/facturas')
      ])

      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setMainAreas(areasData.mainAreas)
      }
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setImportSettings(settingsData)
        
        // Load saved mappings if they exist
        if (settingsData.length > 0 && settingsData[0].mappings) {
          const savedMappings = settingsData[0].mappings.reduce((acc: any, mapping: ImportMapping) => {
            acc[mapping.internalField] = mapping.rawColumnName
            return acc
          }, {})
          
          setColumnMappings(prev => ({
            ...prev,
            ...savedMappings
          }))
        }
      }
      
      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json()
        setAvailableFacturas(facturasData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }
  const handleSaveSettings = async () => {
    try {
      const mappings = Object.entries(columnMappings).map(([field, columnName]) => ({
        internalField: field,
        rawColumnName: columnName
      }))

      const existingSetting = importSettings.length > 0 ? importSettings[0] : null

      let response: Response
      if (existingSetting) {
        response = await fetch('/api/import-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existingSetting.id,
            name: existingSetting.name,
            isActive: existingSetting.isActive,
            mappings
          })
        })
      } else {
        response = await fetch('/api/import-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Configuración Principal',
            mappings
          })
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      await loadData() // Reload settings
      setShowSettings(false)
      alert('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar la configuración')
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
      alert('Por favor seleccione ambas fechas')
      return
    }
    if (filterMode === 'factura' && !facturaFilter) {
      alert('Por favor seleccione una factura')
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
      alert('Por favor seleccione ambas fechas de inicio y fin')
      return
    }
    if (filterMode === 'factura' && !facturaFilter) {
      alert('Por favor seleccione un número de factura')
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
      alert(error instanceof Error ? error.message : 'Failed to generate report')
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
      alert('No hay facturas importadas para el mes seleccionado')
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
      alert(error instanceof Error ? error.message : 'Failed to generate summary report')
    } finally {
      setIsExporting(false)
    }
  }



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
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Reportes</h1>
            <p className="text-sm text-slate-500 mt-0.5">Consulte y exporte datos por área o factura</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" onClick={handleGenerateReport} disabled={isExporting || fuelLogs.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Generando...' : 'Reporte Detallado'}
            </Button>
            <Button onClick={() => { setSelectedSummaryMonth(''); setShowSummaryModal(true) }} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Generando...' : 'Resumen Ejecutivo'}
            </Button>
          </div>
        </div>

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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: <Hash className="w-4 h-4 text-navy-600" />,     label: 'Registros',      value: summary.recordCount.toLocaleString('es-AR') },
            { icon: <DollarSign className="w-4 h-4 text-navy-600" />,label: 'Importe Total',  value: `$${summary.totalAmount.toFixed(2)}` },
            { icon: <Fuel className="w-4 h-4 text-navy-600" />,      label: 'Litros Totales', value: summary.totalLiters.toFixed(1) },
            { icon: <TrendingUp className="w-4 h-4 text-navy-600" />,label: 'Precio Prom./L', value: `$${summary.avgPricePerLiter.toFixed(2)}` },
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
        </div>

        {/* Data Table */}
        {fuelLogs.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Datos Importados</h2>
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {fuelLogs
                    .filter(log => log.card !== null && log.card?.area !== null)
                    .map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.card?.cardNumber ?? ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.card?.area?.name ?? 'Sin Área'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.card?.subArea?.name ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${log.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.gallons.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.location || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {fuelLogs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos</h3>
            <p className="text-gray-500">Importe datos de Excel o ajuste los filtros.</p>
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
          <p className="text-sm text-gray-600">
            Seleccioná el mes para generar el Resumen Ejecutivo con todas las facturas del período.
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {availableMonths.length === 0 ? (
              <p className="text-sm text-gray-400">No hay facturas importadas.</p>
            ) : (
              availableMonths.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedSummaryMonth(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSummaryMonth === key
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
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

      {/* Settings Modal - COMPLETE 11-FIELD CONFIGURATION */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configuración de Importación"
        size="xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Configure cómo las columnas del archivo Excel se mapean a los campos internos del sistema.
          </p>
          
          {/* Column Mappings - ALL 11 FIELDS */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Mapeo de Columnas</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Fecha - Line 545 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Fecha</label>
                <Input 
                  value={columnMappings.fecha}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, fecha: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Tarjeta - Line 553 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Tarjeta</label>
                <Input 
                  value={columnMappings.tarjeta}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, tarjeta: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Conductor Autorizado - Line 561 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Conductor Autorizado</label>
                <Input 
                  value={columnMappings.conductorAutorizado}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, conductorAutorizado: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Dominio - Line 569 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Dominio</label>
                <Input 
                  value={columnMappings.dominio}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, dominio: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Establecimiento - Line 577 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Establecimiento</label>
                <Input 
                  value={columnMappings.establecimiento}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, establecimiento: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Localidad - Line 585 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Localidad</label>
                <Input 
                  value={columnMappings.localidad}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, localidad: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Remito - Line 593 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Remito</label>
                <Input 
                  value={columnMappings.remito}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, remito: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Factura - Line 601 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Factura</label>
                <Input 
                  value={columnMappings.factura}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, factura: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Producto - Line 609 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Producto</label>
                <Input 
                  value={columnMappings.producto}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, producto: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Litros - Line 609 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Litros</label>
                <Input 
                  value={columnMappings.litros}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, litros: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Importe (PVP) - Line 617 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Importe (PVP)</label>
                <Input 
                  value={columnMappings.importe}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, importe: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
              
              {/* Importe alternativo (YER) - Line 625 */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Importe alternativo (YER)</label>
                <Input 
                  value={columnMappings.importeYER}
                  onChange={(e) => setColumnMappings(prev => ({ ...prev, importeYER: e.target.value }))}
                  placeholder="Nombre de columna en Excel"
                  className="col-span-2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </MainLayout>
  )
}