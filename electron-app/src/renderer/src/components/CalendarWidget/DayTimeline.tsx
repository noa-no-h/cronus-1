import { useEffect, useRef } from 'react'
import {
  getTimelineSegmentsForHour,
  type EnrichedTimelineSegment,
  type TimeBlock
} from '../../lib/dayTimelineHelpers'
import { ScrollArea } from '../ui/scroll-area'
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
}

const DayTimeline = ({
  timeBlocks,
  currentTime,
  isToday,
  isDarkMode,
  selectedHour,
  onHourSelect
}: DayTimelineProps) => {
  const currentHourRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Scroll to current hour when viewing today
  useEffect(() => {
    if (isToday && currentHourRef.current && scrollAreaRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday, timeBlocks])

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const minutePercentage = (minutes / 60) * 100
    return { hours, minutePercentage }
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <TooltipProvider>
        <div>
          <div>
            {Array.from({ length: 24 }).map((_, hour) => {
              const timelineSegments = getTimelineSegmentsForHour(hour, timeBlocks)
              const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
              const showCurrentTime = isToday && hour === currentHour
              const isCurrentHour = hour === currentHour
              const isSelectedHour = selectedHour === hour
              const individualSegmentOpacity = selectedHour !== null && !isSelectedHour ? 0.5 : 1
              const isLastHour = hour === 23

              let currentActiveSegment: EnrichedTimelineSegment | null = null
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
    </ScrollArea>
  )
}

export default DayTimeline
