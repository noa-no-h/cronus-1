import { REFRESH_EVENTS_INTERVAL_MS } from '@renderer/lib/constants'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { generateProcessedEventBlocks } from '../utils/eventProcessing'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget'
import TopActivityWidget from './TopActivityWidget'

export interface ProcessedEventBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string // event.ownerName
  title?: string // event.title
  url?: string
  categoryId?: string | null
  categoryName?: string
  categoryColor?: string
  isProductive?: boolean
  originalEvent: ActiveWindowEvent
}

export function DashboardView({ className }: { className?: string }) {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [calendarProcessedEvents, setCalendarProcessedEvents] = useState<
    ProcessedEventBlock[] | null
  >(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  const [startDateMs, setStartDateMs] = useState<number | null>(null)
  const [endDateMs, setEndDateMs] = useState<number | null>(null)

  const { data: categoriesData, isLoading: isLoadingCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const categories = categoriesData as Category[] | undefined

  useEffect(() => {
    const calculateTimestamps = () => {
      const localSelectedDate = new Date(selectedDate)
      let startOfPeriod: Date
      let endOfPeriod: Date
      if (viewMode === 'day') {
        startOfPeriod = new Date(localSelectedDate.setHours(0, 0, 0, 0))
        endOfPeriod = new Date(startOfPeriod)
        endOfPeriod.setDate(startOfPeriod.getDate() + 1)
      } else {
        const dayOfWeek = localSelectedDate.getDay()
        startOfPeriod = new Date(localSelectedDate)
        startOfPeriod.setDate(localSelectedDate.getDate() - dayOfWeek)
        startOfPeriod.setHours(0, 0, 0, 0)
        endOfPeriod = new Date(startOfPeriod)
        endOfPeriod.setDate(startOfPeriod.getDate() + 7)
      }
      setStartDateMs(startOfPeriod.getTime())
      setEndDateMs(endOfPeriod.getTime())
    }
    calculateTimestamps()
  }, [selectedDate, viewMode])

  const {
    data: eventsData,
    isLoading: isLoadingFetchedEvents,
    refetch: refetchEvents
  } = trpc.activeWindowEvents.getEventsForDateRange.useQuery(
    { token: token || '', startDateMs: startDateMs!, endDateMs: endDateMs! },
    {
      enabled: !!token && startDateMs !== null && endDateMs !== null,
      refetchOnWindowFocus: true,
      refetchInterval: REFRESH_EVENTS_INTERVAL_MS
    }
  )

  useEffect(() => {
    if (isLoadingFetchedEvents || isLoadingCategories) {
      setIsLoadingEvents(true)
      setCalendarProcessedEvents(null)
    } else if (eventsData && categories) {
      const blocks = generateProcessedEventBlocks(eventsData, categories)
      setCalendarProcessedEvents(blocks)
      setIsLoadingEvents(false)
    } else {
      setCalendarProcessedEvents(null)
      setIsLoadingEvents(false)
    }
  }, [eventsData, isLoadingFetchedEvents, categories, isLoadingCategories])

  const activityWidgetProcessedEvents = useMemo(() => {
    if (!calendarProcessedEvents) {
      return null
    }
    if (selectedHour !== null) {
      return calendarProcessedEvents.filter((block) => block.startTime.getHours() === selectedHour)
    }
    if (viewMode === 'week' && selectedDay) {
      return calendarProcessedEvents.filter(
        (block) => block.startTime.toDateString() === selectedDay.toDateString()
      )
    }
    return calendarProcessedEvents
  }, [calendarProcessedEvents, selectedHour, selectedDay, viewMode])

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    setSelectedHour(null)
    setSelectedDay(null)
  }

  const handleViewModeChange = (newMode: 'day' | 'week') => {
    setViewMode(newMode)
    setSelectedHour(null)
    setSelectedDay(null)
  }

  const handleHourSelect = useCallback((hour: number | null) => {
    setSelectedHour(hour)
    setSelectedDay(null)
  }, [])

  const handleDaySelect = useCallback((day: Date | null) => {
    setSelectedDay(day)
    setSelectedHour(null)
  }, [])

  return (
    <div
      className={`flex-1 flex flex-row overflow-hidden min-h-0 px-4 pb-4 space-x-4 ${className}`}
    >
      <div className="flex flex-col gap-4 w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <ActivitiesByCategoryWidget
          processedEvents={activityWidgetProcessedEvents}
          isLoadingEvents={isLoadingEvents}
          startDateMs={startDateMs}
          endDateMs={endDateMs}
          refetchEvents={refetchEvents}
          selectedHour={selectedHour}
          onHourSelect={handleHourSelect}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
        <TopActivityWidget
          processedEvents={activityWidgetProcessedEvents}
          isLoadingEvents={isLoadingEvents}
        />
      </div>
      <div className="w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <CalendarWidget
          selectedDate={selectedDate}
          processedEvents={calendarProcessedEvents}
          isLoadingEvents={isLoadingEvents}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
          selectedHour={selectedHour}
          onHourSelect={handleHourSelect}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
      </div>
    </div>
  )
}
