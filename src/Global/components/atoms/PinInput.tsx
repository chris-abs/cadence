import { useRef, KeyboardEvent, ChangeEvent } from 'react'

import { Input } from '@/Global/components/atoms'

interface PinInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  description?: string | JSX.Element
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  error?: boolean
}

export function PinInput({
  length = 6,
  value,
  onChange,
  description,
  disabled = false,
  autoFocus = false,
  className = '',
  error = false,
}: PinInputProps) {
  const pins = value.split('').concat(Array(length - value.length).fill(''))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const formatPin = (input: string): string => {
    return input.replace(/\D/g, '')
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newValue = formatPin(e.target.value)

    const digit = newValue.slice(-1)

    if (digit) {
      const newPins = [...pins]
      newPins[index] = digit
      onChange(newPins.join(''))

      if (index < length - 1) {
        inputsRef.current[index + 1]?.focus()
        inputsRef.current[index + 1]?.select()
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()

      const newPins = [...pins]

      if (newPins[index]) {
        newPins[index] = ''
        onChange(newPins.join(''))
      } else if (index > 0) {
        newPins[index - 1] = ''
        onChange(newPins.join(''))
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = formatPin(e.clipboardData.getData('text')).slice(0, length)

    if (pastedData) {
      onChange(pastedData.padEnd(length, '').slice(0, length))

      const focusIndex = Math.min(pastedData.length, length - 1)
      inputsRef.current[focusIndex]?.focus()
    }
  }

  const handleClick = (index: number) => {
    inputsRef.current[index]?.select()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            className={`w-10 h-10 text-center text-lg p-0 ${error ? 'border-destructive' : ''}`}
            value={pins[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onClick={() => handleClick(index)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
    </div>
  )
}
