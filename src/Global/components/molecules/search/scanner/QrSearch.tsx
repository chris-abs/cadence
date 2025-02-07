import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/Global/components/atoms'
import { useContainerQRSearch } from '@/Global/queries/search'

export function QrSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()

  const { refetch: searchContainer } = useContainerQRSearch('', {
    enabled: false,
  })

  useEffect(() => {
    if (isOpen && videoRef.current && !stream) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        .then((mediaStream) => {
          setStream(mediaStream)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
          }
        })
        .catch((error) => {
          toast.error('Camera access required', {
            description: error instanceof Error ? error.message : 'Please enable camera access',
          })
          setIsOpen(false)
        })
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }, [isOpen, stream])

  useEffect(() => {
    if (isOpen && videoRef.current && stream) {
      const reader = new BrowserMultiFormatReader()

      const scanInterval = setInterval(async () => {
        try {
          if (videoRef.current) {
            const result = await reader.decodeOnce(videoRef.current)
            const qrCode = result?.getText()

            if (qrCode?.startsWith('STORAGE-CONTAINER-')) {
              const { data } = await searchContainer()
              if (data) {
                clearInterval(scanInterval)
                setIsOpen(false)
                navigate({
                  to: '/containers/$containerId',
                  params: { containerId: data.id.toString() },
                })
              }
            }
          }
        } catch {
          // Ignore errors during scanning attempts
        }
      }, 500)

      return () => {
        clearInterval(scanInterval)
        reader.reset()
      }
    }
  }, [isOpen, stream, navigate, searchContainer])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setIsOpen(true)}
              aria-label="Scan QR code"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Scan container QR code</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" aria-labelledby="qr-scan-title">
          <DialogHeader>
            <DialogTitle id="qr-scan-title">Scan Container QR Code</DialogTitle>
          </DialogHeader>
          <div
            className="aspect-square overflow-hidden rounded-md bg-black"
            role="application"
            aria-label="QR code scanner view"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              aria-hidden="true" // Video feed doesn't need to be announced by screen readers
            />
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
