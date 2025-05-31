import clsx from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import StatusBox from './components/ui/StatusBox' // Import the new component

type StatusType = 'productive' | 'unproductive' | 'maybe' | null

const FloatingDisplay: React.FC = () => {
  const [status, setStatus] = useState<StatusType>(null)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const draggableRef = useRef<HTMLDivElement>(null)
  const dragStartInfoRef = useRef<{ initialMouseX: number; initialMouseY: number } | null>(null)

  useEffect(() => {
    if (window.floatingApi) {
      const cleanup = window.floatingApi.onStatusUpdate((newStatus) => {
        setStatus(newStatus)
        setIsVisible(true)
      })
      return cleanup
    }
    return () => {}
  }, [])

  const handleGlobalMouseMove = useCallback((event: globalThis.MouseEvent) => {
    if (!dragStartInfoRef.current || !window.floatingApi) return
    const deltaX = event.clientX - dragStartInfoRef.current.initialMouseX
    const deltaY = event.clientY - dragStartInfoRef.current.initialMouseY
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
    if (event.button !== 0) return
    // Prevent drag if clicking on the close button itself
    if ((event.target as HTMLElement).closest('.close-button-area')) {
      return
    }
    if (draggableRef.current) {
      draggableRef.current.style.cursor = 'grabbing'
    }
    dragStartInfoRef.current = { initialMouseX: event.clientX, initialMouseY: event.clientY }
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }

  const handleClose = () => {
    console.log('Close button clicked')
    if (window.floatingApi) {
      window.floatingApi.hideFloatingWindow()
    }
  }

  if (!isVisible && status === null) {
    return null
  }

  let productiveIsHighlighted = false
  let productiveIsEnlarged = false
  let productiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'green'

  let unproductiveIsHighlighted = false
  let unproductiveIsEnlarged = false
  let unproductiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'red'
  let unproductiveLabel = 'Unproductive'

  if (status === 'productive') {
    productiveIsHighlighted = true
    productiveIsEnlarged = true
  } else if (status === 'unproductive') {
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
  } else if (status === 'maybe') {
    unproductiveLabel = 'Uncertain' // Show "Uncertain" in the unproductive slot
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
    unproductiveHighlightColor = 'orange'
  }

  return (
    <div
      ref={draggableRef}
      className={clsx(
        'w-full h-full flex items-center p-1.5 rounded-xl shadow-2xl select-none',
        'bg-gray-800 backdrop-blur-xl border border-white/10' // Glassmorphic effect
      )}
      onMouseDown={handleMouseDownOnDraggable}
      title="Drag to move"
      style={{ cursor: 'grab' }}
    >
      <button
        onClick={handleClose}
        className="close-button-area p-2 mr-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors pointer-events-auto h-full flex items-center justify-center"
        title="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4 text-gray-300"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-grow flex items-stretch gap-1.5 h-full">
        <StatusBox
          label="Productive"
          time="00:00:00"
          isHighlighted={productiveIsHighlighted}
          highlightColor={productiveHighlightColor}
          isEnlarged={productiveIsEnlarged}
        />
        <StatusBox
          label={unproductiveLabel}
          time="00:00:00"
          isHighlighted={unproductiveIsHighlighted}
          highlightColor={unproductiveHighlightColor}
          isEnlarged={unproductiveIsEnlarged}
        />
      </div>
    </div>
  )
}

export default FloatingDisplay
