import { useEffect } from 'react'
import { toast } from '../hooks/use-toast'
import { ToastAction } from './ui/toast'
import { Button } from './ui/button'

export function UpdateNotification() {
  useEffect(() => {
    const handleUpdateStatus = (status: any) => {
      if (status.status === 'available') {
        // Show brief notification and auto-start download
        toast({
          title: 'Update Available',
          description: `Version ${status.version} found. Downloading automatically...`
        })

        // Automatically start download
        setTimeout(() => {
          window.api.downloadUpdate()
        }, 1000)
      }

      if (status.status === 'downloading') {
        toast({
          title: 'Downloading Update',
          description: `Progress: ${status.progress?.toFixed?.(0) ?? status.progress}%`
        })
      }

      if (status.status === 'downloaded') {
        // Only show restart prompt
        toast({
          title: 'Update Ready',
          description: 'Update downloaded successfully. Restart to apply the update.',
          action: (
            <ToastAction asChild altText="Restart Now">
              <Button
                variant="default"
                size="sm"
                className="text-white"
                onClick={() => window.api.installUpdate()}
              >
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
  }, [])

  return null
}
