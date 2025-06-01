import { Button } from '@renderer/components/ui/button'
import clsx from 'clsx'
import { X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import StatusBox from './components/ui/StatusBox'

type LatestStatusType = 'productive' | 'unproductive' | 'maybe' | null

interface FloatingStatusUpdate {
  latestStatus: LatestStatusType
  dailyProductiveMs: number
  dailyUnproductiveMs: number
}

// Helper to format milliseconds to HH:MM:SS
const formatMsToTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const FloatingDisplay: React.FC = () => {
  const [latestStatus, setLatestStatus] = useState<LatestStatusType>(null)
  const [displayedProductiveTimeMs, setDisplayedProductiveTimeMs] = useState<number>(0)
  const [dailyUnproductiveMs, setDailyUnproductiveMs] = useState<number>(0)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const draggableRef = useRef<HTMLDivElement>(null)
  const dragStartInfoRef = useRef<{ initialMouseX: number; initialMouseY: number } | null>(null)

  useEffect(() => {
    if (window.floatingApi) {
      const cleanup = window.floatingApi.onStatusUpdate((data: FloatingStatusUpdate) => {
        setLatestStatus(data.latestStatus)
        setDisplayedProductiveTimeMs(data.dailyProductiveMs)
        setDailyUnproductiveMs(data.dailyUnproductiveMs)
        setIsVisible(true)
      })
      return cleanup
    }
    return () => {}
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined
    if (latestStatus === 'productive') {
      intervalId = setInterval(() => {
        setDisplayedProductiveTimeMs((prevMs) => prevMs + 1000)
      }, 1000)
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [latestStatus])

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
    if (window.floatingApi) {
      window.floatingApi.hideFloatingWindow()
    }
  }

  if (!isVisible && latestStatus === null) {
    return null
  }

  let productiveIsHighlighted = false
  let productiveIsEnlarged = false
  let productiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'green'

  let unproductiveIsHighlighted = false
  let unproductiveIsEnlarged = false
  let unproductiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'red'
  let unproductiveLabel = 'Distracted' // Default label for the second box

  const productiveTimeFormatted = formatMsToTime(displayedProductiveTimeMs)
  const unproductiveTimeFormatted = formatMsToTime(dailyUnproductiveMs)

  if (latestStatus === 'productive') {
    productiveIsHighlighted = true
    productiveIsEnlarged = true
  } else if (latestStatus === 'unproductive') {
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
  } else if (latestStatus === 'maybe') {
    // For 'maybe' status, highlight the second box with orange and a neutral label
    unproductiveLabel = 'Uncertain'
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
    unproductiveHighlightColor = 'orange'
  }

  return (
    <div
      ref={draggableRef}
      className={clsx(
        'w-full h-full flex items-center p-1.5 rounded-xl shadow-2xl select-none',
        'bg-card/80 backdrop-blur-xl border border-border' // Updated to use theme colors
      )}
      onMouseDown={handleMouseDownOnDraggable}
      title="Drag to move"
      style={{ cursor: 'grab' }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="close-button-area p-1 rounded-lg m-auto"
        title="Close"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </Button>

      <div className="flex-grow flex items-stretch gap-1.5 h-full">
        <StatusBox
          label="Productive"
          time={productiveTimeFormatted}
          isHighlighted={productiveIsHighlighted}
          highlightColor={productiveHighlightColor}
          isEnlarged={productiveIsEnlarged}
        />
        <StatusBox
          label={unproductiveLabel}
          time={unproductiveTimeFormatted}
          isHighlighted={unproductiveIsHighlighted}
          highlightColor={unproductiveHighlightColor}
          isEnlarged={unproductiveIsEnlarged}
        />
      </div>
    </div>
  )
}

export default FloatingDisplay
