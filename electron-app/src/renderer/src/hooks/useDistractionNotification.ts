import { useEffect, useRef } from 'react'
import { ActiveWindowDetails, Category } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'

export const useDistractionNotification = (
  categoryDetails: Category | null | undefined,
  activeWindow: ActiveWindowDetails | null,
  statusText: string
): void => {
  const { token } = useAuth()
  const { data: electronSettings } = trpc.user.getElectronAppSettings.useQuery(
    { token: token || '' },
    {
      enabled: !!token,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  )

  const lastNotifiedRef = useRef<number | null>(null)
  const distractionStartRef = useRef<number | null>(null)

  useEffect(() => {
    console.log('🔔 Distraction notification effect running', {
      electronSettings,
      categoryDetails,
      activeWindow,
      statusText
    })

    if ((electronSettings as any)?.showDistractionNotifications === false) {
      console.log('🔔 Distraction notifications disabled in settings')
      distractionStartRef.current = null
      lastNotifiedRef.current = null
      return
    }

    const notificationIntervalMs =
      ((electronSettings as any)?.distractionNotificationInterval || 60) * 1000

    console.log('🔔 Notification interval:', notificationIntervalMs / 1000, 'seconds')

    let isDistracting = false
    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === false) {
        isDistracting = true
        console.log('🔔 Current activity is distracting:', fullCategoryDetails.name)
      } else {
        console.log('🔔 Current activity is productive:', fullCategoryDetails.name)
      }
    } else {
      console.log('🔔 No category details available')
    }

    if (!isDistracting) {
      console.log('🔔 Not distracting, clearing timers')
      distractionStartRef.current = null
      lastNotifiedRef.current = null
      return
    }

    // When a distraction starts, record the time.
    if (!distractionStartRef.current) {
      distractionStartRef.current = Date.now()
      console.log('🔔 Started tracking distraction at:', new Date(distractionStartRef.current))
    }

    const checkAndNotify = () => {
      console.log('🔔 Checking for notification...', {
        activeWindow: !!activeWindow,
        distractionStart: distractionStartRef.current,
        now: Date.now(),
        timeSinceStart: distractionStartRef.current ? Date.now() - distractionStartRef.current : 0,
        intervalMs: notificationIntervalMs
      })

      if (!activeWindow) {
        console.log('🔔 No active window, skipping notification')
        return
      }

      const now = Date.now()

      // Ensure user has been on a distracting site for at least the interval duration
      if (
        !distractionStartRef.current ||
        now - distractionStartRef.current < notificationIntervalMs
      ) {
        console.log('🔔 Not enough time elapsed for notification', {
          elapsed: distractionStartRef.current ? now - distractionStartRef.current : 0,
          required: notificationIntervalMs
        })
        return
      }

      // Since we're now running at the user's interval, we can show notification immediately
      const appName = activeWindow.ownerName || 'Current Application'
      const notificationTitle = `Focus Alert: ${appName}`
      const notificationBody = `${statusText}`

      console.log('🔔 Showing notification:', { title: notificationTitle, body: notificationBody })

      // @ts-ignore
      window.api.showNotification({
        title: notificationTitle,
        body: notificationBody
      })
      lastNotifiedRef.current = now
      console.log('🔔 Notification sent successfully')
    }

    const intervalId = setInterval(checkAndNotify, notificationIntervalMs)

    return () => {
      clearInterval(intervalId)
    }
  }, [categoryDetails, activeWindow, statusText, electronSettings])
}
