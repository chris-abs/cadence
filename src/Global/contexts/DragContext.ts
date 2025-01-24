import { createContext } from 'react'

interface DragContextType {
  isDragMode: boolean
  handlePointerDown: (e: React.PointerEvent) => void
  handlePointerUp: () => void
  handlePointerCancel: () => void
}

export const DragContext = createContext<DragContextType | null>(null)
