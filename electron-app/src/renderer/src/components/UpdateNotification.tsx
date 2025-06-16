import { useEffect } from 'react'
import { toast } from '../hooks/use-toast'
import { ToastAction } from './ui/toast'
import { Button } from './ui/button'

export function UpdateNotification() {
  useEffect(() => {
    const handleUpdateStatus = (status: any) => {
      if (status.status === 'available') {
        toast({
          title: 'Update Available',
          description: `Version ${status.version} is ready to download. Click to download now.`,
          className: 'cursor-pointer',
          onClick: () => window.api.downloadUpdate(),
          action: (
            <ToastAction asChild altText="Download">
              <Button variant="default" size="sm" onClick={() => window.api.downloadUpdate()}>
                Download
              </Button>
            </ToastAction>
          )
        })
      }

      if (status.status === 'downloading') {
        toast({
          title: 'Downloading Update',
          description: `Progress: ${status.progress?.toFixed?.(0) ?? status.progress}%`
        })
      }

      if (status.status === 'downloaded') {
        toast({
          title: 'Update Ready',
          description: 'Restart the app to install the update. Click to restart now.',
          className: 'cursor-pointer',
          onClick: () => window.api.installUpdate(),
          action: (
            <ToastAction asChild altText="Restart">
              <Button variant="default" size="sm" onClick={() => window.api.installUpdate()}>
                Restart
              </Button>
            </ToastAction>
          )
        })
      }

      if (status.status === 'not-available') {
        toast({
          title: 'No Update',
          description: 'You already have the latest version.'
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
