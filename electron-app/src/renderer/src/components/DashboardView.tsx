import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { REFRESH_EVENTS_INTERVAL_MS } from '../lib/constants'
import { generateProcessedEventBlocks } from '../utils/eventProcessing'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivityList/ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget/CalendarWidget'

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
  source?: 'tracked' | 'calendar'
}

const convertCalendarEventToBlock = (event: any): ProcessedEventBlock | null => {
  // Only include events with specific times (not all-day events)
  if (!event.start.dateTime || !event.end.dateTime) {
    return null
  }

  const startTime = new Date(event.start.dateTime)
  const endTime = new Date(event.end.dateTime)

  return {
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    name: 'Google Calendar', // This will show as the "app" name
    title: event.summary, // Meeting title
    url: undefined,
    categoryId: null, // Not categorized initially
    categoryName: 'Calendar Events',
    categoryColor: '#3B82F6', // Blue color for calendar events
    isProductive: undefined,
    originalEvent: {
      _id: event.id,
      ownerName: 'Google Calendar',
      title: event.summary,
      url: undefined,
      timestamp: startTime.getTime(),
      categoryId: null,
      type: 'calendar',
      ...event
    } as any,
    source: 'calendar'
  }
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

  useEffect(() => {
    const calculateDateRange = () => {
      if (viewMode === 'day') {
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        setStartDateMs(startOfDay.getTime())
        setEndDateMs(endOfDay.getTime())
      } else {
        // Week view - Monday to Sunday
        const startOfWeek = new Date(selectedDate)
        const dayOfWeek = startOfWeek.getDay() // Sunday = 0, Monday = 1, etc.
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday start
        startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        setStartDateMs(startOfWeek.getTime())
        setEndDateMs(endOfWeek.getTime())
      }
    }

    calculateDateRange()
  }, [selectedDate, viewMode])

  const { data: categoriesData, isLoading: isLoadingCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const categories = categoriesData as Category[] | undefined

  const { data: calendarEventsData, isLoading: isLoadingCalendarEvents } =
    trpc.calendar.getEvents.useQuery(
      {
        token: token || '',
        startDate: startDateMs ? new Date(startDateMs).toISOString() : '',
        endDate: endDateMs ? new Date(endDateMs).toISOString() : ''
      },
      {
        enabled: !!token && startDateMs !== null && endDateMs !== null,
        refetchOnWindowFocus: true,
        refetchInterval: REFRESH_EVENTS_INTERVAL_MS
      }
    )

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
    // console.log('🔍 Processing events:', {
    //   isLoadingFetchedEvents,
    //   isLoadingCategories,
    //   isLoadingCalendarEvents,
    //   eventsDataLength: eventsData?.length || 0,
    //   categoriesLength: categories?.length || 0,
    //   calendarEventsLength: calendarEventsData?.length || 0
    // })

    // console.log('🐛 Debug - eventsData:', eventsData)
    // console.log('🐛 Debug - startDateMs/endDateMs:', { startDateMs, endDateMs })
    // console.log('🐛 Debug - token:', token)

    if (isLoadingFetchedEvents || isLoadingCategories || isLoadingCalendarEvents) {
      setIsLoadingEvents(true)
      setCalendarProcessedEvents(null)
    } else if (eventsData && categories) {
      // Process tracked events (existing logic)
      const trackedBlocks = generateProcessedEventBlocks(eventsData, categories)
      // console.log('📊 Tracked blocks:', trackedBlocks.length)

      const calendarEvents = calendarEventsData || []

      // Process calendar events
      const calendarBlocks: ProcessedEventBlock[] = calendarEvents.length
        ? calendarEvents
            .map(convertCalendarEventToBlock)
            .filter((block): block is ProcessedEventBlock => block !== null)
        : []
      // console.log('📅 Calendar blocks:', calendarBlocks.length)

      // Merge tracked and calendar events, sorted by start time
      const allBlocks = [...trackedBlocks, ...calendarBlocks].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      )
      // console.log('🔄 Total merged blocks:', allBlocks.length)

      setCalendarProcessedEvents(allBlocks)
      setIsLoadingEvents(false)
    } else {
      setCalendarProcessedEvents(null)
      setIsLoadingEvents(false)
    }
  }, [
    eventsData,
    isLoadingFetchedEvents,
    categories,
    isLoadingCategories,
    calendarEventsData,
    isLoadingCalendarEvents
  ])

  const activityWidgetProcessedEvents = useMemo(() => {
    if (!calendarProcessedEvents) {
      return null
    }

    // Filter out calendar events from the activity widget
    const nonCalendarEvents = calendarProcessedEvents.filter((block) => block.source !== 'calendar')

    if (selectedHour !== null) {
      return nonCalendarEvents.filter((block) => block.startTime.getHours() === selectedHour)
    }
    if (viewMode === 'week' && selectedDay) {
      return nonCalendarEvents.filter(
        (block) => block.startTime.toDateString() === selectedDay.toDateString()
      )
    }
    return nonCalendarEvents
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
      className={`flex-1 flex flex-row overflow-hidden min-h-0 px-2 pb-2 space-x-2 ${className}`}
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
        {/* <TopActivityWidget
          processedEvents={activityWidgetProcessedEvents}
          isLoadingEvents={isLoadingEvents}
        /> */}
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
