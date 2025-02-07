import { useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/Global/components/atoms'
import { useContainerQRSearch } from '@/Global/queries/search'

type QRCodeResult = {
  getText(): string
}

export function QrSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const { refetch: searchContainer } = useContainerQRSearch('', {
    enabled: false,
  })

  const handleScan = async (result: QRCodeResult | null | undefined) => {
    if (!result) return

    const qrCode = result.getText()

    if (!qrCode.startsWith('STORAGE-CONTAINER-')) {
      toast.error('Invalid QR code', {
        description: 'Please scan a valid container QR code',
      })
      return
    }

    try {
      const { data } = await searchContainer()
      if (data) {
        setIsOpen(false)
        navigate({
          to: '/containers/$containerId',
          params: { containerId: data.id.toString() },
        })
      }
    } catch {
      toast.error('Failed to find container', {
        description: 'The scanned QR code did not match any containers',
      })
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsOpen(true)}>
              <Camera className="h-5 w-5" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Scan container QR code</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Scan Container QR Code</DialogTitle>
          <DialogHeader />
          <div className="aspect-square overflow-hidden rounded-md bg-white">
            {isOpen && (
              <QrReader
                onResult={handleScan}
                constraints={{
                  facingMode: 'environment',
                  aspectRatio: 1,
                  frameRate: { ideal: 60, min: 30 },
                }}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
