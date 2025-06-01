import clsx from 'clsx'
import React, { JSX, useEffect, useMemo } from 'react'
import { ActiveWindowDetails, Category } from 'shared'
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

  // Fetch the latest active window event
  const { data: latestEvent, isLoading: isLoadingLatestEvent } =
    trpc.activeWindowEvents.getLatestEvent.useQuery(
      {
        token: token || ''
      },
      {
        enabled: !!token,
        refetchInterval: 5000 // Poll for the latest event every 5 seconds
        // onSuccess might not be needed here if we rely on the derived category query
      }
    )

  const categoryId = latestEvent?.categoryId

  // Fetch category details if categoryId is available from the latestEvent
  const { data: categoryDetails, isLoading: isLoadingCategory } =
    trpc.category.getCategoryById.useQuery(
      {
        token: token || '',
        categoryId: categoryId || ''
      },
      {
        enabled: !!token && !!categoryId,
        // onSuccess can be used to send status to main process for floating window
        onSuccess: (data: Category | null) => {
          if (window.electron?.ipcRenderer && data) {
            let status: 'productive' | 'unproductive' | 'maybe' = 'maybe'
            if (data.isProductive === true) status = 'productive'
            else if (data.isProductive === false) status = 'unproductive'
            window.electron.ipcRenderer.send('update-floating-window-status', status)
          }
        }
      }
    )

  // Effect to send status if categoryDetails changes (e.g. from cache or subsequent fetch)
  useEffect(() => {
    if (categoryDetails && window.electron?.ipcRenderer) {
      let status: 'productive' | 'unproductive' | 'maybe' = 'maybe'
      if (categoryDetails.isProductive === true) status = 'productive'
      else if (categoryDetails.isProductive === false) status = 'unproductive'
      window.electron.ipcRenderer.send('update-floating-window-status', status)
    }
  }, [categoryDetails])

  // Motivational text and notifications would now depend on categoryDetails
  // For simplicity, motivationalText is not handled here but could be added to Category type or fetched separately
  const getStatusText = (): string => {
    if (!latestEvent) return 'Waiting for activity data...'
    if (!categoryId) return 'Activity not yet categorized.'
    if (!categoryDetails) return 'Loading category info...'

    if (categoryDetails.isProductive === true)
      return `${categoryDetails.name}: Seems productive. Keep it up!`
    if (categoryDetails.isProductive === false)
      return `${categoryDetails.name}: Might be distracting.`
    return `${categoryDetails.name}: Neutral or Uncategorized.`
  }

  useEffect(() => {
    if (categoryDetails && activeWindow && categoryDetails.isProductive === false) {
      const appName = activeWindow.ownerName || 'Current Application'
      const statusText = getStatusText() // This will now reflect category name and productive status
      // const motivationalText = categoryDetails.motivationalText || '' // If you add motivationalText to Category

      const notificationTitle = `Focus Alert: ${appName}`
      let notificationBody = `${statusText}`
      // if (motivationalText) {
      //   notificationBody += `\n${motivationalText}`
      // }

      if (window.Notification) {
        new window.Notification(notificationTitle, { body: notificationBody }).onclick = () => {
          console.log('Notification clicked')
        }
      }
    }
  }, [categoryDetails, activeWindow]) // Re-run if category or activeWindow details change

  // Display for current application (from prop)
  const currentAppDisplay = useMemo(() => {
    if (!activeWindow) return 'No active application.'
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">Currently using:</span>
        <span className="text-sm font-medium text-foreground truncate min-w-0">
          {activeWindow.ownerName || ''}
          {activeWindow.title && activeWindow.title !== activeWindow.ownerName
            ? ` - ${activeWindow.title}`
            : ''}
        </span>
      </div>
    )
  }, [activeWindow])

  const cardBgColor = useMemo(() => {
    if (!categoryDetails) return 'bg-card'
    if (categoryDetails.isProductive === true) return 'dark:bg-green-900 bg-green-200'
    if (categoryDetails.isProductive === false) return 'dark:bg-red-900 bg-red-200'
    return 'dark:bg-yellow-900 bg-yellow-200' // Or a neutral color
  }, [categoryDetails])

  if (isLoadingLatestEvent && !latestEvent) {
    return (
      <Card className="bg-card border-border">
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
    if (!categoryDetails) return 'text-muted-foreground'
    if (categoryDetails.isProductive === true) return 'dark:text-green-300 text-green-800'
    if (categoryDetails.isProductive === false) return 'dark:text-red-300 text-red-800'
    return 'text-yellow-500' // For 'maybe' or uncategorized
  }

  return (
    <Card className={clsx('border-border', cardBgColor)}>
      <CardHeader>
        <CardTitle className="text-card-foreground">Focus Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentAppDisplay}
        {isLoadingCategory && categoryId && (
          <div className="text-sm text-muted-foreground">Fetching category details...</div>
        )}
        <div className={`text-lg font-semibold ${getStatusColor()}`}>{getStatusText()}</div>
        {/* Display category color if available */}
        {categoryDetails?.color && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category Color:</span>
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: categoryDetails.color }}
            ></div>
          </div>
        )}
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
