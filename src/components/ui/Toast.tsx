import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
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
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10)

    // Auto close
    const duration = toast.duration || 5000
    const closeTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(toast.id), 300)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [toast.id, toast.duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 transform',
        bgColors[toast.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icons[toast.type]}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{toast.title}</h3>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(toast.id), 300)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])
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

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
