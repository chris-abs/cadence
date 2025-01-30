import { Moon, Sun, Monitor } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'

export function ThemeToggle() {
  const { theme, applyTheme } = useSettingsStore()

  return (
    <Select value={theme} onValueChange={applyTheme}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Light
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
