import { useEffect, useState } from 'react'
import { ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget'
import TopActivityWidget from './TopActivityWidget'
import { Button } from './ui/button'

// Max duration for a single event interval.
const MAX_SINGLE_EVENT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export interface ProcessedEventBlock {
  startTime: Date
  endTime: Date
  durationMs: number
  name: string // event.ownerName
  title?: string // event.title
  url?: string
  categoryId?: string | null // event.categoryId - updated to allow null
  originalEvent: ActiveWindowEvent // Keep the original for flexibility
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

  useEffect(() => {
    const handleRecategorizeRequest = (categoryDetails?: Category) => {
      console.log('handleRecategorizeRequest in DashboardView.tsx', categoryDetails)
      // Future: navigate or open modal here
    }

    // Use the preloaded API
    if (window.api && window.api.onDisplayRecategorizePage) {
      console.log('DashboardView: Attaching listener via window.api.onDisplayRecategorizePage')
      const cleanup = window.api.onDisplayRecategorizePage(handleRecategorizeRequest)
      return cleanup // Return the cleanup function provided by the preload API
    } else {
      console.warn(
        'DashboardView: window.api.onDisplayRecategorizePage not available. Cannot listen for recategorize requests.'
      )
      return () => {} // Add a no-op cleanup function for this path
    }
  }, [])

  useEffect(() => {
    const calculateTimestamps = () => {
      const localSelectedDate = new Date(selectedDate)

      let startOfPeriod: Date
      let endOfPeriod: Date

      if (viewMode === 'day') {
        startOfPeriod = new Date(localSelectedDate.setHours(0, 0, 0, 0))
        endOfPeriod = new Date(localSelectedDate.setHours(23, 59, 59, 999))
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
    if (isLoadingFetchedEvents) {
      setIsLoadingEvents(true)
      setCalendarProcessedEvents(null)
      setActivityWidgetProcessedEvents(null)
    } else if (eventsData) {
      const sortedEvents = [...eventsData]
        .filter((event) => typeof event.timestamp === 'number')
        .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))

      let blocks: ProcessedEventBlock[] = []
      for (let i = 0; i < sortedEvents.length; i++) {
        const event = sortedEvents[i]
        const startTime = new Date(event.timestamp as number)
        let endTime: Date

        let durationMs: number
        if (i < sortedEvents.length - 1) {
          endTime = new Date(sortedEvents[i + 1].timestamp as number)
          durationMs = endTime.getTime() - startTime.getTime()
        } else {
          const now = new Date()
          const potentialEndTime = new Date(startTime.getTime() + MAX_SINGLE_EVENT_DURATION_MS)
          endTime = now < potentialEndTime ? now : potentialEndTime
          durationMs = endTime.getTime() - startTime.getTime()
        }

        durationMs = Math.max(0, Math.min(durationMs, MAX_SINGLE_EVENT_DURATION_MS))

        if (durationMs < 1000) {
          continue
        }

        blocks.push({
          startTime,
          endTime,
          durationMs,
          name: event.ownerName,
          title: event.title,
          url: event.url || undefined,
          categoryId: event.categoryId,
          originalEvent: event
        })
      }

      // This now sets the full list of events for the calendar
      setCalendarProcessedEvents(blocks)
      // Activity widget events will be derived from this and selectedHour in another useEffect
      // setIsLoadingEvents(false) // We'll set this after deriving activityWidgetProcessedEvents
    } else {
      // Reset both event states if no data
      setCalendarProcessedEvents(null)
      setActivityWidgetProcessedEvents(null)
      setIsLoadingEvents(false)
    }
  }, [eventsData, isLoadingFetchedEvents])

  // New useEffect to derive activityWidgetProcessedEvents based on calendarProcessedEvents and selectedHour
  useEffect(() => {
    if (!calendarProcessedEvents) {
      setActivityWidgetProcessedEvents(null)
      setIsLoadingEvents(isLoadingFetchedEvents) // Reflect underlying loading state
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
    setIsLoadingEvents(false) // Data for widgets is now ready
  }, [calendarProcessedEvents, selectedHour, isLoadingFetchedEvents])

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    setSelectedHour(null)
  }

  const handleViewModeChange = (newMode: 'day' | 'week') => {
    setViewMode(newMode)
    setSelectedHour(null)
  }

  const handleHourSelect = (hour: number | null) => {
    setSelectedHour(hour)
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden min-h-0 px-4 pb-4 space-x-4">
      <div className="flex flex-col gap-4 w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        {selectedHour !== null && (
          <div className="flex justify-between items-center p-2 bg-muted rounded-md">
            <span className="text-sm font-medium">
              Displaying activities for {selectedHour.toString().padStart(2, '0')}:00 -{' '}
              {(selectedHour + 1).toString().padStart(2, '0')}:00
            </span>
            <Button variant="outline" size="sm" onClick={() => handleHourSelect(null)}>
              Show Full Day
            </Button>
          </div>
        )}
        <ActivitiesByCategoryWidget
          processedEvents={activityWidgetProcessedEvents}
          isLoadingEvents={isLoadingEvents}
          startDateMs={startDateMs}
          endDateMs={endDateMs}
          refetchEvents={refetchEvents}
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
