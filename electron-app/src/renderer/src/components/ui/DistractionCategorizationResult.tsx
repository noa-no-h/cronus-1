import clsx from 'clsx'
import React, { JSX, useEffect, useMemo, useRef } from 'react'
import { ActiveWindowDetails } from 'shared'
import dingSound from '../../assets/ding.mp3'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'

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
      refetchInterval: () => {
        // If the significant details of the window haven't changed since the last successful fetch,
        // disable interval-based refetching.
        if (prevWindowSignificantDetailsRef.current === currentWindowSignificantDetailsJSON) {
          return false
        }
        // Otherwise, use the default 5-second interval.
        return 5000
      },
      onSuccess: () => {
        // After a successful fetch, update the reference to the current window's significant details.
        prevWindowSignificantDetailsRef.current = currentWindowSignificantDetailsJSON
      }
    }
  )

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

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    if (distractionResult?.isDistraction === 'yes') {
      const playSound = (): void => {
        new Audio(dingSound).play().catch((e) => console.error('Audio play failed:', e))
      }

      intervalId = setInterval(playSound, 3000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [distractionResult?.isDistraction])

  if (!activeWindow) {
    return null
  }

  if (isLoading && queryActiveWindowDetails) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!distractionResult) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Currently using:</span>
          <span className="text-sm font-medium text-white">
            {activeWindow.ownerName || 'No active application'}
            {activeWindow.title && activeWindow.title !== activeWindow.ownerName
              ? ` - ${activeWindow.title}`
              : ''}
          </span>
        </div>
        <div className="text-sm text-gray-500">Categorizing activity...</div>
      </div>
    )
  }

  const getStatusColor = (): string => {
    if (!distractionResult) return 'text-gray-500'
    switch (distractionResult.isDistraction) {
      case 'no':
        return 'text-green-400'
      case 'yes':
        return 'text-red-400'
      case 'maybe':
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <div
      className={clsx(
        'p-4  rounded-lg space-y-3',
        distractionResult.isDistraction === 'no' ? 'bg-green-900' : 'bg-gray-800'
      )}
    >
      <div className="flex gap-2 items-start justify-start">
        <span className="text-sm text-gray-400 whitespace-nowrap">Currently using:</span>
        <span className="text-sm font-medium text-white truncate min-w-0">
          {activeWindow.ownerName || ''}
          {activeWindow.title && activeWindow.title !== activeWindow.ownerName
            ? ` - ${activeWindow.title}`
            : ''}
        </span>
      </div>

      <div className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</div>

      {distractionResult.motivationalText && (
        <div className="text-sm text-gray-300 italic">{distractionResult.motivationalText}</div>
      )}
    </div>
  )
}

export default React.memo(DistractionCategorizationResult, arePropsEqual)
