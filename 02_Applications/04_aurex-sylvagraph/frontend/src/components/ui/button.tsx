import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-forest-600 text-white hover:bg-forest-700 dark:bg-forest-500 dark:hover:bg-forest-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-forest-200 bg-white hover:bg-forest-50 hover:text-forest-900 dark:border-forest-800 dark:bg-forest-950 dark:hover:bg-forest-900',
        secondary: 'bg-mint-100 text-mint-900 hover:bg-mint-200 dark:bg-mint-900 dark:text-mint-100 dark:hover:bg-mint-800',
        ghost: 'hover:bg-forest-100 hover:text-forest-900 dark:hover:bg-forest-800 dark:hover:text-forest-100',
        link: 'text-forest-600 underline-offset-4 hover:underline dark:text-forest-400',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }