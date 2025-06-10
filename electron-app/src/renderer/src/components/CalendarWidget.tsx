import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useDarkMode } from '../hooks/useDarkMode'
import { SYSTEM_EVENT_NAMES } from '../lib/constants'
import type { ProcessedEventBlock } from './DashboardView'
import DayTimeline, { type TimeBlock } from './DayTimeline'
import { Button } from './ui/button'
import { Card } from './ui/card'
import WeekView from './WeekView'

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
  const currentTime = useCurrentTime()
  const isDarkMode = useDarkMode()
  const [wasSetToToday, setWasSetToToday] = useState(false)

  useEffect(() => {
    setWasSetToToday(selectedDate.toDateString() === new Date().toDateString())
  }, [selectedDate])

  useEffect(() => {
    // only run this if we're viewing the current date
    if (!wasSetToToday) {
      return
    }

    const interval = setInterval(() => {
      // and the day is off
      if (selectedDate.toDateString() !== new Date().toDateString()) {
        // set to actual today
        onDateChange(new Date())
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [wasSetToToday, selectedDate, onDateChange])

  // Check if we're viewing today
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const canGoNext = () => {
    const delta = viewMode === 'week' ? 7 : 1
    const tomorrow = new Date(selectedDate)
    tomorrow.setDate(tomorrow.getDate() + delta)
    tomorrow.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tomorrow <= today
  }

  // Process events into time blocks
  useEffect(() => {
    if (isLoadingEvents || !processedEvents) {
      setTimeBlocks([])
      return
    }

    const blocks: TimeBlock[] = processedEvents
      .filter((event) => !SYSTEM_EVENT_NAMES.includes(event.name))
      .map((eventBlock) => ({
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

  const handlePrev = () => {
    const newDate = new Date(selectedDate)
    const delta = viewMode === 'week' ? 7 : 1
    newDate.setDate(newDate.getDate() - delta)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    const delta = viewMode === 'week' ? 7 : 1
    newDate.setDate(newDate.getDate() + delta)

    // Check if the new date would be in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    newDate.setHours(0, 0, 0, 0)

    // Only allow navigation if the new date is not in the future
    if (newDate <= today) {
      onDateChange(newDate)
    }
  }

  const formattedDate = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const dayOfWeek = startOfWeek.getDay() // Sunday = 0
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.toLocaleDateString(undefined, { month: 'short' })
      const endMonth = endOfWeek.toLocaleDateString(undefined, { month: 'short' })
      const startDay = startOfWeek.getDate()
      const endDay = endOfWeek.getDate()
      const year = endOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
    }
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [selectedDate, viewMode])

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="p-2 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="xs" onClick={handlePrev}>
              <ChevronLeft size={20} />
            </Button>
            <span className="text-sm text-muted-foreground font-medium">{formattedDate}</span>
            <Button variant="outline" size="xs" onClick={handleNext} disabled={!canGoNext()}>
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="flex items-center space-x-1 rounded-md p-1">
            <Button
              size="xs"
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              onClick={() => onViewModeChange('day')}
              className="px-2 h-6"
            >
              Day
            </Button>
            <Button
              size="xs"
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              onClick={() => onViewModeChange('week')}
              className="px-2 h-6"
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <DayTimeline
          timeBlocks={timeBlocks}
          currentTime={currentTime}
          isToday={isToday}
          isDarkMode={isDarkMode}
          selectedHour={selectedHour}
          onHourSelect={onHourSelect}
        />
      ) : (
        <WeekView
          processedEvents={processedEvents}
          selectedDate={selectedDate}
          isDarkMode={isDarkMode}
        />
      )}
    </Card>
  )
}

export default CalendarWidget
