import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  locked?: boolean
}

export function Modal({ isOpen, onClose, title, children, size = 'md', locked = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'

    // Move focus into modal on open
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    // Close on Escape (unless locked)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose()

      // Focus trap: keep Tab inside the modal
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, locked, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/40 transition-opacity"
          onClick={locked ? undefined : onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          className={clsx(
            'relative bg-white rounded-lg shadow-lg max-w-full w-full',
            {
              'max-w-md': size === 'sm',
              'max-w-lg': size === 'md',
              'max-w-2xl': size === 'lg',
              'max-w-4xl': size === 'xl',
            }
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 id="modal-title" className="text-base font-semibold text-slate-800">{title}</h3>
            {!locked && (
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
