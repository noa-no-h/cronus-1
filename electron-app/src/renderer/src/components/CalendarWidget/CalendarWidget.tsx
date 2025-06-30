import { useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentTime } from '../../hooks/useCurrentTime'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { SYSTEM_EVENT_NAMES } from '../../lib/constants'
import type { TimeBlock } from '../../lib/dayTimelineHelpers'
import type { ProcessedEventBlock } from '../DashboardView'
import { CalendarWidgetHeader } from './CalendarWidgetHeader'
import DayTimeline from './DayTimeline'
import WeekView from './WeekView'

interface CalendarWidgetProps {
  selectedDate: Date
  trackedEvents: ProcessedEventBlock[] | null
  googleCalendarEvents: ProcessedEventBlock[] | null
  isLoadingEvents: boolean
  viewMode: 'day' | 'week'
  onDateChange: (newDate: Date) => void
  onViewModeChange: (newMode: 'day' | 'week') => void
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
  selectedDay: Date | null
  onDaySelect: (day: Date | null) => void
}

const CalendarWidget = ({
  selectedDate,
  trackedEvents,
  googleCalendarEvents,
  isLoadingEvents,
  viewMode,
  onDateChange,
  onViewModeChange,
  selectedHour,
  onHourSelect,
  selectedDay,
  onDaySelect
}: CalendarWidgetProps) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const currentTime = useCurrentTime()
  const isDarkMode = useDarkMode()
  const [wasSetToToday, setWasSetToToday] = useState(false)
  const [weekViewMode, setWeekViewMode] = useState<'stacked' | 'grouped'>('grouped')
  const [hourHeight, setHourHeight] = useState(60) // Default hour height
  const width = useWindowWidth()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  const convertProcessedToTimeBlocks = (
    events: ProcessedEventBlock[] | null,
    filterSystemEvents = true
  ): TimeBlock[] => {
    if (!events) {
      return []
    }

    const filteredEvents = filterSystemEvents
      ? events.filter((event) => !SYSTEM_EVENT_NAMES.includes(event.name))
      : events

    return filteredEvents.map((eventBlock) => ({
      _id: eventBlock.originalEvent._id,
      startTime: eventBlock.startTime,
      endTime: eventBlock.endTime,
      durationMs: eventBlock.durationMs,
      name: eventBlock.name,
      description: eventBlock.title || '',
      url: eventBlock.url,
      categoryColor: eventBlock.categoryColor,
      categoryId: eventBlock.categoryId || undefined,
      type: eventBlock.originalEvent.type,
      originalEvent: eventBlock.originalEvent
    }))
  }

  const trackedTimeBlocks = useMemo(
    () => convertProcessedToTimeBlocks(trackedEvents, true),
    [trackedEvents]
  )
  const googleCalendarTimeBlocks = useMemo(
    () => convertProcessedToTimeBlocks(googleCalendarEvents, false),
    [googleCalendarEvents]
  )

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

  const handleZoomIn = () => {
    setHourHeight((prev) => Math.min(prev * 1.2, 32)) // max h-128
  }

  const handleZoomOut = () => {
    setHourHeight((prev) => Math.max(prev / 1.2, 2)) // min h-8
  }

  const formattedDate = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const dayOfWeek = startOfWeek.getDay() // Sunday = 0, Monday = 1, etc.
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday start
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)
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
    <div className="flex select-none flex-col h-full bg-card border-1 border border-border rounded-lg">
      <CalendarWidgetHeader
        handlePrev={handlePrev}
        width={width}
        formattedDate={formattedDate}
        selectedDate={selectedDate}
        handleNext={handleNext}
        canGoNext={canGoNext}
        handleZoomOut={handleZoomOut}
        handleZoomIn={handleZoomIn}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        weekViewMode={weekViewMode}
        setWeekViewMode={setWeekViewMode}
      />

      <div className="flex-grow overflow-auto" ref={scrollContainerRef}>
        {viewMode === 'week' ? (
          <WeekView
            processedEvents={trackedEvents || []}
            selectedDay={selectedDay}
            onDaySelect={onDaySelect}
            selectedDate={selectedDate}
            isDarkMode={isDarkMode}
            weekViewMode={weekViewMode}
          />
        ) : (
          <DayTimeline
            trackedTimeBlocks={trackedTimeBlocks}
            googleCalendarTimeBlocks={googleCalendarTimeBlocks}
            onHourSelect={onHourSelect}
            selectedHour={selectedHour}
            currentTime={currentTime}
            dayForEntries={selectedDate}
            isToday={isToday}
            isDarkMode={isDarkMode}
            hourHeight={hourHeight}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>
    </div>
  )
}

export default CalendarWidget
