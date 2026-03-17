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
  placeholder = "Search...",
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
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          className={clsx(
            'relative w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white text-sm',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={clsx(
              'block truncate',
              !displayValue && 'text-gray-500'
            )}>
              {displayValue || placeholder}
            </span>
            <div className="flex items-center space-x-2">
              {displayValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
              <ChevronDown className={clsx(
                'w-4 h-4 text-gray-400 transition-transform',
                isOpen && 'transform rotate-180'
              )} />
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={clsx(
                      'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100',
                      option.value === value && 'bg-blue-50 text-blue-600'
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
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
