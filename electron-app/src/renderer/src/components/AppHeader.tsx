import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'

interface AppHeaderProps {
  onSettingsClick: () => void
  onOpenMiniTimerClick: () => void
  isMiniTimerVisible: boolean
}

export function AppHeader({
  onSettingsClick,
  onOpenMiniTimerClick,
  isMiniTimerVisible
}: AppHeaderProps): React.JSX.Element {
  return (
    <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 h-16">
      <div className="flex justify-between items-center h-16 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Productivity Dashboard
        </h1>
        <div className="flex items-center gap-2">
          {!isMiniTimerVisible && (
            <button
              onClick={onOpenMiniTimerClick}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex items-center gap-1"
              title="Open Mini Timer"
            >
              <ExternalLink size={20} />
              <span className="text-sm hidden sm:block">Open Mini Timer</span>
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title="Settings"
          >
            <SettingsIcon size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
