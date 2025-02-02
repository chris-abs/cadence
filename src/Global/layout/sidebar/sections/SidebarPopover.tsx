import { type LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'
import { Popover, PopoverContent, PopoverTrigger } from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules'

interface SidebarPopoverProps {
  title: string
  icon?: LucideIcon
  items: {
    title: string
    url: string
  }[]
}

export function SidebarPopover({ title, icon: Icon, items }: SidebarPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={title}
            className={isOpen ? 'peer-[.sidebar-tooltip]:hidden' : ''}
          >
            {Icon && <Icon />}
            <span>{title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-56 p-0" align="start" sideOffset={12}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b p-2">
            <Muted>{title}</Muted>
          </div>

          <div className="p-2">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className="flex h-8 w-full items-center rounded-md px-2 text-sm transition-colors hover:bg-accent hover:text-contrast-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
