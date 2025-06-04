import clsx from 'clsx'
import React, { JSX, useEffect, useMemo } from 'react'
import { ActiveWindowDetails, ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Card, CardContent } from './card'

const MAX_GAP_BETWEEN_EVENTS_MS = 5 * 60 * 1000

interface DistractionCategorizationResultProps {
  activeWindow: ActiveWindowDetails | null
}

// Props comparison can be simplified or removed if activeWindow prop changes don't directly trigger new data fetching logic
// For now, let's keep it, but its role might change.
const arePropsEqual = (
  prevProps: DistractionCategorizationResultProps,
  nextProps: DistractionCategorizationResultProps
): boolean => {
  if (!prevProps.activeWindow && !nextProps.activeWindow) return true
  if (!prevProps.activeWindow || !nextProps.activeWindow) return false
  const p = prevProps.activeWindow
  const n = nextProps.activeWindow
  return (
    p.ownerName === n.ownerName &&
    p.title === n.title &&
    p.url === n.url &&
    p.content === n.content && // Assuming content changes are also significant for display
    p.type === n.type &&
    p.browser === n.browser
  )
}

const DistractionCategorizationResult = ({
  activeWindow
}: DistractionCategorizationResultProps): JSX.Element | null => {
  const { token } = useAuth()

  const { data: latestEvent, isLoading: isLoadingLatestEvent } =
    trpc.activeWindowEvents.getLatestEvent.useQuery(
      { token: token || '' },
      { enabled: !!token && typeof token === 'string' && token.length > 0, refetchInterval: 2500 }
    )

  const categoryId = latestEvent?.categoryId

  const { data: categoryDetails, isLoading: isLoadingCategory } =
    trpc.category.getCategoryById.useQuery(
      { token: token || '', categoryId: categoryId || '' },
      {
        enabled:
          !!token &&
          typeof token === 'string' &&
          token.length > 0 &&
          !!categoryId &&
          categoryId !== ''
      }
    )

  const { data: userCategories, isLoading: isLoadingUserCategories } =
    trpc.category.getCategories.useQuery(
      { token: token || '' },
      { enabled: !!token && typeof token === 'string' && token.length > 0 }
    )

  const [currentDayStartDateMs, setCurrentDayStartDateMs] = React.useState<number | null>(null)
  const [currentDayEndDateMs, setCurrentDayEndDateMs] = React.useState<number | null>(null)

  React.useEffect(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
    setCurrentDayStartDateMs(startOfToday.getTime())
    setCurrentDayEndDateMs(endOfToday.getTime())
  }, [])

  const { data: todayEvents, isLoading: isLoadingTodayEvents } =
    trpc.activeWindowEvents.getEventsForDateRange.useQuery(
      {
        token: token || '',
        startDateMs: currentDayStartDateMs!,
        endDateMs: currentDayEndDateMs!
      },
      {
        enabled:
          !!token &&
          typeof token === 'string' &&
          token.length > 0 &&
          currentDayStartDateMs !== null &&
          currentDayEndDateMs !== null,
        refetchInterval: 30000
      }
    )

  useEffect(() => {
    if (!latestEvent || !userCategories || !todayEvents || !window.electron?.ipcRenderer) {
      return
    }

    let latestStatus: 'productive' | 'unproductive' | 'maybe' = 'maybe'
    let categoryDetailsForFloatingWindow: Category | undefined = undefined

    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === true) latestStatus = 'productive'
      else if (fullCategoryDetails.isProductive === false) latestStatus = 'unproductive'
      categoryDetailsForFloatingWindow = fullCategoryDetails
    } else if (categoryDetails === null) {
      latestStatus = 'maybe'
      // No specific category to send for 'maybe' if it's due to category not found
      // Or we could send a generic "Uncategorized" message if desired
    }

    let dailyProductiveMs = 0
    let dailyUnproductiveMs = 0

    const categoriesMap = new Map((userCategories as Category[]).map((cat) => [cat._id, cat]))

    const validEvents = todayEvents.filter(
      (event) => typeof event.timestamp === 'number'
    ) as ActiveWindowEvent[]
    const sortedEvents = [...validEvents].sort(
      (a, b) => (a.timestamp as number) - (b.timestamp as number)
    )

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i]
      const currentTimestamp = currentEvent.timestamp as number

      // Skip system sleep/wake/lock/unlock events for direct productivity calculation
      // Their timestamps are used to delimit the duration of other events.
      if (
        currentEvent.ownerName === 'System Sleep' ||
        currentEvent.ownerName === 'System Wake' ||
        currentEvent.ownerName === 'System Lock' ||
        currentEvent.ownerName === 'System Unlock'
      ) {
        continue
      }

      const eventCategory = currentEvent.categoryId
        ? categoriesMap.get(currentEvent.categoryId)
        : null

      if (!eventCategory) {
        // If no category, this event's time is not tracked
        continue
      }

      let durationMs = 0

      if (i < sortedEvents.length - 1) {
        const nextEvent = sortedEvents[i + 1]
        const nextEventTimestamp = nextEvent.timestamp as number

        // Calculate duration until this nextEvent
        durationMs = nextEventTimestamp - currentTimestamp

        // NEW: First check for large gaps between events
        if (durationMs > MAX_GAP_BETWEEN_EVENTS_MS) {
          durationMs = MAX_GAP_BETWEEN_EVENTS_MS
        }

        // Then handle system events as before
        if (nextEvent.ownerName === 'System Sleep' || nextEvent.ownerName === 'System Lock') {
          // Duration for currentEvent is already calculated and capped above
          if (durationMs > 0) {
            if (eventCategory.isProductive) {
              dailyProductiveMs += durationMs
            } else {
              dailyUnproductiveMs += durationMs
            }
          }

          // Find the corresponding wake/unlock event to advance the loop.
          const resumeEventName =
            nextEvent.ownerName === 'System Sleep' ? 'System Wake' : 'System Unlock'
          const resumeIndex = sortedEvents.findIndex(
            (e, idx) => idx > i + 1 && e.ownerName === resumeEventName
          )

          if (resumeIndex !== -1) {
            i = resumeIndex - 1
          } else {
            break
          }
          continue
        }
      } else {
        // This is the last event in sortedEvents. Calculate duration until current time.
        durationMs = Date.now() - currentTimestamp
        // Also cap this duration
        if (durationMs > MAX_GAP_BETWEEN_EVENTS_MS) {
          durationMs = MAX_GAP_BETWEEN_EVENTS_MS
        }
      }

      // Common accumulation logic for:
      // 1. Event followed by a non-sleep/lock event.
      // 2. The last event of the day.
      durationMs = Math.max(0, Math.min(durationMs, 5 * 60 * 1000)) // Cap and ensure non-negative
      if (durationMs > 0) {
        if (eventCategory.isProductive) {
          dailyProductiveMs += durationMs
        } else {
          dailyUnproductiveMs += durationMs
        }
      }
    }

    window.electron.ipcRenderer.send('update-floating-window-status', {
      latestStatus,
      dailyProductiveMs,
      dailyUnproductiveMs,
      categoryDetails: categoryDetailsForFloatingWindow
    })
  }, [latestEvent, categoryDetails, userCategories, todayEvents, token])

  const getStatusText = (): string => {
    if (!latestEvent && !activeWindow) return 'Waiting for activity...'
    if (!latestEvent && activeWindow) return 'Processing...'
    if (!categoryId) return 'Uncategorized'
    if (isLoadingCategory || isLoadingUserCategories) return 'Loading category...'

    if (!categoryDetails || typeof categoryDetails !== 'object' || !('_id' in categoryDetails)) {
      return categoryDetails === null ? 'Category not found' : 'Category unavailable'
    }

    const fullCategoryDetails = categoryDetails as Category
    if (fullCategoryDetails.isProductive === true) return `${fullCategoryDetails.name}: Productive`
    if (fullCategoryDetails.isProductive === false)
      return `${fullCategoryDetails.name}: Distracting`
    return `${fullCategoryDetails.name}: Neutral`
  }

  useEffect(() => {
    if (
      categoryDetails &&
      typeof categoryDetails === 'object' &&
      '_id' in categoryDetails &&
      activeWindow
    ) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === false) {
        const appName = activeWindow.ownerName || 'Current Application'
        const statusText = getStatusText()
        const notificationTitle = `Focus Alert: ${appName}`
        const notificationBody = `${statusText}`

        if (window.Notification) {
          new window.Notification(notificationTitle, { body: notificationBody }).onclick = () => {
            console.log('Notification clicked')
          }
        }
      }
    }
  }, [categoryDetails, activeWindow])

  const displayWindowInfo = useMemo(() => {
    const dw = latestEvent || activeWindow
    if (!dw) return { ownerName: 'No active application', title: '' }

    // Check for system events
    switch (dw.ownerName) {
      case 'System Sleep':
        return {
          ownerName: '💤 System Inactive',
          title: 'Computer was sleeping'
        }
      case 'System Wake':
        return {
          ownerName: '⏰ System Active',
          title: 'Computer woke from sleep'
        }
      case 'System Lock':
        return {
          ownerName: '🔒 Screen Locked',
          title: 'Screen was locked'
        }
      case 'System Unlock':
        return {
          ownerName: '🔓 Screen Unlocked',
          title: 'Screen was unlocked'
        }
      default:
        return {
          ownerName: dw.ownerName || 'Unknown App',
          title: dw.title && dw.title !== dw.ownerName ? dw.title : ''
        }
    }
  }, [latestEvent, activeWindow])

  const cardBgColor = useMemo(() => {
    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === true) {
        return 'bg-blue-100 dark:bg-blue-900'
      } else {
        // isProductive is false or neutral (uncategorized by isProductive field)
        return 'bg-red-100 dark:bg-red-900'
      }
    }
    // Default if categoryDetails is null, not found, or still loading, treat as not productive for background
    return 'bg-red-100 dark:bg-red-900'
  }, [categoryDetails])

  const getStatusTextColor = useMemo((): string => {
    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === true) {
        return 'text-blue-700 dark:text-blue-200'
      } else if (fullCategoryDetails.isProductive === false) {
        return 'text-red-700 dark:text-red-200'
      }
      // Neutral category, also using red background
      return 'text-red-700 dark:text-red-200' // Or a more neutral like text-yellow-700 dark:text-yellow-200
    }
    // Default for uncategorized or loading states where background is red
    return 'text-gray-700 dark:text-gray-300' // More contrast on red BG than muted-foreground
  }, [categoryDetails])

  const isLoadingPrimary =
    isLoadingLatestEvent ||
    (token && !latestEvent && !isLoadingCategory && !isLoadingUserCategories)

  if (isLoadingPrimary) {
    return (
      <Card className={clsx('p-2 rounded-lg border-border', cardBgColor)}>
        <div className="flex items-center justify-between gap-x-2 sm:gap-x-3">
          <div className="animate-pulse flex-grow min-w-0">
            <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-5 bg-muted rounded w-20"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={clsx('rounded-lg border-border', cardBgColor)}>
      <CardContent className="p-2 flex flex-row items-center justify-between gap-x-2 sm:gap-x-3">
        <div className="flex-grow min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {displayWindowInfo.ownerName}
            {displayWindowInfo.title && (
              <span className="text-muted-foreground">{` - ${displayWindowInfo.title}`}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className={`text-sm font-semibold ${getStatusTextColor}`}>{getStatusText()}</div>
          {(isLoadingCategory || isLoadingUserCategories || isLoadingTodayEvents) && categoryId && (
            <div className="text-xs text-muted-foreground mt-0.5">Updating...</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(DistractionCategorizationResult, arePropsEqual)
