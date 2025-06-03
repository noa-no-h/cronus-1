import { useEffect, useState } from 'react'
import { ActiveWindowEvent } from 'shared'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { formatDuration } from '../lib/activityByCategoryWidgetHelpers'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'

interface TimeBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  description?: string
}

interface CalendarWidgetProps {
  selectedDate: Date
  onDateChange: (newDate: Date) => void
}

const CalendarWidget = ({ selectedDate, onDateChange }: CalendarWidgetProps) => {
  const { token } = useAuth()
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])

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
        description: event.title
      })
    }

    setTimeBlocks(blocks)
  }, [eventsData])

  return (
    <Card className="w-full h-full">
      <CardContent className="p-4">
        <div className="space-y-1">
          {/* Hours (12:00 to 19:00 like in screenshot) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const hour = i + 12 // Start from 12:00
            const hourBlocks = timeBlocks.filter((block) => block.startTime.getHours() === hour)

            return (
              <div key={hour} className="relative">
                {/* Hour marker */}
                <div className="text-sm text-muted-foreground mb-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Blocks for this hour */}
                <div className="space-y-1 ml-4">
                  {hourBlocks.map((block, index) => (
                    <div key={index} className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                      <div className="text-sm">
                        {block.name}
                        {block.description && (
                          <span className="text-muted-foreground ml-2">- {block.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default CalendarWidget
