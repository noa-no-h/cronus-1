import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'

interface UpdateStatus {
  status: string
  version?: string
  releaseNotes?: string
  progress?: number
  error?: string
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!window.api?.onUpdateStatus) return
    const cleanup = window.api.onUpdateStatus((status: UpdateStatus) => {
      setUpdateStatus(status)
      if (['available', 'downloading', 'downloaded', 'error'].includes(status.status)) {
        setIsVisible(true)
      }
    })
    return cleanup
  }, [])

  if (!isVisible || !updateStatus) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: '#fff',
        padding: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <div>
        <strong>{updateStatus.status}</strong>
        {updateStatus.version && <div>Version: {updateStatus.version}</div>}
        {updateStatus.progress !== undefined && <Progress value={updateStatus.progress} />}
        {updateStatus.error && <div style={{ color: 'red' }}>{updateStatus.error}</div>}
        <Button onClick={() => setIsVisible(false)}>Close</Button>
      </div>
    </div>
  )
}
