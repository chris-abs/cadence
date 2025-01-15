interface NotAssignedSectionProps {
  title: string
  message: string
}

export function NotAssignedSection({ title, message }: NotAssignedSectionProps) {
  const headingId = `${title.toLowerCase()}-section-heading`

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby={headingId}>
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <h2 id={headingId} className="text-lg font-medium">
            {title}
          </h2>
        </header>
        <div
          className="flex h-32 items-center justify-center rounded-md border border-dashed"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </section>
  )
}
