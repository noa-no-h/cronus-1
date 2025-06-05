import { useCallback, useEffect, useState } from 'react'
import { ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget'
import TopActivityWidget from './TopActivityWidget'

// Max duration for a single event interval.
const MAX_SINGLE_EVENT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export interface ProcessedEventBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string // event.ownerName
  title?: string // event.title
  url?: string
  categoryId?: string | null
  categoryColor?: string
  originalEvent: ActiveWindowEvent
}

export function DashboardView() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [activityWidgetProcessedEvents, setActivityWidgetProcessedEvents] = useState<
    ProcessedEventBlock[] | null
  >(null)
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
      refetchOnWindowFocus: false
    }
  )

  useEffect(() => {
    if (isLoadingFetchedEvents || isLoadingCategories) {
      setIsLoadingEvents(true)
      setCalendarProcessedEvents(null)
      setActivityWidgetProcessedEvents(null)
    } else if (eventsData && categories) {
      const chronologicallySortedEvents = [...eventsData]
        .filter((event) => typeof event.timestamp === 'number')
        .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))

      const categoriesMap = new Map<string, Category>(categories.map((cat) => [cat._id, cat]))
      let blocks: ProcessedEventBlock[] = []

      // Iterate through the events to create display blocks with accurate start and end times
      for (let i = 0; i < chronologicallySortedEvents.length; i++) {
        const event = chronologicallySortedEvents[i]
        const eventStartTime = new Date(event.timestamp as number)
        let eventEndTime: Date
        let eventDurationMs: number

        // Calculate duration based on the time until the next event.
        if (i < chronologicallySortedEvents.length - 1) {
          const nextEventTime = new Date(
            chronologicallySortedEvents[i + 1].timestamp as number
          ).getTime()
          eventDurationMs = nextEventTime - eventStartTime.getTime()

          // Cap the duration of a single event to avoid extremely long blocks.
          if (eventDurationMs > MAX_SINGLE_EVENT_DURATION_MS) {
            eventDurationMs = MAX_SINGLE_EVENT_DURATION_MS
          }
          // The end time is the start time plus the (potentially capped) duration.
          eventEndTime = new Date(eventStartTime.getTime() + eventDurationMs)
        } else {
          // For the last event, its duration is from its start time until now, capped.
          const now = new Date()
          const potentialEndTime = new Date(eventStartTime.getTime() + MAX_SINGLE_EVENT_DURATION_MS)
          eventEndTime = now < potentialEndTime ? now : potentialEndTime
          eventDurationMs = eventEndTime.getTime() - eventStartTime.getTime()
        }

        // Ignore very short events (less than 1s) to reduce noise.
        if (eventDurationMs < 1000) {
          continue
        }
        const category = event.categoryId ? categoriesMap.get(event.categoryId) : undefined
        blocks.push({
          startTime: eventStartTime,
          endTime: eventEndTime,
          durationMs: eventDurationMs,
          name: event.ownerName,
          title: event.title,
          url: event.url || undefined,
          categoryId: event.categoryId,
          categoryColor: category?.color,
          originalEvent: event
        })
      }
      setCalendarProcessedEvents(blocks)
    } else {
      setCalendarProcessedEvents(null)
      setActivityWidgetProcessedEvents(null)
      setIsLoadingEvents(false)
    }
  }, [eventsData, isLoadingFetchedEvents, categories, isLoadingCategories])

  useEffect(() => {
    if (!calendarProcessedEvents) {
      setActivityWidgetProcessedEvents(null)
      setIsLoadingEvents(isLoadingFetchedEvents)
      return
    }
    if (selectedHour !== null) {
      const hourlyFilteredBlocks = calendarProcessedEvents.filter(
        (block) => block.startTime.getHours() === selectedHour
      )
      setActivityWidgetProcessedEvents(hourlyFilteredBlocks)
    } else {
      setActivityWidgetProcessedEvents(calendarProcessedEvents)
    }
    setIsLoadingEvents(false)
  }, [calendarProcessedEvents, selectedHour, isLoadingFetchedEvents])

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    setSelectedHour(null)
  }

  const handleViewModeChange = (newMode: 'day' | 'week') => {
    setViewMode(newMode)
    setSelectedHour(null)
  }

  const handleHourSelect = useCallback((hour: number | null) => {
    setSelectedHour(hour)
  }, [])

  return (
    <div className="flex-1 flex flex-row overflow-hidden min-h-0 px-4 pb-4 space-x-4">
      <div className="flex flex-col gap-4 w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <ActivitiesByCategoryWidget
          processedEvents={activityWidgetProcessedEvents}
          isLoadingEvents={isLoadingEvents}
          startDateMs={startDateMs}
          endDateMs={endDateMs}
          refetchEvents={refetchEvents}
          selectedHour={selectedHour}
          onHourSelect={handleHourSelect}
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
        />
      </div>
    </div>
  )
}
