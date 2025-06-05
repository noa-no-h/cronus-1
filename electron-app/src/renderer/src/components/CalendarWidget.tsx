'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../lib/activityByCategoryWidgetHelpers'
import { getFaviconURL } from '../utils/favicon'
import AppIcon from './AppIcon'
import type { ProcessedEventBlock } from './DashboardView'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ScrollArea } from './ui/scroll-area'

interface TimeBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  description?: string
  url?: string
  categoryColor?: string
}

interface HourlyTimelineSegment {
  startMinute: number
  endMinute: number
  durationMs: number
  name: string
  description?: string
  url?: string
  categoryColor?: string
  widthPercentage: number
  leftPercentage: number
}

interface CalendarWidgetProps {
  selectedDate: Date
  onDateChange: (newDate: Date) => void
  viewMode: 'day' | 'week'
  onViewModeChange: (newMode: 'day' | 'week') => void
  processedEvents: ProcessedEventBlock[] | null
  isLoadingEvents: boolean
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
    // Basic hex validation
    return `rgba(128, 128, 128, ${alpha})` // Default gray if hex is invalid
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// TODO: Add view mode (day, week)
const CalendarWidget = ({
  selectedDate,
  onDateChange,
  processedEvents,
  isLoadingEvents,
  viewMode,
  onViewModeChange,
  selectedHour,
  onHourSelect
}: CalendarWidgetProps) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const currentHourRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check dark mode status on mount and when it changes
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()

    // Optional: Observe changes to the dark class if your app dynamically toggles it
    // without a page reload. Otherwise, this effect only runs on mount.
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Scroll to current hour when viewing today
  useEffect(() => {
    const isToday = selectedDate.toDateString() === new Date().toDateString()
    if (isToday && currentHourRef.current && scrollAreaRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedDate, timeBlocks])

  // Check if we're viewing today
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Process events into time blocks
  useEffect(() => {
    if (isLoadingEvents || !processedEvents) {
      setTimeBlocks([])
      return
    }

    const blocks: TimeBlock[] = processedEvents.map((eventBlock) => ({
      startTime: eventBlock.startTime,
      endTime: eventBlock.endTime,
      durationMs: eventBlock.durationMs,
      name: eventBlock.name,
      description: eventBlock.title,
      url: eventBlock.url,
      categoryColor: eventBlock.categoryColor
    }))

    setTimeBlocks(blocks)
  }, [processedEvents, isLoadingEvents])

  const getTimelineSegmentsForHour = (hour: number): HourlyTimelineSegment[] => {
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

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const minutePercentage = (minutes / 60) * 100
    return { hours, minutePercentage }
  }

  const handlePrev = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="p-2 border-b shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="xs" onClick={handlePrev}>
              <ChevronLeft size={20} />
            </Button>
            <span className="text-sm text-muted-foreground font-medium">{formattedDate}</span>
            <Button variant="outline" size="xs" onClick={handleNext}>
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div>
          <div className="space-y-0.5">
            {Array.from({ length: 24 }).map((_, hour) => {
              const timelineSegments = getTimelineSegmentsForHour(hour)
              const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
              const showCurrentTime = isToday && hour === currentHour
              const isCurrentHour = hour === currentHour
              const isSelectedHour = selectedHour === hour
              const individualSegmentOpacity = selectedHour !== null && !isSelectedHour ? 0.5 : 1

              return (
                <div
                  key={hour}
                  className={`group relative px-2 flex min-h-[80px] cursor-pointer border-b border-slate-300 dark:border-slate-600 ${
                    isSelectedHour ? 'bg-blue-200/20 dark:bg-blue-800/30' : 'hover:bg-muted/50'
                  }`}
                  ref={isCurrentHour ? currentHourRef : null}
                  onClick={() => onHourSelect(isSelectedHour ? null : hour)}
                >
                  <div className="w-12 py-2 text-xs text-muted-foreground font-medium sticky left-0 flex items-start">
                    <span>{hour.toString().padStart(2, '0')}:00</span>
                  </div>

                  <div className="flex-1 border-l pl-4 py-2 relative">
                    <div
                      className={`relative h-12 rounded-md mb-2 overflow-hidden ${
                        isSelectedHour
                          ? 'bg-blue-200/20 dark:bg-blue-800/30'
                          : 'bg-slate-50 dark:bg-slate-900'
                      }`}
                    >
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
                          {segment.widthPercentage > 8 && (
                            <div className="flex items-center space-x-1 px-1">
                              {segment.url ? (
                                <img
                                  src={getFaviconURL(segment.url) || '/placeholder.svg'}
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              ) : (
                                <AppIcon
                                  appName={segment.name}
                                  size={12}
                                  className="flex-shrink-0"
                                />
                              )}
                              {segment.widthPercentage > 15 && (
                                <span className="text-xs font-medium truncate">{segment.name}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {showCurrentTime && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{ left: `${minutePercentage}%` }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                      )}
                    </div>

                    {timelineSegments.length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(
                          timelineSegments.reduce(
                            (acc, segment) => {
                              if (!acc[segment.name]) {
                                acc[segment.name] = {
                                  totalDuration: 0,
                                  url: segment.url,
                                  segments: []
                                }
                              }
                              acc[segment.name].totalDuration += segment.durationMs
                              acc[segment.name].segments.push(segment)
                              return acc
                            },
                            {} as Record<
                              string,
                              {
                                totalDuration: number
                                url?: string
                                segments: HourlyTimelineSegment[]
                              }
                            >
                          )
                        )
                          .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
                          .slice(0, 3)
                          .map(([appName, data]) => (
                            <div
                              key={`${hour}-${appName}-summary`}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <div className="flex items-center space-x-2">
                                {data.url ? (
                                  <img
                                    src={getFaviconURL(data.url) || '/placeholder.svg'}
                                    className="w-3 h-3 rounded flex-shrink-0"
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <AppIcon appName={appName} size={12} className="flex-shrink-0" />
                                )}
                                <span className="truncate">{appName}</span>
                              </div>
                              <span>{formatDuration(data.totalDuration)}</span>
                            </div>
                          ))}
                      </div>
                    )}

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
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}

export default CalendarWidget
