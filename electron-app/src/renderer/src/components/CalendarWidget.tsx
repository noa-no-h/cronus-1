'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { formatDuration } from '../lib/activityByCategoryWidgetHelpers'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import AppIcon from './AppIcon'
import { getFaviconURL } from '../utils/favicon'

interface TimeBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  description?: string
  url?: string
}

interface HourlyTimelineSegment {
  startMinute: number
  endMinute: number
  durationMs: number
  name: string
  description?: string
  url?: string
  widthPercentage: number
  leftPercentage: number
}

interface CalendarWidgetProps {
  selectedDate: Date
  onDateChange: (newDate: Date) => void
}

const CalendarWidget = ({ selectedDate, onDateChange }: CalendarWidgetProps) => {
  const { token } = useAuth()
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const currentHourRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  // Get events for the selected date
  const startOfDay = new Date(selectedDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDate)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: eventsData } = trpc.activeWindowEvents.getEventsForDateRange.useQuery(
    {
      token: token || '',
      startDateMs: startOfDay.getTime(),
      endDateMs: endOfDay.getTime()
    },
    { enabled: !!token }
  )

  // Process events into time blocks
  useEffect(() => {
    if (!eventsData) return

    const sortedEvents = [...eventsData]
      .filter((event) => typeof event.timestamp === 'number')
      .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))

    const blocks: TimeBlock[] = []

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i]
      const startTime = new Date(event.timestamp as number)
      let endTime: Date

      if (i < sortedEvents.length - 1) {
        endTime = new Date(sortedEvents[i + 1].timestamp as number)
      } else {
        const maxEndTime = new Date(startTime.getTime() + 15 * 60 * 1000)
        const now = new Date()
        endTime = now < maxEndTime ? now : maxEndTime
      }

      const durationMs = endTime.getTime() - startTime.getTime()
      if (durationMs < 1000) continue

      blocks.push({
        startTime,
        endTime,
        durationMs,
        name: event.ownerName,
        description: event.title,
        url: event.url || undefined
      })
    }

    setTimeBlocks(blocks)
  }, [eventsData])

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
        widthPercentage,
        leftPercentage
      })
    })

    return segments.sort((a, b) => a.startMinute - b.startMinute)
  }

  // Generate colors for different apps
  const getAppColor = (appName: string): string => {
    const colors = [
      'bg-blue-200 dark:bg-blue-800',
      'bg-green-200 dark:bg-green-800',
      'bg-purple-200 dark:bg-purple-800',
      'bg-orange-200 dark:bg-orange-800',
      'bg-pink-200 dark:bg-pink-800',
      'bg-cyan-200 dark:bg-cyan-800',
      'bg-yellow-200 dark:bg-yellow-800',
      'bg-red-200 dark:bg-red-800',
      'bg-indigo-200 dark:bg-indigo-800',
      'bg-teal-200 dark:bg-teal-800'
    ]

    let hash = 0
    for (let i = 0; i < appName.length; i++) {
      hash = appName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
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
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <span className="text-lg">←</span>
            </Button>
            <span className="text-sm font-medium">{formattedDate}</span>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <span className="text-lg">→</span>
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4">
          <div className="space-y-0.5">
            {Array.from({ length: 24 }).map((_, hour) => {
              const timelineSegments = getTimelineSegmentsForHour(hour)
              const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
              const showCurrentTime = isToday && hour === currentHour
              const isCurrentHour = hour === currentHour

              return (
                <div
                  key={hour}
                  className="group relative flex min-h-[80px] hover:bg-muted/50 border-b border-slate-200 dark:border-slate-700"
                  ref={isCurrentHour ? currentHourRef : null}
                >
                  <div className="w-16 py-2 text-sm font-medium sticky left-0 bg-background flex items-start">
                    <span className="px-2">{hour.toString().padStart(2, '0')}:00</span>
                  </div>

                  <div className="flex-1 border-l pl-4 py-2 relative">
                    <div className="relative h-12 bg-slate-50 dark:bg-slate-900 rounded-md mb-2 overflow-hidden">
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
                          className={`absolute top-1 bottom-1 ${getAppColor(segment.name)} 
                                    rounded-sm border border-slate-300 dark:border-slate-600
                                    hover:opacity-80 transition-opacity cursor-pointer
                                    flex items-center justify-center overflow-hidden`}
                          style={{
                            left: `${segment.leftPercentage}%`,
                            width: `${Math.max(segment.widthPercentage, 1)}%`
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
                        <span className="px-2 py-0.5 text-xs text-red-500 font-medium bg-white dark:bg-slate-800 rounded border">
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
