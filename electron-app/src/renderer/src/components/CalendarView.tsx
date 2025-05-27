import { useEffect, useState } from 'react'
import { ActiveWindowEvent } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'

export function CalendarView(): React.JSX.Element {
  const { user } = useAuth()
  const [events, setEvents] = useState<ActiveWindowEvent[]>([])

  const {
    data: todayEvents,
    isLoading,
    error
  } = trpc.activeWindowEvents.getTodayEvents.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  )

  useEffect(() => {
    if (todayEvents) {
      setEvents(todayEvents)
    }
  }, [todayEvents])

  // Generate hours for the day (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Group events by hour
  const eventsByHour = events.reduce(
    (acc, event) => {
      const eventDate = new Date(event.timestamp || 0)
      const hour = eventDate.getHours()
      if (!acc[hour]) acc[hour] = []
      acc[hour].push(event)
      return acc
    },
    {} as Record<number, ActiveWindowEvent[]>
  )

  // Get color based on app type
  const getEventColor = (event: ActiveWindowEvent): string => {
    if (event.type === 'browser') {
      return 'bg-blue-600'
    }
    // Different colors for different apps
    const appColors: Record<string, string> = {
      'Visual Studio Code': 'bg-purple-600',
      Terminal: 'bg-green-600',
      Slack: 'bg-pink-600',
      Zoom: 'bg-indigo-600'
    }
    return appColors[event.ownerName] || 'bg-gray-600'
  }

  // Format time display
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading events...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Error loading events: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto z-0">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-700 pb-2 mb-2">
          <h2 className="text-xl font-semibold text-white">Today's Activity</h2>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{events.length} events tracked today</p>
        </div>

        {/* Calendar Grid */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-800 min-h-[60px]">
              {/* Time Label */}
              <div className="w-20 flex-shrink-0 text-right pr-4 py-2 text-sm text-gray-500">
                {formatHour(hour)}
              </div>

              {/* Events for this hour */}
              <div className="flex-1 relative py-1">
                {eventsByHour[hour]?.map((event, idx) => {
                  const eventDate = new Date(event.timestamp || 0)
                  const minutes = eventDate.getMinutes()
                  const topOffset = (minutes / 60) * 100

                  return (
                    <div
                      key={`${event.timestamp}-${idx}`}
                      className={`absolute left-0 right-0 mx-1 px-2 py-1 rounded text-white text-sm ${getEventColor(event)} opacity-90`}
                      style={{
                        top: `${topOffset}%`,
                        minHeight: '24px'
                      }}
                    >
                      <div className="font-medium truncate">{event.ownerName}</div>
                      {event.title && (
                        <div className="text-xs opacity-80 truncate">{event.title}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
