import { cn } from '@/Global/lib'

interface SectionProps {
  className?: string
  children: React.ReactNode
  noPadding?: boolean
}

export const Section: React.FC<SectionProps> = ({ className, children, noPadding = false }) => (
  <section
    className={cn('bg-background border rounded-xl', !noPadding && 'px-4 py-2 md:px-6', className)}
  >
    {children}
  </section>
)
