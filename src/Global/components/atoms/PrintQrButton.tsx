import { Printer } from 'lucide-react'
import { Button } from '@/Global/components/atoms'
import { usePrintQR } from '@/Global/hooks/usePrintQr'

interface PrintQRButtonProps {
  qrImage: string
  qrCode: string
  variant?: 'default' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
}

export function PrintQRButton({
  qrImage,
  qrCode,
  variant = 'secondary',
  size = 'sm',
}: PrintQRButtonProps) {
  const { printQRCode } = usePrintQR()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => printQRCode(qrImage, qrCode)}
      aria-label="Print QR Code"
    >
      <Printer className="h-4 w-4" />
    </Button>
  )
}
