import { useEffect } from 'react'
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

  useEffect(() => {
    if (
      (electronSettings as any)?.showDistractionNotifications !== false &&
      categoryDetails &&
      typeof categoryDetails === 'object' &&
      '_id' in categoryDetails &&
      activeWindow
    ) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === false) {
        const appName = activeWindow.ownerName || 'Current Application'
        const notificationTitle = `Focus Alert: ${appName}`
        const notificationBody = `${statusText}`

        if (window.Notification) {
          new window.Notification(notificationTitle, { body: notificationBody }).onclick = () => {
            console.log('Notification clicked')
          }
        }
      }
    }
  }, [categoryDetails, activeWindow, statusText, electronSettings])
}
