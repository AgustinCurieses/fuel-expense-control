import { clsx } from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'navy'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-navy-50 text-navy-600 border-navy-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  navy:    'bg-navy-600 text-white border-navy-600',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
