import { useEffect, useRef } from 'react'
import { formatDuration } from '../lib/activityByCategoryWidgetHelpers'
import { hexToRgba } from '../lib/colors'
import TimelineSegmentContent from './TimelineSegmentContent'
import TimelineTooltipContent, { type HourlyTimelineSegment } from './TimelineTooltipContent'
import { ScrollArea } from './ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export interface TimeBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  description?: string
  url?: string
  categoryColor?: string
}

interface DayTimelineProps {
  timeBlocks: TimeBlock[]
  currentTime: Date
  isToday: boolean
  isDarkMode: boolean
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
}

const getTimelineSegmentsForHour = (
  hour: number,
  timeBlocks: TimeBlock[]
): HourlyTimelineSegment[] => {
  const hourBlocks = timeBlocks.filter((block) => {
    const blockHour = block.startTime.getHours()
    const blockEndHour = block.endTime.getHours()
    // Include blocks that start in this hour or span across this hour
    return blockHour === hour || (blockHour < hour && blockEndHour >= hour)
  })

  const segments: HourlyTimelineSegment[] = []

  hourBlocks.forEach((block) => {
    // Calculate the portion of the block that falls within this hour
    const hourStart = new Date(block.startTime)
    hourStart.setHours(hour, 0, 0, 0)

    const hourEnd = new Date(block.startTime)
    hourEnd.setHours(hour, 59, 59, 999)

    const segmentStart = new Date(Math.max(block.startTime.getTime(), hourStart.getTime()))
    const segmentEnd = new Date(Math.min(block.endTime.getTime(), hourEnd.getTime()))

    if (segmentEnd.getTime() <= segmentStart.getTime()) return

    const startMinute = segmentStart.getMinutes() + segmentStart.getSeconds() / 60
    const endMinute = segmentEnd.getMinutes() + segmentEnd.getSeconds() / 60

    // Handle case where segment spans to next hour
    const actualEndMinute = segmentEnd.getHours() > hour ? 60 : endMinute

    const durationMs = segmentEnd.getTime() - segmentStart.getTime()
    const widthPercentage = ((actualEndMinute - startMinute) / 60) * 100
    const leftPercentage = (startMinute / 60) * 100

    segments.push({
      startMinute,
      endMinute: actualEndMinute,
      durationMs,
      name: block.name,
      description: block.description,
      url: block.url,
      categoryColor: block.categoryColor,
      widthPercentage,
      leftPercentage
    })
  })

  return segments.sort((a, b) => a.startMinute - b.startMinute)
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

              return (
                <Tooltip key={hour} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group relative px-2 flex cursor-pointer border-b border-slate-300 dark:border-slate-600 ${
                        isSelectedHour ? 'bg-blue-200/20 dark:bg-blue-800/30' : 'hover:bg-muted/50'
                      }`}
                      ref={isCurrentHour ? currentHourRef : null}
                      onClick={() => onHourSelect(isSelectedHour ? null : hour)}
                    >
                      <div className="w-12 py-2 text-xs text-muted-foreground font-medium sticky left-0 flex items-start">
                        <span>{hour.toString().padStart(2, '0')}:00</span>
                      </div>

                      <div className="flex-1 border-l pl-2 py-2 relative">
                        <div
                          className={`relative h-12 rounded-md pt-1.5 ${
                            isSelectedHour
                              ? 'bg-blue-200/20 dark:bg-blue-800/30'
                              : 'bg-slate-50 dark:bg-slate-900'
                          }`}
                        >
                          <div className="absolute inset-0 overflow-hidden rounded-md">
                            <div className="absolute inset-0 flex">
                              {Array.from({ length: 4 }).map((_, quarter) => (
                                <div
                                  key={quarter}
                                  className="flex-1 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                                />
                              ))}
                            </div>

                            {timelineSegments.map((segment, idx) => (
                              <div
                                key={`${hour}-${segment.name}-${idx}`}
                                className={`absolute top-1 bottom-1 rounded-sm
                                      hover:opacity-80 transition-opacity cursor-pointer
                                      flex items-center justify-center overflow-hidden`}
                                style={{
                                  backgroundColor: segment.categoryColor
                                    ? hexToRgba(segment.categoryColor, isDarkMode ? 0.5 : 0.3)
                                    : hexToRgba('#808080', isDarkMode ? 0.3 : 0.2),
                                  left: `${segment.leftPercentage}%`,
                                  width: `${Math.max(segment.widthPercentage, 1)}%`,
                                  opacity: individualSegmentOpacity
                                }}
                                title={`${segment.name} - ${formatDuration(segment.durationMs)} (${Math.floor(segment.startMinute)}:${String(Math.floor((segment.startMinute % 1) * 60)).padStart(2, '0')} - ${Math.floor(segment.endMinute)}:${String(Math.floor((segment.endMinute % 1) * 60)).padStart(2, '0')})`}
                              >
                                <TimelineSegmentContent segment={segment} />
                              </div>
                            ))}
                          </div>

                          {showCurrentTime && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                              style={{ left: `${minutePercentage}%` }}
                            >
                              <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-red-500 z-20" />
                            </div>
                          )}
                        </div>

                        {showCurrentTime && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-2 py-0.5 text-xs text-red-500 dark:text-red-300 font-medium bg-white dark:bg-slate-800 rounded border">
                              {currentTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  {timelineSegments.length > 0 && (
                    <TooltipContent side="bottom" align="start" sideOffset={10} className="p-0">
                      <TimelineTooltipContent timelineSegments={timelineSegments} hour={hour} />
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </ScrollArea>
  )
}

export default DayTimeline
