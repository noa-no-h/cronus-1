import { useEffect, useState } from 'react'
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
  categoryId?: string | null // event.categoryId - updated to allow null
  originalEvent: ActiveWindowEvent // Keep the original for flexibility
}

export function DashboardView() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [processedEventBlocks, setProcessedEventBlocks] = useState<ProcessedEventBlock[] | null>(
    null
  )
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

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
      setProcessedEventBlocks(null)
    } else if (eventsData) {
      const sortedEvents = [...eventsData]
        .filter((event) => typeof event.timestamp === 'number')
        .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))

      const blocks: ProcessedEventBlock[] = []
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
      setProcessedEventBlocks(blocks)
      setIsLoadingEvents(false)
    } else {
      setProcessedEventBlocks(null)
      setIsLoadingEvents(false)
    }
  }, [eventsData, isLoadingFetchedEvents])

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
  }

  const handleViewModeChange = (newMode: 'day' | 'week') => {
    setViewMode(newMode)
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden min-h-0 px-4 pb-4 space-x-4">
      <div className="flex flex-col gap-4 w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <ActivitiesByCategoryWidget
          processedEvents={processedEventBlocks}
          isLoadingEvents={isLoadingEvents}
          startDateMs={startDateMs}
          endDateMs={endDateMs}
          refetchEvents={refetchEvents}
        />
        <TopActivityWidget
          processedEvents={processedEventBlocks}
          isLoadingEvents={isLoadingEvents}
        />
      </div>
      <div className="w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <CalendarWidget
          selectedDate={selectedDate}
          processedEvents={processedEventBlocks}
          isLoadingEvents={isLoadingEvents}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
        />
      </div>
    </div>
  )
}
