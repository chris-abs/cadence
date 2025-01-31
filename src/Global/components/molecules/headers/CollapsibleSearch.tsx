import { useRef, useState, useEffect } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { Button, Input } from '../../atoms'
import { useDebounce } from '@/Global/hooks/useDebounce'

interface CollapsibleSearchProps {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
  isLoading?: boolean
}

export const CollapsibleSearch = ({
  value,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 400,
  isLoading = false,
}: CollapsibleSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedInputValue = useDebounce(inputValue, debounceMs)

  useEffect(() => {
    onSearch(debouncedInputValue)
  }, [debouncedInputValue, onSearch])

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(inputValue)
    }
  }

  const handleClear = () => {
    setInputValue('')
    onSearch('')
  }

  if (!isExpanded) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExpand}>
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative w-64 md:w-80 lg:w-96 transition-all duration-200 ease-in-out">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="h-9 pl-4 pr-16"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-12 top-0 h-9 px-2 hover:text-foreground text-muted-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSearch(inputValue)}
        className="absolute right-0 top-0 h-9 w-9"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
      </Button>
    </div>
  )
}
