import * as React from 'react'

import { cn } from '@/Global/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readOnly?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, readOnly, ...props }, ref) => {
    const inputClassName = cn(
      'flex h-10 w-full rounded-md border px-3 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      readOnly
        ? 'border-transparent bg-contrast-accent text-foreground cursor-default items-center justify-start'
        : 'border-input bg-transparent text-foreground focus-visible:ring-ring',
      className,
    )

    if (readOnly) {
      return (
        <div className={cn(inputClassName, 'flex items-center')}>
          {props.value || <span className="opacity-50">Not specified</span>}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(inputClassName, 'py-1')}
        ref={ref}
        readOnly={readOnly}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
