import { Printer } from 'lucide-react'
import { Button, Tooltip, TooltipTrigger } from '@/Global/components/atoms'
import { usePrintQR } from '@/Global/hooks/usePrintQr'
import { TooltipContent } from '@radix-ui/react-tooltip'
import { Small } from '../molecules'

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
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant={variant}
          size={size}
          onClick={() => printQRCode(qrImage, qrCode)}
          aria-label="Print QR Code"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Small>Print QR Code</Small>
      </TooltipContent>
    </Tooltip>
  )
}
