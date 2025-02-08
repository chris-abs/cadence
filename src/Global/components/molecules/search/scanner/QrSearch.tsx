import { useEffect, useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { useNavigate } from '@tanstack/react-router'
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
  const [scannedCode, setScannedCode] = useState('')
  const navigate = useNavigate()

  const { data: container } = useContainerQRSearch(scannedCode, {
    enabled: !!scannedCode,
  })

  useEffect(() => {
    if (container) {
      stopMediaTracks()
      setIsOpen(false)
      navigate({
        to: '/containers/$containerId',
        params: { containerId: container.id.toString() },
      })
    }
  }, [container, navigate])

  const stopMediaTracks = () => {
    const tracks = document.querySelector('video')?.srcObject as MediaStream
    tracks?.getTracks().forEach((track) => track.stop())
  }

  const handleScan = async (result: QRCodeResult | null | undefined) => {
    if (!result) return
    setScannedCode(result.getText())
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

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            stopMediaTracks()
            setScannedCode('')
          }
          setIsOpen(open)
        }}
      >
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
