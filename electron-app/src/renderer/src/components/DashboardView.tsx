import { useEffect, useState } from 'react'
import { ActiveWindowEvent } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import ActivitiesByCategoryWidget from './ActivitiesByCategoryWidget'
import CalendarWidget from './CalendarWidget'

export function DashboardView() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [activityEvents, setActivityEvents] = useState<ActiveWindowEvent[] | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const [startDateMs, setStartDateMs] = useState<number | null>(null)
  const [endDateMs, setEndDateMs] = useState<number | null>(null)

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

  const { data: eventsData, isLoading: isLoadingFetchedEvents } =
    trpc.activeWindowEvents.getEventsForDateRange.useQuery(
      { token: token || '', startDateMs: startDateMs!, endDateMs: endDateMs! },
      {
        enabled: !!token && startDateMs !== null && endDateMs !== null,
        refetchOnWindowFocus: false
      }
    )

  useEffect(() => {
    if (isLoadingFetchedEvents) {
      setIsLoadingEvents(true)
      setActivityEvents(null)
    } else if (eventsData) {
      setActivityEvents(eventsData as ActiveWindowEvent[])
      setIsLoadingEvents(false)
    } else {
      setActivityEvents(null)
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
          activityEvents={activityEvents}
          isLoadingEvents={isLoadingEvents}
        />
      </div>
      <div className="w-1/2 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
        <CalendarWidget
          selectedDate={selectedDate}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
        />
      </div>
    </div>
  )
}
