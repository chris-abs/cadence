import { useDrag } from '@/Global/hooks/useDrag'
import { Link } from '@tanstack/react-router'

interface WithDragProps {
  children: React.ReactNode
  to: string
  params?: Record<string, string>
}

export function WithDrag({ children, to, params }: WithDragProps) {
  const { isDragMode, handlePointerDown, handlePointerUp, handlePointerCancel } = useDrag()

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
    >
      {isDragMode ? (
        children
      ) : (
        <Link to={to} params={params}>
          {children}
        </Link>
      )}
    </div>
  )
}
