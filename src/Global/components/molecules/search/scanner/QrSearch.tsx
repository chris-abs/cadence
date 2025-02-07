import { BrowserMultiFormatReader } from '@zxing/library'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/Global/components/atoms'
import { useContainerQRSearch } from '@/Global/queries/search'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'

export function QrSearch() {
  const navigate = useNavigate()
  const { cameraPermission, requestCameraPermission, checkCameraSupport } = useSettingsStore()

  const { refetch: searchContainer } = useContainerQRSearch('', {
    enabled: false,
  })

  const handleScan = async () => {
    const isSupported = await checkCameraSupport()
    if (!isSupported) {
      toast.error('Camera not supported', {
        description: 'Your device does not support camera access',
      })
      return
    }

    try {
      const permissionGranted = await requestCameraPermission()
      if (!permissionGranted) {
        toast.error('Camera access required', {
          description: 'Please allow camera access in your browser settings',
          action: {
            label: 'Open Settings',
            onClick: () => {
              window.open('chrome://settings/content/camera', '_blank')
            },
          },
        })
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeOnceFromVideoDevice(undefined, video)

      if (result?.getText().startsWith('STORAGE-CONTAINER-')) {
        const { data } = await searchContainer()
        if (data) {
          navigate({
            to: '/containers/$containerId',
            params: { containerId: data.id.toString() },
          })
        }
      }

      stream.getTracks().forEach((track) => track.stop())
      reader.reset()
    } catch {
      toast.error('Scanning failed', {
        description: 'Please try again or check your camera settings',
      })
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={handleScan}>
              <Camera className="h-5 w-5" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {cameraPermission === 'denied'
            ? 'Camera access required for scanning'
            : 'Scan container QR code'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
