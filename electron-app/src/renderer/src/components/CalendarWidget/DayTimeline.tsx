import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  getTimelineSegmentsForHour,
  type EnrichedTimelineSegment,
  type TimeBlock
} from '../../lib/dayTimelineHelpers'
import { TooltipProvider } from '../ui/tooltip'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { TimelineHour } from './TimelineHour'

export type { TimeBlock }

interface DayTimelineProps {
  timeBlocks: TimeBlock[]
  currentTime: Date
  isToday: boolean
  isDarkMode: boolean
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
  hourHeight: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

const DayTimeline = ({
  timeBlocks,
  currentTime,
  isToday,
  isDarkMode,
  selectedHour,
  onHourSelect,
  hourHeight,
  scrollContainerRef
}: DayTimelineProps) => {
  const currentHourRef = useRef<HTMLDivElement>(null)
  const prevHourHeightRef = useRef(hourHeight)
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  const [dragState, setDragState] = useState<{
    isSelecting: boolean
    isDragging: boolean
    startPos: { y: number } | null
    currentPos: { y: number } | null
  }>({
    isSelecting: false,
    isDragging: false,
    startPos: null,
    currentPos: null
  })

  // Scroll to current hour when viewing today
  useEffect(() => {
    if (isToday && currentHourRef.current && scrollContainerRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday, timeBlocks, scrollContainerRef])

  // Adjust scroll position on zoom to keep the view centered
  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current
    if (!scrollElement) return

    const prevHourHeight = prevHourHeightRef.current
    const zoomRatio = hourHeight / prevHourHeight

    if (zoomRatio !== 1) {
      const { scrollTop, clientHeight } = scrollElement
      const scrollCenter = scrollTop + clientHeight / 2
      const newScrollTop = scrollCenter * zoomRatio - clientHeight / 2
      scrollElement.scrollTop = newScrollTop
    }

    // Update ref for the next render
    prevHourHeightRef.current = hourHeight
  }, [hourHeight, scrollContainerRef])

  const yToTime = (y: number) => {
    if (!timelineContainerRef.current) return null

    const containerRect = timelineContainerRef.current.getBoundingClientRect()
    const relativeY = y - containerRect.top

    const hourHeightInRem = hourHeight
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const hourHeightInPx = hourHeightInRem * rootFontSize
    const totalHeight = 24 * hourHeightInPx

    const snappedY = Math.max(0, Math.min(relativeY, totalHeight))

    const hour = Math.floor(snappedY / hourHeightInPx)
    const minuteFraction = (snappedY % hourHeightInPx) / hourHeightInPx
    const minute = Math.floor(minuteFraction * 60)

    // Snap to 15-minute intervals
    const snappedMinute = Math.round(minute / 15) * 15

    return { hour, minute: snappedMinute, y: snappedY }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startPos = yToTime(e.clientY)
    if (!startPos) return

    setDragState({
      isSelecting: true,
      isDragging: false,
      startPos: { y: e.clientY },
      currentPos: { y: e.clientY }
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting) return

    setDragState((prev) => {
      if (!prev.startPos) return prev
      const isDragging = prev.isDragging || Math.abs(e.clientY - prev.startPos.y) > 5 // 5px threshold
      return { ...prev, isDragging, currentPos: { y: e.clientY } }
    })
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting) return

    if (dragState.isDragging) {
      // It's a drag
      const startTime = yToTime(dragState.startPos!.y)
      const endTime = yToTime(e.clientY)

      if (startTime && endTime) {
        // Ensure start is before end
        const selectionStart = startTime.y < endTime.y ? startTime : endTime
        const selectionEnd = startTime.y < endTime.y ? endTime : startTime

        const entryName = 'New Entry' // Hardcoded for now
        console.log('Creating new entry:', {
          name: entryName,
          startTime: `${String(selectionStart.hour).padStart(2, '0')}:${String(
            selectionStart.minute
          ).padStart(2, '0')}`,
          endTime: `${String(selectionEnd.hour).padStart(2, '0')}:${String(
            selectionEnd.minute
          ).padStart(2, '0')}`
        })
      }
    }
    // Click logic is now handled by a button in TimelineHour.

    setDragState({ isSelecting: false, isDragging: false, startPos: null, currentPos: null })
  }

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const minutePercentage = (minutes / 60) * 100
    return { hours, minutePercentage }
  }

  const renderSelectionBox = () => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return null

    const start = yToTime(dragState.startPos.y)
    const end = yToTime(dragState.currentPos.y)
    if (!start || !end) return null

    const top = Math.min(start.y, end.y)
    const height = Math.abs(start.y - end.y)

    return (
      <div
        className="absolute ml-16 left-0 right-0 bg-blue-500/30 border border-blue-500 rounded-md z-10"
        style={{
          top: `${top}px`,
          height: `${height}px`
        }}
      />
    )
  }

  return (
    <div className="flex-1">
      <TooltipProvider>
        <div
          ref={timelineContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // End drag if mouse leaves container
          className="relative"
        >
          {renderSelectionBox()}
          {Array.from({ length: 24 }).map((_, hour) => {
            let currentActiveSegment: EnrichedTimelineSegment | null = null
            const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
            const showCurrentTime = isToday && hour === currentHour
            const isCurrentHour = hour === currentHour
            const isSelectedHour = selectedHour === hour
            const individualSegmentOpacity = selectedHour !== null && !isSelectedHour ? 0.5 : 1
            const isLastHour = hour === 23

            const timelineSegments = getTimelineSegmentsForHour(hour, timeBlocks)
            if (showCurrentTime && timelineSegments.length > 0) {
              const lastSegment = timelineSegments[timelineSegments.length - 1]
              const currentMinute = currentTime.getMinutes()
              if (lastSegment.endMinute > currentMinute) {
                lastSegment.heightPercentage =
                  ((currentMinute - lastSegment.startMinute) / 60) * 100
                lastSegment.endMinute = currentMinute
                currentActiveSegment = lastSegment
              }
            }

            return (
              <div key={hour} className="relative">
                <TimelineHour
                  hour={hour}
                  timelineSegments={timelineSegments}
                  isCurrentHour={isCurrentHour}
                  isSelectedHour={isSelectedHour}
                  isDarkMode={isDarkMode}
                  individualSegmentOpacity={individualSegmentOpacity}
                  currentHourRef={currentHourRef}
                  onHourSelect={onHourSelect}
                  isLastHour={isLastHour}
                  currentActiveSegment={currentActiveSegment}
                  hourHeight={hourHeight}
                  selectedHour={selectedHour}
                />
                {showCurrentTime && (
                  <CurrentTimeIndicator
                    minutePercentage={minutePercentage}
                    currentTime={currentTime}
                  />
                )}
              </div>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}

export default DayTimeline
