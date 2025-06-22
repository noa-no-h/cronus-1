import { useEffect, useLayoutEffect, useRef } from 'react'
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

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const minutePercentage = (minutes / 60) * 100
    return { hours, minutePercentage }
  }

  return (
    <div className="flex-1">
      <TooltipProvider>
        <div>
          <div>
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
        </div>
      </TooltipProvider>
    </div>
  )
}

export default DayTimeline
