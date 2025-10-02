import clsx from 'clsx'
import { AppWindowMac, Pause, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Category } from 'shared'
import { Button } from './components/ui/button'
import StatusBox from './components/ui/StatusBox'

type LatestStatusType = 'productive' | 'unproductive' | 'maybe' | null

interface FloatingStatusUpdate {
  latestStatus: LatestStatusType
  dailyProductiveMs: number
  dailyUnproductiveMs: number
  categoryDetails?: Category
  activityIdentifier?: string
  itemType?: 'app' | 'website'
  activityName?: string
  activityUrl?: string
  categoryReasoning?: string
  isTrackingPaused?: boolean
  totalDurationMs?: number
  topCategories?: Array<{id: string, name: string, color: string, durationMs: number}>

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
  const [isTrackingPaused, setIsTrackingPaused] = useState<boolean>(false)
  const [currentCategoryDetails, setCurrentCategoryDetails] = useState<Category | undefined>(
    undefined
  )
  const [activityInfo, setActivityInfo] = useState<{
    identifier?: string
    itemType?: 'app' | 'website'
    name?: string
    url?: string
    categoryReasoning?: string
  }>({})
  const [totalDurationMs, setTotalDurationMs] = useState<number>(0)
  const [topCategories, setTopCategories] = useState<Array<{id: string, name: string, color: string, durationMs: number}>>([])
  
  // Add log on component render
  console.log('[FloatingDisplay] Component rendered, totalDurationMs:', totalDurationMs)
  
  // Add a specific useEffect to monitor changes to totalDurationMs
  useEffect(() => {
    console.log('[FloatingDisplay] totalDurationMs changed:', totalDurationMs)
    // Log detailed info about the current state
    console.log('[FloatingDisplay] Current state context:', { 
      totalDurationMs,
      hasCategory: !!currentCategoryDetails,
      isVisible,
      categoryName: currentCategoryDetails?.name || 'No category'
    })
  }, [totalDurationMs, currentCategoryDetails, isVisible])

  const draggableRef = useRef<HTMLDivElement>(null)
  const dragStartInfoRef = useRef<{ initialMouseX: number; initialMouseY: number } | null>(null)

  useEffect(() => {
    if (window.floatingApi) {
      const cleanup = window.floatingApi.onStatusUpdate((data: FloatingStatusUpdate) => {
        console.log('[FloatingDisplay] Received status update:', data)

        // More verbose logging about totalDurationMs
        console.log('[FloatingDisplay] DEBUGGING totalDurationMs:')
        console.log('  - Raw value:', data.totalDurationMs)
        console.log('  - Type:', typeof data.totalDurationMs)
        console.log('  - Is truthy?', !!data.totalDurationMs)
        console.log('  - Is greater than zero?', (data.totalDurationMs || 0) > 0)
        console.log('  - Stringified:', JSON.stringify(data.totalDurationMs))
        
        // Check full structure of the data object
        console.log('[FloatingDisplay] Full data structure:', JSON.stringify(data))

        setLatestStatus(data.latestStatus)
        setDisplayedProductiveTimeMs(data.dailyProductiveMs)
        setDailyUnproductiveMs(data.dailyUnproductiveMs)
        setCurrentCategoryDetails(data.categoryDetails)
        setIsTrackingPaused(data.isTrackingPaused || false)
        setActivityInfo({
          identifier: data.activityIdentifier,
          itemType: data.itemType,
          name: data.activityName,
          url: data.activityUrl,
          categoryReasoning: data.categoryReasoning
        })
        setIsVisible(true)
        
        // Set totalDurationMs with more logging
        const finalTotalDurationValue = data.totalDurationMs || 0
        console.log('[FloatingDisplay] Setting totalDurationMs to:', finalTotalDurationValue)
        setTotalDurationMs(finalTotalDurationValue)
        setTopCategories(data.topCategories || [])

        console.log('[FloatingDisplay] Total Duration MS:', data.totalDurationMs)
      })
      return cleanup
    }
    return () => {}
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined

    // Only count time if tracking is not paused
    if (!isTrackingPaused) {
      // Add this condition
      if (latestStatus === 'productive') {
        intervalId = setInterval(() => {
          setDisplayedProductiveTimeMs((prevMs) => prevMs + 1000)
        }, 1000)
      } else if (latestStatus === 'unproductive' || latestStatus === 'maybe') {
        intervalId = setInterval(() => {
          setDailyUnproductiveMs((prevMs) => prevMs + 1000)
        }, 1000)
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [latestStatus, isTrackingPaused])

  // Auto-increment totalDurationMs for current category
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined

    // Only increment if:
    // 1. We have a current category
    // 2. Tracking isn't paused
    // 3. We're in a productive or unproductive status (not waiting)
    if (currentCategoryDetails && !isTrackingPaused && latestStatus) {
      intervalId = setInterval(() => {
        // Increment by 1 second
        setTotalDurationMs(prev => prev + 1000)
        
        // Also update the matching category in topCategories if it exists
        setTopCategories(prevCategories => {
          if (!currentCategoryDetails) return prevCategories;
          
          return prevCategories.map(cat => {
            if (cat.id === currentCategoryDetails._id) {
              // This is the current category, increment its time
              return { ...cat, durationMs: cat.durationMs + 1000 };
            }
            return cat;
          });
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentCategoryDetails, isTrackingPaused, latestStatus]);

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
      (event.target as HTMLElement).closest('.edit-icon-area')
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
    console.log('[FloatingDisplay] handleCategoryNameClick', currentCategoryDetails, activityInfo)

    if (window.floatingApi && window.floatingApi.requestRecategorizeView) {
      if (!currentCategoryDetails || !activityInfo.identifier || !activityInfo.itemType) {
        console.warn(
          '[FloatingDisplay] Not enough information to send for recategorization.',
          currentCategoryDetails,
          activityInfo
        )
        return
      }
      const activityToRecategorize = {
        identifier: activityInfo.identifier,
        nameToDisplay: activityInfo.name || 'Unknown Activity',
        itemType: activityInfo.itemType,
        currentCategoryId: currentCategoryDetails._id,
        currentCategoryName: currentCategoryDetails.name,
        currentCategoryColor: currentCategoryDetails.color,
        originalUrl: activityInfo.url,
        categoryReasoning: activityInfo.categoryReasoning
      }

      console.log('[FloatingDisplay] Sending activity to recategorize:', activityToRecategorize)

      window.floatingApi.requestRecategorizeView(activityToRecategorize)
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
    return (
      <div className="w-full h-full flex items-center justify-center p-2 rounded-xl bg-background border-2 border-secondary/50">
        <span className="text-xs text-muted-foreground animate-pulse">Waiting for activity...</span>
      </div>
    )
  }

  let productiveIsHighlighted = false
  let productiveIsEnlarged = false
  const productiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'green'

  let unproductiveIsHighlighted = false
  let unproductiveIsEnlarged = false
  let unproductiveHighlightColor: 'green' | 'red' | 'orange' | undefined = 'red'
  let unproductiveLabel = 'Unproductive'

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

  // visual indication when tracking is paused
  const getPauseIndicator = () => {
    if (isTrackingPaused) {
      return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl z-50 flex items-center justify-center">
          <div className="bg-blue-700 text-white px-2 py-1 opacity-90 rounded-lg font-semibold text-xs shadow-lg flex items-center gap-1">
            <Pause size={12} />
            PAUSED
          </div>
        </div>
      )
    }
    return null
  }

  // Add debugging before render
  console.log('[FloatingDisplay] Pre-render state:', { 
    totalDurationMs, 
    shouldShowTotal: totalDurationMs > 0 && !!currentCategoryDetails,
    currentCategoryDetails
  })

  return (
    <div
      ref={draggableRef}
      className={clsx(
        'w-full h-full flex items-center px-0.5 rounded-[10px] select-none',
        'border-2 border-secondary/50',
        isTrackingPaused && 'opacity-75'
      )}
      onMouseDown={handleMouseDownOnDraggable}
      title="Drag to move"
      style={{ cursor: 'grab' }}
    >
      {getPauseIndicator()}
      <div className="flex flex-col gap-[-1px] mr-[-1px] items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="close-button-area p-1 w-5 h-5 mr-1 rounded-[7px]"
          title="Close Mini Timer"
        >
          <X className="w-[8px] h-[8px] text-muted-foreground hover:text-primary" />
        </Button>
        {/* button to open the main app window */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenMainAppWindow}
          className="open-main-app-window-butto p-1 w-5 h-5 mr-1 rounded-[7px]"
          title="Open Main App Window"
        >
          <AppWindowMac className="w-[8px] h-[8px] text-muted-foreground hover:text-primary" />
        </Button>
      </div>

      <div className="flex-grow flex items-stretch gap-1 h-full">
        <StatusBox
          label="Productive"
          time={productiveTimeFormatted}
          isHighlighted={productiveIsHighlighted}
          highlightColor={productiveHighlightColor}
          isEnlarged={productiveIsEnlarged}
          categoryDetails={productiveBoxCategoryDetails}
          onCategoryClick={handleCategoryNameClick}
          disabled={!currentCategoryDetails}
        />
        <StatusBox
          label={unproductiveLabel}
          time={unproductiveTimeFormatted}
          isHighlighted={unproductiveIsHighlighted}
          highlightColor={unproductiveHighlightColor}
          isEnlarged={unproductiveIsEnlarged}
          categoryDetails={unproductiveBoxCategoryDetails}
          onCategoryClick={handleCategoryNameClick}
          disabled={!currentCategoryDetails}
        />
      </div>
      {/* Add this block to display today's category time */}
      {totalDurationMs > 0 && currentCategoryDetails && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded-md shadow flex items-center gap-1">
          
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: currentCategoryDetails.color }}
          />
          <span className="font-medium">{currentCategoryDetails.name}:</span>
          <span>{formatMsToTime(totalDurationMs)}</span>
        </div>
      )}
      {/* Show top categories side by side */}
      {topCategories.length > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 transform text-[10px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded-md shadow">
          <div className="flex flex-row items-center gap-2">
            {topCategories.slice(0, 3).map((cat, index) => (
              <div key={cat.id} className="flex items-center gap-1 whitespace-nowrap">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium max-w-[50px] truncate">{cat.name}:</span>
                <span className="flex-shrink-0">{formatMsToTime(cat.durationMs)}</span>
                {index < 2 && index < topCategories.length - 1 && (
                  <span className="text-muted-foreground/50">|</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatingDisplay
