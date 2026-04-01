import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'
import { clsx } from 'clsx'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    const duration = toast.duration || 5000
    const closeTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(toast.id), 300)
    }, duration)
    return () => { clearTimeout(timer); clearTimeout(closeTimer) }
  }, [toast.id, toast.duration, onClose])

  const config = {
    success: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, bar: 'bg-green-600' },
    error:   { icon: <AlertCircle className="w-4 h-4 text-red-700" />,   bar: 'bg-red-700' },
    warning: { icon: <AlertCircle className="w-4 h-4 text-amber-600" />, bar: 'bg-amber-500' },
    info:    { icon: <Info className="w-4 h-4 text-navy-600" />,          bar: 'bg-navy-600' },
  }

  return (
    <div className={clsx(
      'fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden transition-all duration-300 transform',
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    )}>
      <div className={`h-0.5 ${config[toast.type].bar}`} />
      <div className="flex items-start p-4 gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config[toast.type].icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-xs text-slate-500">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => { setIsVisible(false); setTimeout(() => onClose(toast.id), 300) }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'success', title, message, duration })

  const error = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'error', title, message, duration })

  const warning = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'warning', title, message, duration })

  const info = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'info', title, message, duration })

  return { toasts, addToast, removeToast, success, error, warning, info }
}
