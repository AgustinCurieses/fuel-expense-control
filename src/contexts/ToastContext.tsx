'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useToast, Toast, ToastComponent } from '@/components/ui/Toast'

interface ToastContextType {
  toasts: Toast[]
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
  info: (title: string, message?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, success, error, warning, info, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ toasts, success, error, warning, info }}>
      {children}
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
