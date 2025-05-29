import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import Spinner from './ui/Spinner'

interface AppUsage {
  name: string
  durationMs: number
  percentage?: number
}

// Helper function to format milliseconds to a readable string
const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  if (totalSeconds > 0) {
    return `${totalSeconds}s`
  }
  return '0m'
}

const TopActivityWidget: React.FC = () => {
  const { user } = useAuth()
  const [topApps, setTopApps] = useState<AppUsage[]>([])
  const [totalTrackedTimeMs, setTotalTrackedTimeMs] = useState(0)

  const {
    data: todayRawEvents,
    isLoading: isLoadingRawEvents,
    error: rawEventsError
  } = trpc.activeWindowEvents.getTodayEvents.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id, refetchInterval: 60000 }
  )

  useEffect(() => {
    if (!todayRawEvents || todayRawEvents.length === 0) {
      setTopApps([])
      setTotalTrackedTimeMs(0)
      return
    }

    const validEvents = todayRawEvents.filter((event) => typeof event.timestamp === 'number')

    if (validEvents.length === 0) {
      setTopApps([])
      setTotalTrackedTimeMs(0)
      return
    }

    const sortedEvents = [...validEvents].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    const appDurations: Record<string, number> = {}
    let currentTotalTrackedMs = 0

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i]
      let durationMs = 0
      const currentTimestamp = currentEvent.timestamp || 0

      if (i < sortedEvents.length - 1) {
        const nextTimestamp = sortedEvents[i + 1].timestamp || 0
        durationMs = nextTimestamp - currentTimestamp
      } else {
        durationMs = Math.min(Date.now() - currentTimestamp, 15 * 60 * 1000)
      }
      durationMs = Math.max(0, durationMs)
      durationMs = Math.min(durationMs, 15 * 60 * 1000)

      appDurations[currentEvent.ownerName] =
        (appDurations[currentEvent.ownerName] || 0) + durationMs
      currentTotalTrackedMs += durationMs
    }

    setTotalTrackedTimeMs(currentTotalTrackedMs)

    const aggregatedApps = Object.entries(appDurations)
      .map(([name, durationMs]) => ({ name, durationMs }))
      .sort((a, b) => b.durationMs - a.durationMs)

    const top3 = aggregatedApps.slice(0, 3)

    const maxDurationOfTop3 = top3.length > 0 ? top3[0].durationMs : 0

    setTopApps(
      top3.map((app) => ({
        ...app,
        percentage:
          maxDurationOfTop3 > 0 ? Math.round((app.durationMs / maxDurationOfTop3) * 100) : 0
      }))
    )
  }, [todayRawEvents])

  const renderContent = (): React.ReactNode => {
    if (isLoadingRawEvents && topApps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-32">
          <Spinner />
          <p className="mt-2 text-sm text-gray-400">Loading activity...</p>
        </div>
      )
    }

    if (rawEventsError) {
      return <p className="text-sm text-red-400">Error loading data.</p>
    }

    if (topApps.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          No significant activity tracked yet today to show top apps.
        </p>
      )
    }

    return (
      <ul className="space-y-3">
        {topApps.map((app, index) => (
          <motion.li
            key={app.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-200 truncate" title={app.name}>
                {app.name}
              </span>
              <span className="text-sm font-normal text-gray-300">
                {formatDuration(app.durationMs)}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500  to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${app.percentage || 0}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
              />
            </div>
          </motion.li>
        ))}
      </ul>
    )
  }

  return (
    <div className="p-4 bg-gray-800 rounded-xl shadow-lg">
      <h3 className="text-md font-semibold text-gray-100 mb-3">Today&apos;s Focus Zones</h3>
      {renderContent()}
      {totalTrackedTimeMs > 0 && topApps.length > 0 && (
        <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
          Total actively tracked time today: {formatDuration(totalTrackedTimeMs)}
        </p>
      )}
    </div>
  )
}

export default TopActivityWidget
