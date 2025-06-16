import clsx from 'clsx'
import { AppWindowMac, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Category } from 'shared'
import { Button } from './components/ui/button'
import StatusBox from './components/ui/StatusBox'

type LatestStatusType = 'productive' | 'unproductive' | 'maybe' | null

interface FloatingStatusUpdate {
  latestStatus: LatestStatusType
  dailyProductiveMs: number
  dailyUnproductiveMs: number
  categoryName?: string
  categoryDetails?: Category
  activityIdentifier?: string
  itemType?: 'app' | 'website'
  activityName?: string
  activityUrl?: string
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
  const [currentCategoryDetails, setCurrentCategoryDetails] = useState<Category | undefined>(
    undefined
  )
  const [activityInfo, setActivityInfo] = useState<{
    identifier?: string
    itemType?: 'app' | 'website'
    name?: string
    url?: string
  }>({})

  const draggableRef = useRef<HTMLDivElement>(null)
  const dragStartInfoRef = useRef<{ initialMouseX: number; initialMouseY: number } | null>(null)

  useEffect(() => {
    if (window.floatingApi) {
      const cleanup = window.floatingApi.onStatusUpdate((data: FloatingStatusUpdate) => {
        setLatestStatus(data.latestStatus)
        setDisplayedProductiveTimeMs(data.dailyProductiveMs)
        setDailyUnproductiveMs(data.dailyUnproductiveMs)
        setCurrentCategoryDetails(data.categoryDetails)
        setActivityInfo({
          identifier: data.activityIdentifier,
          itemType: data.itemType,
          name: data.activityName,
          url: data.activityUrl
        })
        setIsVisible(true)
      })
      return cleanup
    }
    return () => {}
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined

    if (latestStatus === 'productive') {
      intervalId = setInterval(() => {
        setDisplayedProductiveTimeMs((prevMs) => prevMs + 1000)
      }, 1000)
    } else if (latestStatus === 'unproductive' || latestStatus === 'maybe') {
      intervalId = setInterval(() => {
        setDailyUnproductiveMs((prevMs) => prevMs + 1000)
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
    if (
      (event.target as HTMLElement).closest('.close-button-area') ||
      (event.target as HTMLElement).closest('.category-name-area')
    ) {
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

  const handleCategoryNameClick = () => {
    if (window.floatingApi && window.floatingApi.requestRecategorizeView) {
      if (!currentCategoryDetails) {
        console.warn('[FloatingDisplay] No category details to send for recategorization.')
        return
      }
      window.floatingApi.requestRecategorizeView(currentCategoryDetails)
    } else {
      console.warn('[FloatingDisplay] floatingApi.requestRecategorizeView is not available.')
    }
  }

  const handleOpenMainAppWindow = () => {
    if (window.floatingApi && window.floatingApi.openMainAppWindow) {
      window.floatingApi.openMainAppWindow()
    } else {
      console.warn('[FloatingDisplay] floatingApi.openMainAppWindow is not available.')
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
  let unproductiveLabel = 'Distracted'

  const productiveTimeFormatted = formatMsToTime(displayedProductiveTimeMs)
  const unproductiveTimeFormatted = formatMsToTime(dailyUnproductiveMs)

  let productiveBoxCategoryDetails: Category | undefined = undefined
  let unproductiveBoxCategoryDetails: Category | undefined = undefined

  if (latestStatus === 'productive') {
    productiveIsHighlighted = true
    productiveIsEnlarged = true
    productiveBoxCategoryDetails = currentCategoryDetails
  } else if (latestStatus === 'unproductive') {
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
    unproductiveBoxCategoryDetails = currentCategoryDetails
  } else if (latestStatus === 'maybe') {
    unproductiveLabel = 'Uncertain'
    unproductiveIsHighlighted = true
    unproductiveIsEnlarged = true
    unproductiveHighlightColor = 'orange'
    unproductiveBoxCategoryDetails = currentCategoryDetails
  }

  return (
    <div
      ref={draggableRef}
      className={clsx(
        'w-full h-full flex items-center p-0.5 px-1 rounded-xl select-none',
        'border-2 border-secondary/50'
      )}
      onMouseDown={handleMouseDownOnDraggable}
      title="Drag to move"
      style={{ cursor: 'grab' }}
    >
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="close-button-area p-1 w-6 h-6 mr-1 rounded-lg"
          title="Close Mini Timer"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
        {/* button to open the main app window */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenMainAppWindow}
          className="open-main-app-window-butto p-1 w-6 h-6 mr-1 rounded-lg"
          title="Open Main App Window"
        >
          <AppWindowMac className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-grow flex items-stretch gap-1.5 h-full">
        <StatusBox
          label="Productive"
          time={productiveTimeFormatted}
          isHighlighted={productiveIsHighlighted}
          highlightColor={productiveHighlightColor}
          isEnlarged={productiveIsEnlarged}
          categoryDetails={productiveBoxCategoryDetails}
          onCategoryClick={handleCategoryNameClick}
        />
        <StatusBox
          label={unproductiveLabel}
          time={unproductiveTimeFormatted}
          isHighlighted={unproductiveIsHighlighted}
          highlightColor={unproductiveHighlightColor}
          isEnlarged={unproductiveIsEnlarged}
          categoryDetails={unproductiveBoxCategoryDetails}
          onCategoryClick={handleCategoryNameClick}
        />
      </div>
    </div>
  )
}

export default FloatingDisplay
