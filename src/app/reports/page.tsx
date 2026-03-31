'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, FileSpreadsheet, Calendar, MapPin, Filter, Printer, TrendingUp, Upload, Settings, CheckCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ToastComponent, useToast } from '@/components/ui/Toast'
import { FuelLog, Card, MainArea, SubArea, ImportSettings, ImportMapping, ImportResult } from '@/types'

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
  const [facturaTotal, setFacturaTotal] = useState<any>(null)
  const [totalOficial, setTotalOficial] = useState<string>('')
  const [isSavingTotal, setIsSavingTotal] = useState(false)
  const [validacionFactura, setValidacionFactura] = useState<string>('')
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [useAlternativeImporte, setUseAlternativeImporte] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const [logsResponse, areasResponse, settingsResponse, facturasResponse] = await Promise.all([
        fetch('/api/fuel-logs'),
        fetch('/api/areas'),
        fetch('/api/import-settings'),
        fetch('/api/facturas')
      ])
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setFuelLogs(logsData)
      }
      
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

  const loadFacturaTotal = async (factura: string) => {
    if (!factura) {
      setFacturaTotal(null)
      setTotalOficial('')
      return
    }

    try {
      const response = await fetch(`/api/facturas/total?factura=${encodeURIComponent(factura)}`)
      if (response.ok) {
        const data = await response.json()
        setFacturaTotal(data)
        setTotalOficial(data.totalOficial ? data.totalOficial.toString() : '')
      }
    } catch (error) {
      console.error('Error loading factura total:', error)
    }
  }

  const handleSaveTotalOficial = async () => {
    if (!validacionFactura || !totalOficial) {
      toastError('Datos incompletos', 'Seleccione una factura e ingrese el total oficial')
      return
    }

    const parsed = parseFloat(totalOficial.replace(/\./g, '').replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      toastError('Monto inválido', 'Ingrese un número mayor a cero')
      return
    }

    setIsSavingTotal(true)
    try {
      const response = await fetch('/api/facturas/total', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factura: validacionFactura, totalOficial: parsed })
      })

      if (response.ok) {
        const data = await response.json()
        setFacturaTotal(data)
        // Refresh factura list to update hasTotal indicators
        const facturasRes = await fetch('/api/facturas')
        if (facturasRes.ok) setAvailableFacturas(await facturasRes.json())
        toastSuccess('Total guardado', `Factura ${validacionFactura} validada correctamente`)
      } else {
        toastError('Error al guardar', 'No se pudo guardar el total oficial')
      }
    } catch (error) {
      console.error('Error saving factura total:', error)
      toastError('Error al guardar', 'No se pudo guardar el total oficial')
    } finally {
      setIsSavingTotal(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const mappings = Object.entries(columnMappings).map(([field, columnName]) => ({
        internalField: field,
        rawColumnName: columnName
      }))

      const response = await fetch('/api/import-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Configuración Principal',
          mappings
        })
      })

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

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FRONTEND IMPORT HANDLER TRIGGERED ===')
    console.log('File selected:', event.target.files?.[0]?.name)
    console.log('Use alternative importe:', useAlternativeImporte)
    
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected, returning early')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('useAlternativeImporte', useAlternativeImporte.toString())

      console.log('About to fetch /api/import-excel...')
      
      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData
      })

      console.log('Response received:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.log('Response error:', error)
        throw new Error(error.error || 'Import failed')
      }

      const result: ImportResult = await response.json()
      console.log('Import result:', result)
      setImportResult(result)
      
      if (result.success) {
        await loadData() // Refresh data
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        totalRows: 0,
        importedRows: 0,
        pendingRows: 0,
        duplicateRows: 0,
        failedRows: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFilterModeChange = (mode: 'period' | 'factura') => {
    setFilterMode(mode)
    if (mode === 'period') {
      setFacturaFilter('')
    } else {
      setStartDate('')
      setEndDate('')
    }
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

    // Facturas del mes seleccionado
    const currFacturas = availableFacturas
      .filter(f => getMonthKey(f.label) === month)
      .map(f => f.factura)

    if (currFacturas.length === 0) {
      alert('No hay facturas importadas para el mes seleccionado')
      return
    }

    // Mes anterior
    const [year, mon] = month.split('-').map(Number)
    const prevDate = new Date(year, mon - 2, 1)
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevFacturas = availableFacturas
      .filter(f => getMonthKey(f.label) === prevKey)
      .map(f => f.factura)

    const monthLabelStr = availableMonths.find(m => m.key === month)?.label ?? month

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
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
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

  // Filter data based on selected filters
  const filteredData = fuelLogs.filter(log => {
    if (selectedArea && (!log.card || log.card.areaId !== selectedArea)) return false
    if (startDate && new Date(log.date) < new Date(startDate)) return false
    if (endDate && new Date(log.date) > new Date(endDate)) return false
    return true
  })

  // Calculate summary statistics (excluding PENDING rows)
  const validData = filteredData.filter(log => log.card !== null && log.card?.area !== null)
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
  const dataByArea = filteredData
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importación y Reportes</h1>
            <p className="text-gray-600">Importe datos de Excel y genere reportes por área</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button onClick={handleGenerateReport} disabled={isExporting || filteredData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Generando...' : 'Generar Reporte'}
            </Button>
            <Button onClick={() => { setSelectedSummaryMonth(''); setShowSummaryModal(true) }} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Generando...' : 'Resumen Ejecutivo'}
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Importar Datos de Excel</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {isImporting ? 'Importando...' : 'Seleccionar Archivo Excel'}
              </Button>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useAlternativeImporte}
                  onChange={(e) => setUseAlternativeImporte(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  Usar "IMP TOT YER" en lugar de "IMP TOT PVP ESTABLECIMIENTO"
                </span>
              </label>
            </div>

            {importResult && (
              <div className={`p-4 rounded-lg ${
                importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? 'Importación Exitosa' : 'Importación con Errores'}
                </h3>
                <div className="text-sm space-y-1">
                  <p>Total de filas: {importResult.totalRows}</p>
                  <p>Filas importadas: {importResult.importedRows}</p>
                  <p>Filas pendientes: {importResult.pendingRows || 0}</p>
                  <p>Filas duplicadas: {importResult.duplicateRows || 0}</p>
                  <p>Filas fallidas: {importResult.failedRows}</p>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-red-800">Errores:</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {importResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-yellow-800">Advertencias:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          
          {/* Filter Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">Tipo de Filtro</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="filterMode"
                  value="period"
                  checked={filterMode === 'period'}
                  onChange={(e) => handleFilterModeChange(e.target.value as 'period' | 'factura')}
                  className="text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-900">Filtrar por Período</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="filterMode"
                  value="factura"
                  checked={filterMode === 'factura'}
                  onChange={(e) => handleFilterModeChange(e.target.value as 'period' | 'factura')}
                  className="text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-900">Filtrar por Número de Factura</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Área"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              options={[
                { value: '', label: 'Todas las áreas' },
                ...mainAreas.map(area => ({
                  value: area.id,
                  label: area.name
                }))
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
                
                <div></div> {/* Empty placeholder for grid alignment */}
              </>
            ) : (
              <>
                <div></div> {/* Empty placeholder for grid alignment */}
                <div></div> {/* Empty placeholder for grid alignment */}
                <Select
                  label="Número de Factura"
                  value={facturaFilter}
                  onChange={(e) => {
                    setFacturaFilter(e.target.value)
                    setValidacionFactura(e.target.value)
                    loadFacturaTotal(e.target.value)
                  }}
                  options={
                    availableFacturas.length > 0
                      ? availableFacturas.map(f => ({
                          value: f.factura,
                          label: `${f.hasTotal ? '✓ ' : ''}${f.factura} - ${f.label}`
                        }))
                      : [{ value: '', label: 'No hay facturas disponibles' }]
                  }
                  disabled={availableFacturas.length === 0}
                />
                <div></div> {/* Empty placeholder for grid alignment */}
              </>
            )}
          </div>
        </div>

        {/* Validacion de Total de Factura */}
        {availableFacturas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Validacion de Total de Factura</h3>
              {facturaTotal?.totalOficial && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Validada
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="Factura a Validar"
                value={validacionFactura}
                onChange={(e) => {
                  setValidacionFactura(e.target.value)
                  loadFacturaTotal(e.target.value)
                }}
                options={[
                  { value: '', label: 'Seleccione una factura...' },
                  ...availableFacturas.map(f => ({
                    value: f.factura,
                    label: `${f.hasTotal ? '\u2713 ' : ''}${f.factura} - ${f.label}`
                  }))
                ]}
              />
              {facturaTotal && (
                <div className="flex flex-col justify-end">
                  <p className="text-xs text-gray-500 mb-1">Total calculado (App)</p>
                  <p className="text-xl font-bold text-blue-600">{facturaTotal.totalCalculadoFormateado}</p>
                </div>
              )}
            </div>

            {validacionFactura && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Input
                    label="Total Oficial YPF"
                    value={totalOficial}
                    onChange={(e) => setTotalOficial(e.target.value)}
                    placeholder="Ej: 1234567.89"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <Button
                    onClick={handleSaveTotalOficial}
                    disabled={isSavingTotal || !totalOficial}
                    className="w-full"
                  >
                    {isSavingTotal ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
                <div></div>
              </div>
            )}

            {facturaTotal && facturaTotal.totalOficial && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Comparacion de Totales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total App:</span>
                    <span className="font-semibold">{facturaTotal.totalCalculadoFormateado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total YPF:</span>
                    <span className="font-semibold">{facturaTotal.totalOficialFormateado}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-medium">Diferencia:</span>
                    <span className={`font-bold ${
                      Math.abs(facturaTotal.diferencia || 0) < 1
                        ? 'text-green-600'
                        : Math.abs(facturaTotal.diferencia || 0) <= 100
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {facturaTotal.diferenciaFormateada}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Registros</p>
                <p className="text-xl font-bold text-gray-900">{summary.recordCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Importe Total</p>
                <p className="text-xl font-bold text-gray-900">${summary.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Litros Totales</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalLiters.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Precio Promedio/L</p>
                <p className="text-xl font-bold text-gray-900">${summary.avgPricePerLiter.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tarjetas Únicas</p>
                <p className="text-xl font-bold text-gray-900">{summary.uniqueCards}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Datos Importados</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subárea</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData
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

        {filteredData.length === 0 && (
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
          
          {/* Importe Column Selection - RADIO BUTTONS */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Columna de Importe Activa
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="importeColumn"
                  value="PVP"
                  checked={!useAlternativeImporte}
                  onChange={(e) => setUseAlternativeImporte(e.target.value === 'YER')}
                  className="text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-900">IMP TOT PVP ESTABLECIMIENTO (Precio en estación)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="importeColumn"
                  value="YER"
                  checked={useAlternativeImporte}
                  onChange={(e) => setUseAlternativeImporte(e.target.value === 'YER')}
                  className="text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-900">IMP TOT YER (Precio contractual)</span>
              </label>
            </div>
          </div>
          
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