'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { DropZone } from '@/components/ui/DropZone'
import { Spinner } from '@/components/ui/Spinner'

type ImportStep = 'upload' | 'processing' | 'complete'

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileSelect = async (file: File) => {
    console.log('=== IMPORT PAGE FILE HANDLER TRIGGERED ===')
    console.log('File selected:', file.name)
    
    setSelectedFile(file)
    setError('')
    setCurrentStep('processing')
    setIsProcessing(true)
    console.log('Step changed to: processing')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('useAlternativeImporte', 'false') // Default to PVP for now

      console.log('About to fetch /api/import-excel from import page...')
      
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

      const result = await response.json()
      console.log('Import result:', result)
      setImportResult(result)
      
      // Small delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 100))
      setCurrentStep('complete')
      console.log('Step changed to: complete (success)')
      
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
      setCurrentStep('complete') // Show complete step even with errors
      console.log('Step changed to: complete (error)')
    } finally {
      setIsProcessing(false)
      console.log('Processing set to false')
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setError('')
    setImportResult(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importación de Excel</h1>
            <p className="text-gray-600">Cargue y procese archivos Excel de gastos de combustible</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            {[
              { id: 'upload', label: 'Cargar Archivo', icon: Upload },
              { id: 'processing', label: 'Procesando', icon: Spinner },
              { id: 'complete', label: 'Completado', icon: CheckCircle }
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={clsx(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  currentStep === step.id ||
                  (Object.keys({ upload: 1, processing: 2, complete: 3 })
                    .indexOf(currentStep) > Object.keys({ upload: 1, processing: 2, complete: 3 })
                    .indexOf(step.id))
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                )}>
                  {step.id === 'processing' && currentStep === 'processing' ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={clsx(
                  'ml-2 text-sm font-medium',
                  currentStep === step.id || 
                  (Object.keys({ upload: 1, processing: 2, complete: 3 })
                    .indexOf(currentStep) > Object.keys({ upload: 1, processing: 2, complete: 3 })
                    .indexOf(step.id))
                    ? 'text-blue-600'
                    : 'text-gray-400'
                )}>
                  {step.label}
                </span>
                {index < 2 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cargar Archivo Excel</h2>
              <DropZone 
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                error={error}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Requisitos de Importación</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El archivo Excel debe contener las columnas configuradas en la página de configuración</li>
                <li>• Los números de tarjeta deben coincidir con las tarjetas existentes en el sistema</li>
                <li>• El formato de fecha debe ser reconocible</li>
                <li>• Importe y Litros deben ser valores numéricos</li>
              </ul>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Procesando Archivo Excel</h2>
              <p className="text-gray-600">Analizando datos y procesando registros...</p>
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2">Archivo: {selectedFile.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && importResult && (
          <div className="space-y-6">
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
              importResult.success ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {importResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                <h2 className={`text-lg font-semibold ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? 'Importación Exitosa' : 'Importación con Errores'}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{importResult.totalRows}</p>
                    <p className="text-sm text-gray-600">Total de Filas</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{importResult.importedRows}</p>
                    <p className="text-sm text-green-600">Filas Importadas</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{importResult.failedRows}</p>
                    <p className="text-sm text-red-600">Filas Fallidas</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-red-800 mb-2">Errores:</h3>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {importResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Advertencias:</h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {importResult.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleReset}>
                Cargar Otro Archivo
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
