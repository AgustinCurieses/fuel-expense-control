'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
  })

  const [useAlternativeImporte, setUseAlternativeImporte] = useState(false)
  const [importSettings, setImportSettings] = useState<ImportSettings[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [mappingExpanded, setMappingExpanded] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const settingsResponse = await fetch('/api/import-settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setImportSettings(settingsData)
        if (settingsData.length > 0 && settingsData[0].mappings) {
          const savedMappings = settingsData[0].mappings.reduce((acc: Record<string, string>, mapping: ImportMapping) => {
            acc[mapping.internalField] = mapping.rawColumnName
            return acc
          }, {})
          setColumnMappings((prev: typeof columnMappings) => ({ ...prev, ...savedMappings }))
        }
      }
    } catch {
      // silent
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
        body: JSON.stringify({ name: 'Configuración Principal', mappings })
      })
      if (!response.ok) throw new Error('Failed to save settings')
      await loadData()
      setSavedMessage('Configuración guardada exitosamente')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch {
      setSavedMessage('Error al guardar la configuración')
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setColumnMappings({
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
    })
    setUseAlternativeImporte(false)
    setSavedMessage('Configuración reiniciada a valores predeterminados')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  const fields: { key: keyof typeof columnMappings; label: string }[] = [
    { key: 'fecha',               label: 'Fecha' },
    { key: 'tarjeta',             label: 'Tarjeta' },
    { key: 'conductorAutorizado', label: 'Conductor Autorizado' },
    { key: 'dominio',             label: 'Dominio / Identificación' },
    { key: 'establecimiento',     label: 'Establecimiento' },
    { key: 'localidad',           label: 'Localidad' },
    { key: 'remito',              label: 'Remito' },
    { key: 'producto',            label: 'Producto' },
    { key: 'litros',              label: 'Litros' },
    { key: 'importe',             label: 'Importe (PVP)' },
    { key: 'importeYER',          label: 'Importe alternativo (YER)' },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Parámetros generales del sistema de control de combustible</p>
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

        {/* Success / error message */}
        {savedMessage && (
          <div className={`border rounded-lg p-4 ${savedMessage.startsWith('Error') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-sm ${savedMessage.startsWith('Error') ? 'text-red-800' : 'text-green-800'}`}>{savedMessage}</p>
          </div>
        )}

        {/* Importación Excel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Importación Excel</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Mapeo de columnas — collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setMappingExpanded(v => !v)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    Mapeo de Columnas del Excel
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mappingExpanded ? 'Haga clic para contraer' : `${fields.length} campos configurados — haga clic para expandir`}
                  </p>
                </div>
                {mappingExpanded
                  ? <ChevronDown className="w-4 h-4 text-gray-400" />
                  : <ChevronRight className="w-4 h-4 text-gray-400" />
                }
              </button>

              {mappingExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {fields.map(({ key, label }) => (
                      <div key={key} className="grid grid-cols-3 gap-3 items-center">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        <div className="col-span-2">
                          <Input
                            value={columnMappings[key]}
                            onChange={(e) => setColumnMappings(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder="Nombre exacto de la columna en Excel"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 mb-3">Columna de Importe Activa</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importeColumn"
                          value="PVP"
                          checked={!useAlternativeImporte}
                          onChange={() => setUseAlternativeImporte(false)}
                          className="text-blue-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">IMP TOT PVP ESTABLECIMIENTO</span>
                          <span className="text-gray-500 ml-1">— Precio en estación</span>
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importeColumn"
                          value="YER"
                          checked={useAlternativeImporte}
                          onChange={() => setUseAlternativeImporte(true)}
                          className="text-blue-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">IMP TOT YER</span>
                          <span className="text-gray-500 ml-1">— Precio contractual</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
