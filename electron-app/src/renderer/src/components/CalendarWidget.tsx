import { useEffect, useState, useRef } from 'react'
import { ActiveWindowEvent } from 'shared'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
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

interface AggregatedBlock {
  appName: string
  totalDurationMs: number
  blocks: TimeBlock[]
  url?: string
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
        url: event.url
      })
    }

    setTimeBlocks(blocks)
  }, [eventsData])

  const getAggregatedBlocksForHour = (hour: number): AggregatedBlock[] => {
    const hourBlocks = timeBlocks.filter((block) => block.startTime.getHours() === hour)

    const aggregated = new Map<string, AggregatedBlock>()

    hourBlocks.forEach((block) => {
      const existing = aggregated.get(block.name)
      if (existing) {
        existing.totalDurationMs += block.durationMs
        existing.blocks.push(block)
      } else {
        aggregated.set(block.name, {
          appName: block.name,
          totalDurationMs: block.durationMs,
          blocks: [block],
          url: block.url
        })
      }
    })

    return Array.from(aggregated.values()).sort((a, b) => b.totalDurationMs - a.totalDurationMs)
  }

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    // Convert to percentage within the hour (0-100)
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
      {/* Fixed header */}
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
              const aggregatedBlocks = getAggregatedBlocksForHour(hour)
              const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
              const showCurrentTime = isToday && hour === currentHour
              const isCurrentHour = hour === currentHour

              return (
                <div
                  key={hour}
                  className="group relative flex min-h-[64px] hover:bg-muted/50 border-b border-slate-200 dark:border-slate-700"
                  ref={isCurrentHour ? currentHourRef : null}
                >
                  <div className="w-16 py-2 text-sm font-medium sticky left-0 bg-background flex items-start">
                    <span className="px-2">{hour.toString().padStart(2, '0')}:00</span>
                  </div>

                  <div className="flex-1 border-l pl-4 py-2 relative">
                    {showCurrentTime && (
                      <div
                        className="absolute left-0 right-0 flex items-center justify-between z-10"
                        style={{ top: `${minutePercentage}%` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-[5px]" />
                        <span className="px-2 py-0.5 text-xs text-red-500 font-medium">
                          {currentTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    {aggregatedBlocks.length > 0 ? (
                      <div className="space-y-1 relative">
                        {aggregatedBlocks.map((agg, idx) => (
                          <div
                            key={`${hour}-${agg.appName}-${idx}`}
                            className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 
                                     hover:bg-slate-200 dark:hover:bg-slate-700 
                                     transition-colors relative z-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                {agg.url ? (
                                  <img
                                    src={getFaviconURL(agg.url)}
                                    className="w-4 h-4 rounded flex-shrink-0"
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <AppIcon
                                    appName={agg.appName}
                                    size={16}
                                    className="flex-shrink-0"
                                  />
                                )}
                                <span className="text-sm truncate">{agg.appName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {formatDuration(agg.totalDurationMs)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full" />
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
