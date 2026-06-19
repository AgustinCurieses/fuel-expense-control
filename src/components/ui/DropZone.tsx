import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface DropZoneProps {
  onFileSelect: (file: File) => void
  isProcessing?: boolean
  error?: string
  onInvalidFile?: () => void
}

export function DropZone({ onFileSelect, isProcessing = false, error, onInvalidFile }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file =>
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )

    if (excelFile) {
      onFileSelect(excelFile)
    } else {
      onInvalidFile?.()
    }
  }, [onFileSelect, onInvalidFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div className="w-full">
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver ? 'border-navy-400 bg-navy-50' : 'border-slate-300',
          isProcessing && 'opacity-50 pointer-events-none',
          error && 'border-red-300 bg-red-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          aria-label="Seleccionar archivo Excel"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center space-y-4">
          {error ? (
            <AlertCircle className="w-12 h-12 text-red-500" aria-hidden="true" />
          ) : (
            <Upload className={clsx(
              'w-12 h-12',
              isDragOver ? 'text-navy-600' : 'text-slate-400'
            )} aria-hidden="true" />
          )}

          <div>
            <p className={clsx(
              'text-lg font-medium',
              error ? 'text-red-600' : 'text-slate-800'
            )}>
              {error ? error : 'Arrastre su archivo Excel aquí'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              o haga clic para explorar
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>Soporta archivos .xlsx y .xls</span>
          </div>
        </div>
      </div>
    </div>
  )
}
