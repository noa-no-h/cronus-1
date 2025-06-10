import { cn } from '../../lib/utils'
import { getFaviconURL } from '../../utils/favicon'
import AppIcon from '../AppIcon'

interface ActivityIconProps {
  url?: string | null
  appName?: string | null
  size: number
  className?: string
}

const systemEventNames = [
  '💤 System Inactive',
  '⏰ System Active',
  '🔒 Screen Locked',
  '🔓 Screen Unlocked'
]

export function ActivityIcon({ url, appName, size, className }: ActivityIconProps) {
  const isSystemEvent = appName && systemEventNames.includes(appName)

  if (isSystemEvent) {
    return <div style={{ width: size, height: size }} className={cn('flex-shrink-0', className)} />
  }

  if (url) {
    return (
      <img
        src={getFaviconURL(url) || '/placeholder.svg'}
        className={cn('rounded flex-shrink-0', className)}
        style={{ width: size, height: size }}
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
        alt={appName || 'favicon'}
      />
    )
  }

  if (appName) {
    return <AppIcon appName={appName} size={size} className={cn('flex-shrink-0', className)} />
  }

  return <div style={{ width: size, height: size }} className={cn('flex-shrink-0', className)} />
}
