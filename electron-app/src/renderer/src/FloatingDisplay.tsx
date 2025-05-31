import clsx from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type StatusType = 'productive' | 'unproductive' | 'maybe' | null

const FloatingDisplay: React.FC = () => {
  const [status, setStatus] = useState<StatusType>(null)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  // Ref for the draggable element itself to change cursor style
  const draggableRef = useRef<HTMLDivElement>(null)
  // Ref to store initial mouse position and know if dragging is active
  const dragStartInfoRef = useRef<{ initialMouseX: number; initialMouseY: number } | null>(null)

  useEffect(() => {
    if (window.floatingApi) {
      const cleanup = window.floatingApi.onStatusUpdate((newStatus) => {
        console.log('Floating window received status:', newStatus)
        setStatus(newStatus)
        setIsVisible(true)
      })
      return cleanup
    }
    return () => {}
  }, [])

  const handleGlobalMouseMove = useCallback((event: globalThis.MouseEvent) => {
    if (!dragStartInfoRef.current || !window.floatingApi) {
      return
    }
    // Calculate delta from the initial mouse down position
    const deltaX = event.clientX - dragStartInfoRef.current.initialMouseX
    const deltaY = event.clientY - dragStartInfoRef.current.initialMouseY

    // Send IPC message to main process to move the window
    window.floatingApi.moveWindow(deltaX, deltaY)
  }, [])

  const handleGlobalMouseUp = useCallback(() => {
    if (draggableRef.current) {
      draggableRef.current.style.cursor = 'grab'
    }
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
    dragStartInfoRef.current = null
  }, [handleGlobalMouseMove])

  const handleMouseDownOnDraggable = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging with the primary mouse button
    if (event.button !== 0) return

    if (draggableRef.current) {
      draggableRef.current.style.cursor = 'grabbing'
    }
    // Store the initial mouse position when drag starts
    dragStartInfoRef.current = { initialMouseX: event.clientX, initialMouseY: event.clientY }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }

  if (!isVisible) {
    return null
  }

  let displayText = ''
  let textColor = 'text-gray-100'
  let bgColor = 'bg-gray-700'

  switch (status) {
    case 'productive':
      displayText = 'Productive'
      textColor = 'text-green-400'
      bgColor = 'bg-gray-800'
      break
    case 'unproductive':
      displayText = 'Unproductive'
      textColor = 'text-red-400'
      bgColor = 'bg-gray-800'
      break
    case 'maybe':
      displayText = 'Maybe'
      textColor = 'text-yellow-400'
      bgColor = 'bg-gray-800'
      break
    default:
      displayText = 'Waiting...'
      bgColor = 'bg-gray-800'
      break
  }

  return (
    <div
      ref={draggableRef}
      className={clsx(
        'w-full h-full flex items-center justify-center p-2 rounded-md shadow-lg select-none',
        'border-2 border-transparent',
        status === 'productive' && 'border-green-500',
        status === 'unproductive' && 'border-red-500',
        status === 'maybe' && 'border-yellow-500',
        bgColor
      )}
      onMouseDown={handleMouseDownOnDraggable}
      title="Drag to move"
      style={{ cursor: 'grab' }} // Initial cursor style
    >
      <span className={clsx('text-lg font-semibold pointer-events-none', textColor)}>
        {displayText}
      </span>
    </div>
  )
}

export default FloatingDisplay
