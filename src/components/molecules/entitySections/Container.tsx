import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button, Input, Label } from '@/components/atoms'
import { Container } from '@/types'
import { NotAssignedSection } from './NotAssigned'

interface ContainerSectionProps {
  container: Container
}

export function ContainerSection({ container }: ContainerSectionProps) {
  if (!container?.name) {
    return (
      <NotAssignedSection title="Container" message="No Item assigned to this Container yet. " />
    )
  }

  return (
    <section
      className="bg-background border rounded-xl p-4"
      aria-labelledby="container-section-title"
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="container-section-title" className="text-lg font-medium">
            Container Details
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Container information">
          <div className="row-span-4 flex flex-col items-center justify-center">
            <Label className="text-center mb-1.5" htmlFor="qr-code">
              QR Code
            </Label>
            <div
              className="w-44 h-44 border rounded-lg p-3 bg-white flex items-center justify-center"
              id="qr-code"
              role="img"
              aria-label={`QR Code for container ${container.name}`}
            >
              <img
                src={container.qrCodeImage}
                alt={`QR Code for container ${container.name}`}
                className="w-full h-full"
              />
            </div>
            <span
              className="text-xs text-muted-foreground mt-2 font-mono"
              aria-label="QR Code value"
            >
              {container.qrCode}
            </span>
          </div>

          <form className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="container-name">Name</Label>
              <Input
                id="container-name"
                value={container.name}
                readOnly
                aria-label="Container name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-number">Container Number</Label>
              <Input
                id="container-number"
                value={container.number ? `#${container.number}` : ''}
                readOnly
                aria-label="Container number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-location">Location</Label>
              <Input
                id="container-location"
                value={container.location || ''}
                readOnly
                aria-label="Container location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-created">Created</Label>
              <Input
                id="container-created"
                value={new Date(container.createdAt).toLocaleDateString()}
                readOnly
                aria-label="Container creation date"
              />
            </div>
          </form>
        </div>

        <div className="flex justify-end" aria-label="Container actions">
          <Button
            variant="secondary"
            asChild
            className="gap-2"
            aria-label={`View details for container ${container.name}`}
          >
            <Link to="/containers/$containerId" params={{ containerId: container.id.toString() }}>
              View Container Details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
