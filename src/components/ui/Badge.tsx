import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'new' | 'bestseller' | 'preorder' | 'sold-out'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        {
          'bg-zinc-800 text-zinc-300': variant === 'default',
          'bg-blue-600 text-white': variant === 'new',
          'bg-amber-600 text-white': variant === 'bestseller',
          'bg-purple-600 text-white': variant === 'preorder',
          'bg-red-600 text-white': variant === 'sold-out',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
