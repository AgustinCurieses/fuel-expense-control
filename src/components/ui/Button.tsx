import { clsx } from 'clsx'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-navy-600 text-white hover:bg-navy-700 focus:ring-navy-600': variant === 'primary',
            'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500': variant === 'secondary',
            'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-navy-600': variant === 'outline',
            'text-slate-600 hover:bg-slate-100 focus:ring-slate-400': variant === 'ghost',
            'bg-red-700 text-white hover:bg-red-800 focus:ring-red-700': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-2.5 text-sm': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
