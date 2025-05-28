import { ActiveWindowDetails } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'

interface DistractionCategorizationResultProps {
  activeWindow: ActiveWindowDetails | null
}

const DistractionCategorizationResult = ({
  activeWindow
}: DistractionCategorizationResultProps) => {
  const { token } = useAuth()

  const queryActiveWindowDetails = activeWindow
    ? {
        windowId: activeWindow.windowId || 0,
        ownerName: activeWindow.ownerName || '',
        type: activeWindow.type || 'window',
        browser: activeWindow.browser || null,
        title: activeWindow.title || '',
        url: activeWindow.url || null,
        content: activeWindow.content || null,
        timestamp: activeWindow.timestamp || Date.now()
      }
    : null

  const { data: distractionResult, isLoading } = trpc.distractions.checkDistraction.useQuery(
    {
      token: token || '',
      activeWindowDetails: queryActiveWindowDetails!
    },
    {
      enabled: !!token && !!queryActiveWindowDetails,
      refetchInterval: 5000
    }
  )

  if (!activeWindow) {
    return null
  }

  if (isLoading && queryActiveWindowDetails) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!distractionResult) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Currently using:</span>
          <span className="text-sm font-medium text-white">
            {activeWindow.ownerName || 'No active application'}
            {activeWindow.title && activeWindow.title !== activeWindow.ownerName
              ? ` - ${activeWindow.title}`
              : ''}
          </span>
        </div>
        <div className="text-sm text-gray-500">Categorizing activity...</div>
      </div>
    )
  }

  const getStatusColor = () => {
    if (!distractionResult) return 'text-gray-500'
    switch (distractionResult.isDistraction) {
      case 'no':
        return 'text-green-500'
      case 'yes':
        return 'text-red-500'
      case 'maybe':
      default:
        return 'text-yellow-500'
    }
  }

  const getStatusText = () => {
    if (!distractionResult) return 'Checking...'
    switch (distractionResult.isDistraction) {
      case 'no':
        return 'This seems productive. Keep it up!'
      case 'yes':
        return 'This might be distracting you.'
      case 'maybe':
      default:
        return 'Hmm, not sure if this aligns with your goals.'
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Currently using:</span>
        <span className="text-sm font-medium text-white">
          {activeWindow.ownerName || 'No active application'}
          {activeWindow.title && activeWindow.title !== activeWindow.ownerName
            ? ` - ${activeWindow.title}`
            : ''}
          {activeWindow.url && (
            <span className="block text-xs text-gray-400 truncate max-w-xs">
              {activeWindow.url}
            </span>
          )}
        </span>
      </div>

      <div className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</div>

      {distractionResult.motivationalText && (
        <div className="text-sm text-gray-300 italic">{distractionResult.motivationalText}</div>
      )}
    </div>
  )
}

export default DistractionCategorizationResult
