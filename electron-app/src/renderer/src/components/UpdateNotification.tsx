import React, { useEffect, useRef } from 'react'
import { UpdateStatus } from '../../../shared/update'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from '../hooks/use-toast'
import { useDarkMode } from '../hooks/useDarkMode'
import { Button } from './ui/button'
import { ToastAction } from './ui/toast'

export function UpdateNotification(): React.JSX.Element | null {
  // Changed return type
  const { theme } = useTheme()
  const isDarkMode = useDarkMode()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toastRef = useRef<any>(null)

  useEffect(() => {
    const handleUpdateStatus = (status: UpdateStatus): void => {
      if (status.status === 'available') {
        toastRef.current = toast({
          title: 'Update Available',
          description: `Version ${status.info.version} found. Downloading automatically...`
        })

        setTimeout(() => {
          window.api.downloadUpdate()
        }, 1000)
      }

      if (status.status === 'downloading') {
        const progressNumber = status.progress.percent
        const isComplete = progressNumber >= 100
        const progressDisplay = progressNumber.toFixed(0)

        if (toastRef.current) {
          toastRef.current.update({
            title: 'Downloading Update',
            description: isComplete
              ? `Progress: ${progressDisplay}% ✅`
              : `Progress: ${progressDisplay}%`
          })
        } else {
          toastRef.current = toast({
            title: 'Downloading Update',
            description: `Progress: ${progressDisplay}%`
          })
        }
      }

      if (status.status === 'downloaded') {
        const handleRestart = (): void => {
          toast({
            title: 'Restarting...',
            description: 'The application will now restart to apply the update.'
          })
          setTimeout(() => {
            window.api.installUpdate()
          }, 1000) // Give toast time to appear
        }

        if (toastRef.current) {
          toastRef.current.update({
            title: 'Update Ready',
            description: 'Update downloaded successfully. Restart to apply the update.',
            duration: Infinity,
            action: (
              <ToastAction asChild altText="Restart Now">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRestart}
                  className={isDarkMode ? 'text-white' : 'text-black'}
                >
                  Restart Now
                </Button>
              </ToastAction>
            )
          })
        } else {
          toastRef.current = toast({
            title: 'Update Ready',
            description: 'Update downloaded successfully. Restart to apply the update.',
            duration: Infinity,
            action: (
              <ToastAction asChild altText="Restart Now">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRestart}
                  className={isDarkMode ? 'text-white' : 'text-black'}
                >
                  Restart Now
                </Button>
              </ToastAction>
            )
          })
        }
      }

      if (status.status === 'error') {
        if (toastRef.current) {
          toastRef.current.update({
            title: 'Update Error',
            description: status.error.message,
            variant: 'destructive'
          })
        }
      }
    }

    const cleanup = window.api.onUpdateStatus(handleUpdateStatus)
    return cleanup
  }, [theme, isDarkMode])

  return null
}
