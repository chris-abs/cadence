import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Button, Input } from '../../atoms'

interface CollapsibleSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const CollapsibleSearch = ({
  value,
  onChange,
  placeholder = 'Search...',
}: CollapsibleSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    onChange('')
  }

  if (!isExpanded) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExpand}>
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative w-45 xs:w-55 md:w-80 lg:w-96 transition-all duration-200 ease-in-out">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-4 pr-16"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-12 top-0 h-9 hover:text-foreground text-muted-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className="absolute right-0 top-0 h-9 w-9"
      >
        <Search className="h-3 w-3" />
      </Button>
    </div>
  )
}
