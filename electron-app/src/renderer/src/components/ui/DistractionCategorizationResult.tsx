import clsx from 'clsx'
import React, { JSX, useEffect, useMemo, useRef } from 'react'
import { ActiveWindowDetails } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface DistractionCategorizationResultProps {
  activeWindow: ActiveWindowDetails | null
}

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: DistractionCategorizationResultProps,
  nextProps: DistractionCategorizationResultProps
): boolean => {
  if (!prevProps.activeWindow && !nextProps.activeWindow) return true
  if (!prevProps.activeWindow || !nextProps.activeWindow) return false

  const p = prevProps.activeWindow
  const n = nextProps.activeWindow

  // Compare key fields that determine if the window content has changed.
  // Omitting timestamp and windowId as they don't signify a change in content for this purpose.
  return (
    p.ownerName === n.ownerName &&
    p.title === n.title &&
    p.url === n.url &&
    p.content === n.content &&
    p.type === n.type &&
    p.browser === n.browser
  )
}

const DistractionCategorizationResult = ({
  activeWindow
}: DistractionCategorizationResultProps): JSX.Element | null => {
  const { token } = useAuth()
  const prevWindowSignificantDetailsRef = useRef<string | null>(null)

  const currentWindowSignificantDetailsJSON = useMemo(() => {
    if (!activeWindow) return null
    const details = {
      ownerName: activeWindow.ownerName,
      title: activeWindow.title,
      url: activeWindow.url,
      content: activeWindow.content,
      type: activeWindow.type,
      browser: activeWindow.browser
    }
    return JSON.stringify(details)
  }, [activeWindow])

  const queryActiveWindowDetails = activeWindow
    ? {
        windowId: activeWindow.windowId || 0,
        ownerName: activeWindow.ownerName || '',
        type: activeWindow.type || 'window',
        browser: activeWindow.browser || null,
        title: activeWindow.title || '',
        url: activeWindow.url || null,
        content: activeWindow.content || null,
        timestamp: activeWindow.timestamp || Date.now()
      }
    : null

  const { data: distractionResult, isLoading } = trpc.distractions.checkDistraction.useQuery(
    {
      token: token || '',
      activeWindowDetails: queryActiveWindowDetails!
    },
    {
      enabled: !!token && !!queryActiveWindowDetails,

      // comment out bc switching to polling only when app switch is detected and every 5 minutes otherwise
      // refetchInterval: () => {
      //   // 🎯 NEW: Smart refetch based on capture reason
      //   if (!activeWindow?.captureReason) return 5000

      //   // If it was an app switch, check quickly for changes
      //   if (activeWindow.captureReason === 'app_switch') {
      //     return 3000 // Check every 3 seconds after app switch
      //   }

      //   // If it was periodic backup, check less frequently
      //   if (activeWindow.captureReason === 'periodic_backup') {
      //     return 30000 // Check every 30 seconds for periodic captures
      //   }

      //   return 5000
      // },
      onSuccess: (data) => {
        prevWindowSignificantDetailsRef.current = currentWindowSignificantDetailsJSON
        // Send status to main process for the floating window
        if (window.electron?.ipcRenderer && data?.isDistraction) {
          let status: 'productive' | 'unproductive' | 'maybe' = 'maybe'
          if (data.isDistraction === 'no') status = 'productive'
          else if (data.isDistraction === 'yes') status = 'unproductive'
          window.electron.ipcRenderer.send('update-floating-window-status', status)
        }
      }
    }
  )

  // Effect to also send status if distractionResult changes from other sources (e.g. cache)
  useEffect(() => {
    if (distractionResult?.isDistraction && window.electron?.ipcRenderer) {
      let status: 'productive' | 'unproductive' | 'maybe' = 'maybe'
      if (distractionResult.isDistraction === 'no') status = 'productive'
      else if (distractionResult.isDistraction === 'yes') status = 'unproductive'
      // console.log('Sending status from useEffect in DistractionCategorizationResult:', status) // For debugging
      window.electron.ipcRenderer.send('update-floating-window-status', status)
    }
  }, [distractionResult])

  const getStatusText = (): string => {
    if (!distractionResult) return 'Checking...'
    switch (distractionResult.isDistraction) {
      case 'no':
        return 'This seems productive. Keep it up!'
      case 'yes':
        return 'This might be distracting you.'
      case 'maybe':
      default:
        return 'Hmm, not sure if this aligns with your goals.'
    }
  }

  useEffect(() => {
    if (distractionResult && activeWindow && distractionResult.isDistraction === 'yes') {
      const appName = activeWindow.ownerName || 'No active application'
      const statusText = getStatusText()
      const motivationalText = distractionResult.motivationalText || ''

      const notificationTitle = `Activity Alert: ${appName}`
      let notificationBody = `${statusText}`
      if (motivationalText) {
        notificationBody += `\n${motivationalText}`
      }

      // Ensure we are in a context where Notification API is available (renderer process)
      if (window.Notification) {
        new window.Notification(notificationTitle, { body: notificationBody }).onclick = () => {
          console.log('Notification clicked')
          // We could add functionality here, e.g., focus the app window
          // window.api.focusApp(); // Example: if you add such an IPC call
        }
      }
    }
  }, [distractionResult, activeWindow])

  if (!activeWindow) {
    return null
  }

  if (isLoading && queryActiveWindowDetails) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!distractionResult) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Currently using:</span>
            <span className="text-sm font-medium text-foreground">
              {activeWindow.ownerName || 'No active application'}
              {activeWindow.title && activeWindow.title !== activeWindow.ownerName
                ? ` - ${activeWindow.title}`
                : ''}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Categorizing activity...</div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (): string => {
    if (!distractionResult) return 'text-muted-foreground'
    switch (distractionResult.isDistraction) {
      case 'no':
        return 'dark:text-green-300 text-green-800'
      case 'yes':
        return 'dark:text-red-300 text-red-800'
      case 'maybe':
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <Card
      className={clsx(
        'border-border',
        distractionResult.isDistraction === 'no'
          ? 'dark:bg-green-900 bg-green-200'
          : 'dark:bg-red-900 bg-red-200'
      )}
    >
      <CardHeader>
        <CardTitle className="text-card-foreground">Focus Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-start justify-start">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Currently using:</span>
          <span className="text-sm font-medium text-foreground truncate min-w-0">
            {activeWindow.ownerName || ''}
            {activeWindow.title && activeWindow.title !== activeWindow.ownerName
              ? ` - ${activeWindow.title}`
              : ''}
          </span>
        </div>

        <div className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</div>

        {distractionResult.motivationalText && (
          <div className="text-sm text-muted-foreground italic">
            {distractionResult.motivationalText}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default React.memo(DistractionCategorizationResult, arePropsEqual)
