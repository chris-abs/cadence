import { cn } from '@/Global/lib'

interface SectionProps {
  className?: string
  children: React.ReactNode
  noPadding?: boolean
}

export const Section: React.FC<SectionProps> = ({ className, children, noPadding = false }) => (
  <section className={cn('container mx-auto', !noPadding && 'px-4', className)}>{children}</section>
)
