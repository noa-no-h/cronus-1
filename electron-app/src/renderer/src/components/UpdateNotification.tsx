import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from '../hooks/use-toast'
import { Button } from './ui/button'
import { ToastAction } from './ui/toast'

export function UpdateNotification() {
  const { theme } = useTheme()

  useEffect(() => {
    const handleUpdateStatus = (status: any) => {
      if (status.status === 'available') {
        toast({
          title: 'Update Available',
          description: `Version ${status.version} found. Downloading automatically...`
        })

        setTimeout(() => {
          window.api.downloadUpdate()
        }, 1000)
      }

      if (status.status === 'downloading') {
        const progressNumber = parseFloat(status.progress) || 0
        const isComplete = progressNumber >= 100
        const progressDisplay = progressNumber.toFixed(0)

        toast({
          title: 'Downloading Update',
          description: isComplete
            ? `Progress: ${progressDisplay}% ✅`
            : `Progress: ${progressDisplay}%`
        })
      }
      if (status.status === 'downloaded') {
        toast({
          title: 'Update Ready',
          description: 'Update downloaded successfully. Restart to apply the update.',
          action: (
            <ToastAction asChild altText="Restart Now">
              <Button variant="default" size="sm" onClick={() => window.api.installUpdate()}>
                Restart Now
              </Button>
            </ToastAction>
          )
        })
      }

      if (status.status === 'error') {
        toast({
          title: 'Update Error',
          description: status.error,
          variant: 'destructive'
        })
      }
    }

    const cleanup = window.api.onUpdateStatus(handleUpdateStatus)
    return cleanup
  }, [theme])

  return null
}
