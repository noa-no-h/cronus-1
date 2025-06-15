import { useEffect } from 'react'
import { toast } from '../hooks/use-toast'

export function UpdateNotification() {
  useEffect(() => {
    const handleUpdateStatus = (status: any) => {
      if (status.status === 'available') {
        toast({
          title: 'Update Available',
          description: `Version ${status.version} is ready to download.`
        })
      }
      if (status.status === 'downloading') {
        toast({
          title: 'Downloading Update',
          description: `Progress: ${status.progress}%`
        })
      }
      if (status.status === 'downloaded') {
        toast({
          title: 'Update Ready',
          description: 'Restart the app to install the update.'
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

    // Set up the listener
    const cleanup = window.api.onUpdateStatus(handleUpdateStatus)

    // Cleanup on unmount
    return cleanup
  }, [])

  // This component doesn't render anything visible
  return null
}
