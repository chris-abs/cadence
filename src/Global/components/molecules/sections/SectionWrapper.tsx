import { cn } from '@/Global/lib'

interface SectionProps {
  className?: string
  children: React.ReactNode
  noPadding?: boolean
}

export const Section: React.FC<SectionProps> = ({ className, children, noPadding = false }) => (
  <section
    className={cn(
      'bg-background border rounded-xl shadow-md',
      !noPadding && 'xs:p-2 sm:p-4 md:p-6',
      className,
    )}
  >
    {children}
  </section>
)
