import { Search } from 'lucide-react'
import { Button, Input } from '@/Global/components/atoms'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showResults?: boolean
  className?: string
  children?: React.ReactNode
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  showResults = true,
  className,
  children,
}: SearchInputProps) {
  return (
    <div className={className}>
      <div className="relative cursor-text">
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 pl-4 pr-16 radius-xl [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-14 top-0 h-12 px-2 hover:text-foreground text-muted-foreground"
          >
            ✕
          </button>
        )}
        <Button
          variant="default"
          size="icon"
          className="absolute right-0 top-0 radius-xl rounded-l-none h-12 w-12"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {showResults && value.trim() && children}
    </div>
  )
}
