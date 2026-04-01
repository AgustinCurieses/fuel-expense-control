import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'

interface SearchableSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  error?: string
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Buscar...',
  error
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption?.label || ''

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: { value: string; label: string }) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="space-y-1" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          className={clsx(
            'relative w-full px-3 py-2 border rounded-md cursor-pointer bg-white text-sm',
            'focus:outline-none',
            isOpen ? 'border-navy-600 ring-2 ring-navy-600' : 'border-slate-300',
            error && 'border-red-400'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={clsx('block truncate', !displayValue && 'text-slate-400')}>
              {displayValue || placeholder}
            </span>
            <div className="flex items-center gap-1.5">
              {displayValue && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleClear() }}
                  className="p-0.5 hover:bg-slate-100 rounded"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
              <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-56 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-slate-400">
                  Sin resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={clsx(
                      'px-3 py-2 text-sm cursor-pointer transition-colors',
                      option.value === value
                        ? 'bg-navy-50 text-navy-600 font-medium'
                        : 'hover:bg-slate-50 text-slate-800'
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
