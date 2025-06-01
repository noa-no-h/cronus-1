import clsx from 'clsx'
import React, { JSX, useEffect, useMemo } from 'react'
import { ActiveWindowDetails, ActiveWindowEvent, Category } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Card, CardContent, CardHeader, CardTitle } from './card'

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
      { token: token || '' }, // Use token || '' and rely on enabled
      { enabled: !!token && typeof token === 'string' && token.length > 0, refetchInterval: 5000 }
    )

  const categoryId = latestEvent?.categoryId

  const { data: categoryDetails, isLoading: isLoadingCategory } =
    trpc.category.getCategoryById.useQuery(
      { token: token || '', categoryId: categoryId || '' }, // Use token || '' and categoryId || ''
      {
        enabled:
          !!token &&
          typeof token === 'string' &&
          token.length > 0 &&
          !!categoryId &&
          categoryId !== ''
      } // Ensure categoryId is not an empty string
    )

  // Fetch all user categories for mapping categoryId to isProductive
  const { data: userCategories, isLoading: isLoadingUserCategories } =
    trpc.category.getCategories.useQuery(
      { token: token || '' }, // Use token || '' and rely on enabled
      { enabled: !!token && typeof token === 'string' && token.length > 0 }
    )

  // Fetch today's events for duration calculation
  const { data: todayEvents, isLoading: isLoadingTodayEvents } =
    trpc.activeWindowEvents.getTodayEvents.useQuery(
      { token: token || '' }, // Use token || '' and rely on enabled
      { enabled: !!token && typeof token === 'string' && token.length > 0, refetchInterval: 30000 } // Poll less frequently for all day events
    )

  // Calculate and send daily totals and current status to floating window
  useEffect(() => {
    if (!latestEvent || !userCategories || !todayEvents || !window.electron?.ipcRenderer) {
      return
    }

    let latestStatus: 'productive' | 'unproductive' | 'maybe' = 'maybe'
    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category // Type assertion
      if (fullCategoryDetails.isProductive === true) latestStatus = 'productive'
      else if (fullCategoryDetails.isProductive === false) latestStatus = 'unproductive'
    } else if (categoryDetails === null) {
      latestStatus = 'maybe'
    }

    let dailyProductiveMs = 0
    let dailyUnproductiveMs = 0

    const categoriesMap = new Map((userCategories as Category[]).map((cat) => [cat._id, cat]))

    // Filter for events with valid timestamps and sort them
    const validEvents = todayEvents.filter(
      (event) => typeof event.timestamp === 'number'
    ) as ActiveWindowEvent[]
    const sortedEvents = [...validEvents].sort(
      (a, b) => (a.timestamp as number) - (b.timestamp as number)
    )

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i]
      const eventCategory = currentEvent.categoryId
        ? categoriesMap.get(currentEvent.categoryId)
        : null

      if (!eventCategory) continue

      let durationMs = 0
      // Ensure currentEvent.timestamp is a number before using it in calculations
      const currentTimestamp = currentEvent.timestamp as number

      if (i < sortedEvents.length - 1) {
        const nextEventTimestamp = sortedEvents[i + 1].timestamp as number
        durationMs = nextEventTimestamp - currentTimestamp
      } else {
        durationMs = Date.now() - currentTimestamp
      }
      durationMs = Math.min(durationMs, 5 * 60 * 1000)

      if (eventCategory.isProductive) {
        // isProductive should exist on Category type
        dailyProductiveMs += durationMs
      } else {
        dailyUnproductiveMs += durationMs
      }
    }

    window.electron.ipcRenderer.send('update-floating-window-status', {
      latestStatus,
      dailyProductiveMs,
      dailyUnproductiveMs
    })
  }, [latestEvent, categoryDetails, userCategories, todayEvents, token]) // Re-run if these change

  // Motivational text and notifications would now depend on categoryDetails
  // For simplicity, motivationalText is not handled here but could be added to Category type or fetched separately
  const getStatusText = (): string => {
    if (!latestEvent && !activeWindow) return 'Waiting for activity data...'
    if (!latestEvent && activeWindow) return 'Processing current activity...'
    if (!categoryId) return 'Activity not yet categorized.'
    if (isLoadingCategory || isLoadingUserCategories) return 'Loading category info...'

    if (!categoryDetails || typeof categoryDetails !== 'object' || !('_id' in categoryDetails)) {
      return categoryDetails === null ? 'Category not found.' : 'Category details unavailable.'
    }

    const fullCategoryDetails = categoryDetails as Category // Type assertion
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
      const fullCategoryDetails = categoryDetails as Category // Type assertion
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

  // Display for current application (from prop)
  const currentAppDisplay = useMemo(() => {
    const displayWindow = latestEvent || activeWindow // Prefer latestEvent for consistency, fallback to activeWindow
    if (!displayWindow) return 'No active application.'
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">Currently:</span>
        <span className="text-sm font-medium text-foreground truncate min-w-0">
          {displayWindow.ownerName || ''}
          {displayWindow.title && displayWindow.title !== displayWindow.ownerName
            ? ` - ${displayWindow.title}`
            : ''}
        </span>
      </div>
    )
  }, [activeWindow, latestEvent])

  const cardBgColor = useMemo(() => {
    if (!categoryDetails || typeof categoryDetails !== 'object' || !('_id' in categoryDetails))
      return 'bg-card'

    const fullCategoryDetails = categoryDetails as Category // Type assertion
    if (fullCategoryDetails.isProductive === true) return 'dark:bg-green-900/30 bg-green-200/50'
    if (fullCategoryDetails.isProductive === false) return 'dark:bg-red-900/30 bg-red-200/50'
    return 'dark:bg-yellow-900/30 bg-yellow-200/50'
  }, [categoryDetails])

  const isLoading =
    isLoadingLatestEvent ||
    (categoryId && (isLoadingCategory || isLoadingUserCategories)) ||
    (token && isLoadingTodayEvents)

  if (isLoading && !latestEvent) {
    return (
      <Card className={clsx('border-border', cardBgColor)}>
        {currentAppDisplay}
        <CardContent className="pt-2">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (): string => {
    if (!categoryDetails || typeof categoryDetails !== 'object' || !('_id' in categoryDetails))
      return 'text-muted-foreground'

    const fullCategoryDetails = categoryDetails as Category // Type assertion
    if (fullCategoryDetails.isProductive === true) return 'dark:text-green-300 text-green-700'
    if (fullCategoryDetails.isProductive === false) return 'dark:text-red-300 text-red-700'
    return 'text-yellow-400'
  }

  return (
    <Card className={clsx('border-border', cardBgColor)}>
      <CardHeader>
        <CardTitle className="text-card-foreground">Focus Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentAppDisplay}
        {(isLoadingCategory || isLoadingUserCategories || isLoadingTodayEvents) && categoryId && (
          <div className="text-sm text-muted-foreground">Updating category & totals...</div>
        )}
        <div className={`text-lg font-semibold ${getStatusColor()}`}>{getStatusText()}</div>
        {/* Display category color if available */}
        {categoryDetails &&
        typeof categoryDetails === 'object' &&
        '_id' in categoryDetails &&
        (categoryDetails as Category).color ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category Color:</span>
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: (categoryDetails as Category).color }}
            ></div>
          </div>
        ) : null}
        {/* Placeholder for motivational text based on category if desired */}
        {/* {categoryDetails && categoryDetails.motivationalText && (
          <div className="text-sm text-muted-foreground italic">
            {categoryDetails.motivationalText}
          </div>
        )} */}
      </CardContent>
    </Card>
  )
}

export default React.memo(DistractionCategorizationResult, arePropsEqual)
