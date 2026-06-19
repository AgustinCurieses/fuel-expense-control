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
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Focus the search box when opening; reset active option
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(-1)
      const t = setTimeout(() => searchRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleSelect = (option: { value: string; label: string }) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
    triggerRef.current?.focus()
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filteredOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div className="space-y-1" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={label || placeholder}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          className={clsx(
            'relative w-full px-3 py-2 border rounded-md cursor-pointer bg-white text-sm text-left',
            'focus:outline-none focus:ring-2 focus:ring-navy-600',
            isOpen ? 'border-navy-600 ring-2 ring-navy-600' : 'border-slate-300',
            error && 'border-red-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={clsx('block truncate', !displayValue && 'text-slate-400')}>
              {displayValue || placeholder}
            </span>
            <div className="flex items-center gap-1.5">
              {displayValue && (
                <span
                  role="button"
                  aria-label="Limpiar selección"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); handleClear() }}
                  className="p-0.5 hover:bg-slate-100 rounded"
                >
                  <X className="w-3 h-3 text-slate-400" aria-hidden="true" />
                </span>
              )}
              <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchRef}
                type="text"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveIndex(-1) }}
                onKeyDown={handleSearchKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <ul className="max-h-56 overflow-y-auto" role="listbox">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-slate-400">
                  Sin resultados
                </li>
              ) : (
                filteredOptions.map((option, idx) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    className={clsx(
                      'px-3 py-2 text-sm cursor-pointer transition-colors',
                      idx === activeIndex && 'bg-slate-100',
                      option.value === value
                        ? 'bg-navy-50 text-navy-600 font-medium'
                        : 'hover:bg-slate-50 text-slate-800'
                    )}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
