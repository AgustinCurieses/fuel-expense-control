'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, FileSpreadsheet } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Types for import settings
interface ImportMapping {
  internalField: string
  rawColumnName: string
}

interface ImportSettings {
  id: string
  name: string
  isActive: boolean
  mappings: ImportMapping[]
  createdAt: string
  updatedAt: string
}

export default function ExcelMapperPage() {
  const [columnMappings, setColumnMappings] = useState({
    fecha: 'FECHA', // Line 30
    tarjeta: 'TARJETA', // Line 31
    conductorAutorizado: 'CONDUCTOR', // Line 32
    dominio: 'IDENTIFICACION TARJETA', // Line 33
    establecimiento: 'ESTABLECIMIENTO', // Line 34
    localidad: 'LOCALIDAD', // Line 35
    remito: 'REMITO', // Line 36
    producto: 'PRODUCTO', // Line 37
    litros: 'LITROS UNIDADES', // Line 38
    importe: 'IMP TOT PVP ESTABLECIMIENTO', // Line 39
    importeYER: 'IMP TOT YER' // Line 40
  })
  
  const [useAlternativeImporte, setUseAlternativeImporte] = useState(false)
  const [importSettings, setImportSettings] = useState<ImportSettings[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load import settings
      const settingsResponse = await fetch('/api/import-settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setImportSettings(settingsData)
        
        // Load saved mappings if they exist
        if (settingsData.length > 0 && settingsData[0].mappings) {
          const savedMappings = settingsData[0].mappings.reduce((acc: Record<string, string>, mapping: ImportMapping) => {
            acc[mapping.internalField] = mapping.rawColumnName
            return acc
          }, {})
          
          setColumnMappings((prev: typeof columnMappings) => ({
            ...prev,
            ...savedMappings
          }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    
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
      setSavedMessage('Configuración guardada exitosamente')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSavedMessage('Error al guardar la configuración')
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const defaultMappings = {
      fecha: 'FECHA',
      tarjeta: 'TARJETA',
      conductorAutorizado: 'CONDUCTOR',
      dominio: 'IDENTIFICACION TARJETA',
      establecimiento: 'ESTABLECIMIENTO',
      localidad: 'LOCALIDAD',
      remito: 'REMITO',
      producto: 'PRODUCTO',
      litros: 'LITROS UNIDADES',
      importe: 'IMP TOT PVP ESTABLECIMIENTO',
      importeYER: 'IMP TOT YER'
    }
    setColumnMappings(defaultMappings)
    setUseAlternativeImporte(false)
    setSavedMessage('Configuración reiniciada a valores predeterminados')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Importación Excel</h1>
            <p className="text-gray-600">Configure qué columnas de Excel usar para la importación de datos de combustible</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleReset}>
              Reiniciar Valores
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {savedMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{savedMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Configuración de Mapeo de Columnas</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
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
                  
                  {/* Producto - Line 601 */}
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
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Instrucciones de Importación</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Prepare su archivo Excel</p>
                  <p className="text-xs text-gray-500">Asegúrese de que su archivo Excel contenga las columnas especificadas arriba con encabezados adecuados</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Configure el mapeo de columnas</p>
                  <p className="text-xs text-gray-500">Configure los nombres exactos de las columnas de su archivo Excel en la configuración anterior</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Guarde la configuración</p>
                  <p className="text-xs text-gray-500">Haga clic en "Guardar Configuración" para almacenar su configuración de mapeo</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Importe sus datos</p>
                  <p className="text-xs text-gray-500">Vaya a la página de Reportes y use la función de importación con su archivo Excel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
