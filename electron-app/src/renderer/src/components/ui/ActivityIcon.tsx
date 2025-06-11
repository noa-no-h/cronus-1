import { cn } from '../../lib/utils'
import { getFaviconURL } from '../../utils/favicon'
import AppIcon from '../AppIcon'

interface ActivityIconProps {
  url?: string | null
  appName?: string | null
  size: number
  className?: string
  itemType?: 'website' | 'app' | 'other'
  color?: string
  onFaviconError?: () => void
  showFallback?: boolean
  fallbackText?: string
}

// TODO: marge with constants array?
const systemEventNames = [
  '💤 System Inactive',
  '⏰ System Active',
  '🔒 Screen Locked',
  '🔓 Screen Unlocked'
]

export function ActivityIcon({
  url,
  appName,
  size,
  className,
  itemType,
  color,
  onFaviconError,
  showFallback,
  fallbackText
}: ActivityIconProps) {
  const isSystemEvent = appName && systemEventNames.includes(appName)

  if (isSystemEvent) {
    return <div style={{ width: size, height: size }} className={cn('flex-shrink-0', className)} />
  }

  const effectiveItemType = itemType || (url ? 'website' : appName ? 'app' : 'other')

  if (effectiveItemType === 'website' && url) {
    if (showFallback) {
      return (
        <div
          style={{ width: size, height: size }}
          className={cn(
            'flex items-center justify-center bg-muted text-muted-foreground rounded text-xs flex-shrink-0',
            className
          )}
        >
          {fallbackText}
        </div>
      )
    }
    return (
      <img
        src={getFaviconURL(url) || '/placeholder.svg'}
        className={cn('rounded flex-shrink-0', className)}
        style={{ width: size, height: size }}
        onError={(e) => {
          if (onFaviconError) {
            onFaviconError()
          } else {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }
        }}
        alt={appName || 'favicon'}
      />
    )
  }

  if (effectiveItemType === 'app' && appName) {
    return <AppIcon appName={appName} size={size} className={cn('flex-shrink-0', className)} />
  }

  if (effectiveItemType === 'other' && color) {
    return (
      <span
        className={cn('rounded-full flex-shrink-0', className)}
        style={{ backgroundColor: color, width: size, height: size }}
      ></span>
    )
  }

  return <div style={{ width: size, height: size }} className={cn('flex-shrink-0', className)} />
}
