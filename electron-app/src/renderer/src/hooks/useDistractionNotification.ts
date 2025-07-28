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
    if ((electronSettings as any)?.showDistractionNotifications === false) {
      distractionStartRef.current = null
      lastNotifiedRef.current = null
      return
    }

    const notificationIntervalMs =
      ((electronSettings as any)?.distractionNotificationInterval || 60) * 1000

    let isDistracting = false
    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === false) {
        isDistracting = true
      }
    }

    if (!isDistracting) {
      distractionStartRef.current = null
      lastNotifiedRef.current = null
      return
    }

    // When a distraction starts, record the time.
    if (!distractionStartRef.current) {
      distractionStartRef.current = Date.now()
    }

    const checkAndNotify = () => {
      if (!activeWindow) return

      const now = Date.now()

      // Ensure user has been on a distracting site for at least the interval duration
      if (
        !distractionStartRef.current ||
        now - distractionStartRef.current < notificationIntervalMs
      ) {
        return
      }

      // Since we're now running at the user's interval, we can show notification immediately
      const appName = activeWindow.ownerName || 'Current Application'
      const notificationTitle = `Focus Alert: ${appName}`
      const notificationBody = `${statusText}`

      // @ts-ignore
      window.api.showNotification({
        title: notificationTitle,
        body: notificationBody
      })
      lastNotifiedRef.current = now
    }

    const intervalId = setInterval(checkAndNotify, notificationIntervalMs)

    return () => {
      clearInterval(intervalId)
    }
  }, [categoryDetails, activeWindow, statusText, electronSettings])
}
