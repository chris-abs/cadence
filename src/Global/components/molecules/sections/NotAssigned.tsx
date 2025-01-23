import { Button } from '@/Global/components/atoms'
import { Section } from './SectionWrapper'
import { H3 } from '../Typography'

interface NotAssignedSectionProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function NotAssignedSection({
  title,
  message,
  actionLabel,
  onAction,
}: NotAssignedSectionProps) {
  const headingId = `${title.toLowerCase()}-section-heading`

  return (
    <Section>
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <H3 id={headingId}>{title}</H3>
        </header>
        <div
          className="flex flex-col h-32 items-center justify-center rounded-md border border-dashed"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          {actionLabel && onAction && (
            <Button onClick={onAction} size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Section>
  )
}
