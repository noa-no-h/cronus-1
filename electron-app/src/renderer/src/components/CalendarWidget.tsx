import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useDarkMode } from '../hooks/useDarkMode'
import type { ProcessedEventBlock } from './DashboardView'
import DayTimeline, { type TimeBlock } from './DayTimeline'
import { Button } from './ui/button'
import { Card } from './ui/card'

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
  viewMode: _viewMode,
  onViewModeChange: _onViewModeChange,
  selectedHour,
  onHourSelect
}: CalendarWidgetProps) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const currentTime = useCurrentTime()
  const isDarkMode = useDarkMode()

  // Check if we're viewing today
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const canGoNext = () => {
    const tomorrow = new Date(selectedDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
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

  const handlePrev = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)

    // Check if the new date would be in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    newDate.setHours(0, 0, 0, 0)

    // Only allow navigation if the new date is not in the future
    if (newDate <= today) {
      onDateChange(newDate)
    }
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
            <Button variant="outline" size="xs" onClick={handleNext} disabled={!canGoNext()}>
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </div>

      <DayTimeline
        timeBlocks={timeBlocks}
        currentTime={currentTime}
        isToday={isToday}
        isDarkMode={isDarkMode}
        selectedHour={selectedHour}
        onHourSelect={onHourSelect}
      />
    </Card>
  )
}

export default CalendarWidget
