'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastContext } from '@/contexts/ToastContext'

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
  const [mappingExpanded, setMappingExpanded] = useState(false)
  const { success: toastSuccess, error: toastError } = useToastContext()

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
      toastSuccess('Configuración guardada')
    } catch {
      toastError('Error', 'No se pudo guardar la configuración')
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
    toastSuccess('Valores reiniciados', 'Configuración predeterminada restaurada')
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
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Configuración</h1>
            <p className="text-sm text-slate-500 mt-0.5">Parámetros generales del sistema de control de combustible</p>
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

        {/* Importación Excel */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-navy-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-800">Importación Excel</h2>
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
                  <p className="text-sm font-medium text-slate-800 group-hover:text-navy-600 transition-colors">
                    Mapeo de Columnas del Excel
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mappingExpanded ? 'Haga clic para contraer' : `${fields.length} campos configurados — haga clic para expandir`}
                  </p>
                </div>
                {mappingExpanded
                  ? <ChevronDown className="w-4 h-4 text-slate-400" />
                  : <ChevronRight className="w-4 h-4 text-slate-400" />
                }
              </button>

              {mappingExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {fields.map(({ key, label }) => (
                      <div key={key} className="grid grid-cols-3 gap-3 items-center">
                        <label className="text-sm font-medium text-slate-700">{label}</label>
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

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-800 mb-3">Columna de Importe Activa</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importeColumn"
                          value="PVP"
                          checked={!useAlternativeImporte}
                          onChange={() => setUseAlternativeImporte(false)}
                          className="text-navy-600 border-slate-300"
                        />
                        <span className="text-sm text-slate-800">
                          <span className="font-medium">IMP TOT PVP ESTABLECIMIENTO</span>
                          <span className="text-slate-500 ml-1">— Precio en estación</span>
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importeColumn"
                          value="YER"
                          checked={useAlternativeImporte}
                          onChange={() => setUseAlternativeImporte(true)}
                          className="text-navy-600 border-slate-300"
                        />
                        <span className="text-sm text-slate-800">
                          <span className="font-medium">IMP TOT YER</span>
                          <span className="text-slate-500 ml-1">— Precio contractual</span>
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
