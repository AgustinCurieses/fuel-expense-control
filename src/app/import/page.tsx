'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { DropZone } from '@/components/ui/DropZone'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

type ImportStep = 'upload' | 'processing' | 'complete'

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // Factura validation modal
  const [showValidation, setShowValidation] = useState(false)
  const [validationFacturas, setValidationFacturas] = useState<string[]>([])
  const [facturaCalcTotals, setFacturaCalcTotals] = useState<Record<string, string>>({})
  const [facturaInputs, setFacturaInputs] = useState<Record<string, string>>({})
  const [isSavingValidation, setIsSavingValidation] = useState(false)
  const [savedFacturas, setSavedFacturas] = useState<Set<string>>(new Set())

  const openValidationModal = async (facturas: string[]) => {
    const totals: Record<string, string> = {}
    const inputs: Record<string, string> = {}
    await Promise.all(facturas.map(async (f: string) => {
      try {
        const res = await fetch(`/api/facturas/total?factura=${encodeURIComponent(f)}`)
        if (res.ok) {
          const data = await res.json()
          totals[f] = data.totalCalculadoFormateado ?? ''
          if (data.totalOficial) inputs[f] = data.totalOficial.toString()
        }
      } catch {}
    }))
    setFacturaCalcTotals(totals)
    setFacturaInputs(inputs)
    setValidationFacturas(facturas)
    setSavedFacturas(new Set())
    setShowValidation(true)
  }

  const handleSaveValidation = async () => {
    setIsSavingValidation(true)
    const saved = new Set<string>()
    for (const f of validationFacturas) {
      const val = facturaInputs[f]
      if (!val) continue
      const parsed = parseFloat(val.replace(/\./g, '').replace(',', '.'))
      if (isNaN(parsed) || parsed <= 0) continue
      try {
        const res = await fetch('/api/facturas/total', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ factura: f, totalOficial: parsed })
        })
        if (res.ok) saved.add(f)
      } catch {}
    }
    setSavedFacturas(saved)
    setIsSavingValidation(false)
    setShowValidation(false)
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setError('')
    setCurrentStep('processing')
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('useAlternativeImporte', 'false')

      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      setImportResult(result)
      await new Promise(resolve => setTimeout(resolve, 100))
      setCurrentStep('complete')

      if (result.discoveredFacturas && result.discoveredFacturas.length > 0) {
        await openValidationModal(result.discoveredFacturas)
      }

    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process file')
      setImportResult({
        success: false,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
        warnings: []
      })
      setCurrentStep('complete')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setError('')
    setImportResult(null)
    setValidationFacturas([])
    setFacturaInputs({})
    setFacturaCalcTotals({})
    setSavedFacturas(new Set())
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Importación de Excel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cargue y procese archivos Excel de gastos de combustible</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            {[
              { id: 'upload', label: 'Cargar Archivo', icon: Upload },
              { id: 'processing', label: 'Procesando', icon: Clock },
              { id: 'complete', label: 'Completado', icon: CheckCircle }
            ].map((step, index) => {
              const stepOrder = { upload: 0, processing: 1, complete: 2 }
              const isDone = stepOrder[currentStep as keyof typeof stepOrder] > stepOrder[step.id as keyof typeof stepOrder]
              const isActive = currentStep === step.id
              return (
                <div key={step.id} className="flex items-center">
                  <div className={clsx(
                    'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors',
                    isActive ? 'bg-navy-600 border-navy-600 text-white' :
                    isDone  ? 'bg-navy-100 border-navy-300 text-navy-600' :
                              'border-slate-300 text-slate-400'
                  )}>
                    {step.id === 'processing' && currentStep === 'processing'
                      ? <Spinner size="sm" className="text-white" />
                      : <step.icon className="w-4 h-4" />
                    }
                  </div>
                  <span className={clsx(
                    'ml-2 text-sm font-medium',
                    isActive || isDone ? 'text-navy-600' : 'text-slate-400'
                  )}>
                    {step.label}
                  </span>
                  {index < 2 && <ArrowRight className="w-4 h-4 text-slate-300 mx-4" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Cargar Archivo Excel</h2>
            <DropZone onFileSelect={handleFileSelect} isProcessing={isProcessing} error={error} />
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-base font-semibold text-slate-800 mb-1">Procesando Archivo</h2>
            <p className="text-sm text-slate-500">Analizando datos y procesando registros...</p>
            {selectedFile && <p className="text-xs text-slate-400 mt-2">{selectedFile.name}</p>}
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && importResult && (
          <div className="space-y-5">
            <div className={`bg-white rounded-lg border p-6 ${importResult.success ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-center gap-3 mb-5">
                {importResult.success
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <AlertTriangle className="w-5 h-5 text-red-700" />
                }
                <h2 className={`text-base font-semibold ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Importación Exitosa' : 'Importación con Errores'}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-2xl font-semibold text-slate-800 font-mono">{importResult.totalRows}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total filas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-2xl font-semibold text-green-700 font-mono">{importResult.importedRows}</p>
                  <p className="text-xs text-green-600 mt-0.5">Importadas</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-2xl font-semibold text-red-700 font-mono">{importResult.failedRows}</p>
                  <p className="text-xs text-red-600 mt-0.5">Fallidas</p>
                </div>
                {importResult.updatedRows > 0 && (
                  <div className="text-center p-4 bg-navy-50 rounded-lg border border-navy-100">
                    <p className="text-2xl font-semibold text-navy-600 font-mono">{importResult.updatedRows}</p>
                    <p className="text-xs text-navy-500 mt-0.5">Actualizadas</p>
                  </div>
                )}
              </div>

              {importResult.updatedRows > 0 && (
                <div className="mt-4 p-3 bg-navy-50 border border-navy-100 rounded-lg">
                  <p className="text-sm text-navy-700">
                    <strong>{importResult.updatedRows} registros</strong> actualizados con número de factura
                  </p>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Errores:</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {importResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Advertencias:</h3>
                  <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                    {importResult.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleReset}>Cargar Otro Archivo</Button>
            </div>
          </div>
        )}
      </div>

      {/* Factura Validation Modal */}
      <Modal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        title="Validar Totales de Factura"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Se detectaron las siguientes facturas en la importación. Ingrese el total oficial de YPF para cada una y guarde para completar la validación.
          </p>

          <div className="space-y-3">
            {validationFacturas.map(f => (
              <div key={f} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">Factura {f}</p>
                  {savedFacturas.has(f) && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Validada
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total calculado (App)</p>
                    <p className="text-base font-bold text-blue-600">{facturaCalcTotals[f] ?? '—'}</p>
                  </div>
                  <div>
                    <Input
                      label="Total Oficial YPF"
                      value={facturaInputs[f] ?? ''}
                      onChange={e => setFacturaInputs(prev => ({ ...prev, [f]: e.target.value }))}
                      placeholder="Ej: 1234567.89"
                      type="text"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowValidation(false)}>
              Omitir
            </Button>
            <Button onClick={handleSaveValidation} disabled={isSavingValidation}>
              {isSavingValidation ? 'Guardando...' : 'Guardar validación'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
