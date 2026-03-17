'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, FileSpreadsheet, Calendar, MapPin, Filter, Printer, TrendingUp, Upload, Settings } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
  const [isExporting, setIsExporting] = useState(false)
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
    // Clear inputs when switching modes
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

  const handleGenerateSummary = async () => {
    if (filterMode === 'period' && (!startDate || !endDate)) {
      alert('Seleccioná un período o número de factura para generar el resumen')
      return
    }
    if (filterMode === 'factura' && !facturaFilter) {
      alert('Seleccioná un período o número de factura para generar el resumen')
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
      // NOTE: Do NOT include areaId - summary should always include all areas

      const response = await fetch(`/api/generate-summary?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to generate summary report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Resumen Ejecutivo.xlsx'
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
    if (selectedArea && log.card.areaId !== selectedArea) return false
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
            <Button onClick={handleGenerateSummary} disabled={isExporting || filteredData.length === 0}>
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
                <span className="text-sm text-gray-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Filtro</label>
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
                <span className="text-sm">Filtrar por Período</span>
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
                <span className="text-sm">Filtrar por Número de Factura</span>
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
                  onChange={(e) => setFacturaFilter(e.target.value)}
                  options={
                    availableFacturas.length > 0
                      ? availableFacturas.map(factura => ({
                          value: factura.factura,
                          label: `${factura.factura} - ${factura.label}`
                        }))
                      : [{ value: '', label: 'No hay facturas disponibles', disabled: true }]
                  }
                  disabled={availableFacturas.length === 0}
                />
                <div></div> {/* Empty placeholder for grid alignment */}
              </>
            )}
          </div>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                <span className="text-sm">IMP TOT PVP ESTABLECIMIENTO (Precio en estación)</span>
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
                <span className="text-sm">IMP TOT YER (Precio contractual)</span>
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
    </MainLayout>
  )
}
