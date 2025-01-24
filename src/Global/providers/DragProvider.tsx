import React, { useCallback, useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'

import { useDrag } from '../hooks/useDrag'
import { DragContext } from '../contexts/DragContext'

interface DragProviderProps {
  children: React.ReactNode
  holdThreshold?: number
}

export function DragProvider({ children, holdThreshold = 200 }: DragProviderProps) {
  const [isDragMode, setIsDragMode] = useState(false)
  const timeoutRef = useRef<number>()
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY }

      timeoutRef.current = window.setTimeout(() => {
        setIsDragMode(true)
      }, holdThreshold)
    },
    [holdThreshold],
  )

  const handlePointerUp = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    setIsDragMode(false)
  }, [])

  const handlePointerCancel = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    setIsDragMode(false)
  }, [])

  return (
    <DragContext.Provider
      value={{
        isDragMode,
        handlePointerDown,
        handlePointerUp,
        handlePointerCancel,
      }}
    >
      {children}
    </DragContext.Provider>
  )
}

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
