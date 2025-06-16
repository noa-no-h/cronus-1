import { useEffect } from 'react'
import { toast } from '../hooks/use-toast'
import { Button } from './ui/button'

export function UpdateNotification() {
  useEffect(() => {
    const handleUpdateStatus = (status: any) => {
      if (status.status === 'available') {
        toast({
          title: 'Update Available',
          description: `Version ${status.version} is ready to download.`,
          action: (
            <Button variant="default" size="sm" onClick={() => window.api.downloadUpdate()}>
              Download
            </Button>
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
          description: 'Restart the app to install the update.',
          action: (
            <Button variant="default" size="sm" onClick={() => window.api.installUpdate()}>
              Restart
            </Button>
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
