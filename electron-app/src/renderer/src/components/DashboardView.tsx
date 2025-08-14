import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { useWindowFocus } from '../hooks/useWindowFocus'
import { REFRESH_EVENTS_INTERVAL_MS } from '../lib/constants'
import { generateProcessedEventBlocks } from '../utils/eventProcessing'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivityList/ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget/CalendarWidget'

export interface ProcessedEventBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  title?: string
  url?: string
  categoryId?: string | null
  categoryName?: string
  categoryColor?: string
  isProductive?: boolean
  originalEvent: ActiveWindowEvent
  source?: 'tracked' | 'calendar'
}

interface CalendarEvent {
  id: string
  summary: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  [key: string]: unknown
}

const convertCalendarEventToBlock = (event: CalendarEvent): ProcessedEventBlock | null => {
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
      userId: 'calendar',
      ownerName: 'Google Calendar',
      title: event.summary,
      url: undefined,
      timestamp: startTime.getTime(),
      categoryId: null,
      type: 'calendar',
      ...event
    } as ActiveWindowEvent,
    source: 'calendar'
  }
}

export function DashboardView({ className }: { className?: string }): ReactElement {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [weekViewMode, setWeekViewMode] = useState<'stacked' | 'grouped'>('grouped')
  const [googleCalendarProcessedEvents, setGoogleCalendarProcessedEvents] = useState<
    ProcessedEventBlock[] | null
  >(null)
  const [trackedProcessedEvents, setTrackedProcessedEvents] = useState<
    ProcessedEventBlock[] | null
  >(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  const [startDateMs, setStartDateMs] = useState<number | null>(null)
  const [endDateMs, setEndDateMs] = useState<number | null>(null)

  const isWindowFocused = useWindowFocus()

  // Adaptive polling intervals based on window focus
  const getPollingInterval = (baseInterval: number): number => {
    if (!isWindowFocused) {
      // When unfocused, reduce frequency to 2-3 minutes
      return Math.min(baseInterval * 4, 180000) // Max 3 minutes
    }
    return baseInterval
  }

  useEffect(() => {
    const calculateDateRange = (): void => {
      if (viewMode === 'day') {
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        setStartDateMs(startOfDay.getTime())
        setEndDateMs(endOfDay.getTime())
      } else {
        // Week view - get data for the 4 weeks ending with the selected date's week
        const endOfWeek = new Date(selectedDate)
        // Adjust to the end of the week (Sunday)
        endOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 7)
        endOfWeek.setHours(23, 59, 59, 999)

        const startOfFourWeeks = new Date(selectedDate)
        // Go back to the Monday of the week 3 weeks prior
        startOfFourWeeks.setDate(selectedDate.getDate() - selectedDate.getDay() - 3 * 7 + 1)
        startOfFourWeeks.setHours(0, 0, 0, 0)

        console.log('Date range for fetching:', {
          start: startOfFourWeeks.toISOString(),
          end: endOfWeek.toISOString(),
          viewMode,
          selectedDate: selectedDate.toISOString()
        })

        setStartDateMs(startOfFourWeeks.getTime())
        setEndDateMs(endOfWeek.getTime())
      }
    }

    calculateDateRange()
  }, [selectedDate, viewMode])

  const [activityWidgetStartDateMs, activityWidgetEndDateMs] = useMemo(() => {
    // If an hour is selected, the context is that specific hour.
    if (selectedHour !== null) {
      // In day view, or week view where no specific day is picked, use selectedDate
      const baseDate = selectedDay || selectedDate
      const startOfHour = new Date(baseDate)
      startOfHour.setHours(selectedHour, 0, 0, 0)
      const endOfHour = new Date(baseDate)
      endOfHour.setHours(selectedHour, 59, 59, 999)

      return [startOfHour.getTime(), endOfHour.getTime()]
    }

    // If a specific day is selected in week view (and no hour is selected)
    if (viewMode === 'week' && selectedDay) {
      const startOfDay = new Date(selectedDay)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDay)
      endOfDay.setHours(23, 59, 59, 999)
      return [startOfDay.getTime(), endOfDay.getTime()]
    }

    // Default: the full range for the current view (day or week)
    return [startDateMs, endDateMs]
  }, [startDateMs, endDateMs, selectedHour, selectedDay, viewMode, selectedDate])

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
        refetchInterval: getPollingInterval(REFRESH_EVENTS_INTERVAL_MS)
      }
    )

  // TODO: dont re-fefetch every 30 seconds all events for day
  const {
    data: activeWindowEventsData,
    isLoading: isLoadingFetchedEvents,
    refetch: refetchEvents
  } = trpc.activeWindowEvents.getEventsForDateRange.useQuery(
    { token: token || '', startDateMs: startDateMs!, endDateMs: endDateMs! },
    {
      enabled: !!token && startDateMs !== null && endDateMs !== null,
      refetchOnWindowFocus: true,
      refetchInterval: getPollingInterval(REFRESH_EVENTS_INTERVAL_MS)
    }
  )

  useEffect(() => {
    if (isLoadingFetchedEvents || isLoadingCategories || isLoadingCalendarEvents) {
      setIsLoadingEvents(true)
      setGoogleCalendarProcessedEvents(null)
      setTrackedProcessedEvents(null)
    } else if (activeWindowEventsData && categories) {
      // Process tracked events (existing logic)
      const eventsWithParsedDates = activeWindowEventsData.map((event) => ({
        ...event,
        lastCategorizationAt: event.lastCategorizationAt
          ? new Date(event.lastCategorizationAt)
          : undefined
      }))
      const canonicalBlocks = generateProcessedEventBlocks(eventsWithParsedDates, categories)

      const calendarEvents = calendarEventsData || []

      // Process calendar events
      const googleCalendarBlocks: ProcessedEventBlock[] = calendarEvents.length
        ? calendarEvents
            .map(convertCalendarEventToBlock)
            .filter((block): block is ProcessedEventBlock => block !== null)
        : []

      setTrackedProcessedEvents(canonicalBlocks)
      setGoogleCalendarProcessedEvents(googleCalendarBlocks)
      setIsLoadingEvents(false)
    } else {
      setTrackedProcessedEvents(null)
      setGoogleCalendarProcessedEvents(null)
      setIsLoadingEvents(false)
    }
  }, [
    activeWindowEventsData,
    isLoadingFetchedEvents,
    categories,
    isLoadingCategories,
    calendarEventsData,
    isLoadingCalendarEvents
  ])

  const activityWidgetProcessedEvents = useMemo(() => {
    if (!trackedProcessedEvents) {
      return null
    }

    if (selectedHour !== null) {
      return trackedProcessedEvents.filter((block) => block.startTime.getHours() === selectedHour)
    }
    if (viewMode === 'week' && selectedDay) {
      return trackedProcessedEvents.filter(
        (block) => block.startTime.toDateString() === selectedDay.toDateString()
      )
    }
    return trackedProcessedEvents
  }, [trackedProcessedEvents, selectedHour, selectedDay, viewMode])

  const handleDateChange = (newDate: Date): void => {
    setSelectedDate(newDate)
    setSelectedHour(null)
    setSelectedDay(null)
  }

  const handleViewModeChange = (newMode: 'day' | 'week'): void => {
    setViewMode(newMode)
    setSelectedHour(null)
    setSelectedDay(null)
  }

  const handleHourSelect = (hour: number | null): void => {
    setSelectedHour(hour)
  }

  const handleDaySelect = (day: Date | null): void => {
    setSelectedDay(day)
  }

  const handleDaySelectAndSwitch = (day: Date | null): void => {
    if (day) {
      setSelectedDate(day)
      setViewMode('day')
      setSelectedHour(null) // Reset hour selection
      setSelectedDay(null) // Reset day selection in week context
    } else {
      setSelectedDay(null)
    }
  }

  // useEffect(() => {
  //   console.log('🔍 Dashboard polling interval:', {
  //     isWindowFocused,
  //     baseInterval: REFRESH_EVENTS_INTERVAL_MS,
  //     actualInterval: getPollingInterval(REFRESH_EVENTS_INTERVAL_MS)
  //   })
  // }, [isWindowFocused])

  return (
    <div
      className={`flex-1 flex flex-row overflow-hidden min-h-0 px-2 pb-2 space-x-2 ${className}`}
    >
      {viewMode === 'day' && (
        <div className="flex flex-col gap-4 w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
          <ActivitiesByCategoryWidget
            processedEvents={activityWidgetProcessedEvents}
            isLoadingEvents={isLoadingEvents}
            startDateMs={activityWidgetStartDateMs}
            endDateMs={activityWidgetEndDateMs}
            refetchEvents={refetchEvents}
            selectedHour={selectedHour}
            onHourSelect={handleHourSelect}
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
          />
        </div>
      )}
      <div
        className={
          viewMode === 'week'
            ? 'w-full overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500'
            : 'w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500'
        }
      >
        <CalendarWidget
          selectedDate={selectedDate}
          trackedEvents={trackedProcessedEvents}
          googleCalendarEvents={googleCalendarProcessedEvents}
          isLoadingEvents={isLoadingEvents}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
          selectedHour={selectedHour}
          onHourSelect={handleHourSelect}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelectAndSwitch}
          weekViewMode={weekViewMode}
          onWeekViewModeChange={setWeekViewMode}
          isLoading={isLoadingEvents}
        />
      </div>
    </div>
  )
}
