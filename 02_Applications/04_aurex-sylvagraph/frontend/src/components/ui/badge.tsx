import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-forest-500 text-white hover:bg-forest-600 dark:bg-forest-400 dark:text-forest-900',
        secondary:
          'border-transparent bg-mint-100 text-mint-900 hover:bg-mint-200 dark:bg-mint-800 dark:text-mint-100',
        destructive:
          'border-transparent bg-red-500 text-white hover:bg-red-600',
        outline: 'text-ink-700 dark:text-ink-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }