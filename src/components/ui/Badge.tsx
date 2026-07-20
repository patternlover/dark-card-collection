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
        'inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        {
          'border-zinc-600 bg-zinc-800 text-zinc-300': variant === 'default',
          'border-blue-700 bg-blue-950 text-blue-300': variant === 'new',
          'border-amber-600 bg-amber-950 text-amber-300': variant === 'bestseller',
          'border-purple-700 bg-purple-950 text-purple-300': variant === 'preorder',
          'border-red-700 bg-red-950 text-red-300': variant === 'sold-out',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
