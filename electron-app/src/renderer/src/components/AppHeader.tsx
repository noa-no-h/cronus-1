import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AppHeaderProps {
  onOpenMiniTimerClick: () => void
  isMiniTimerVisible: boolean
}

export function AppHeader({
  onOpenMiniTimerClick,
  isMiniTimerVisible
}: AppHeaderProps): React.JSX.Element {
  const navigate = useNavigate()

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border h-16">
      <div className="flex justify-between items-center h-16 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Productivity Dashboard
        </h1>
        <div className="flex items-center gap-2">
          {!isMiniTimerVisible && (
            <button
              onClick={onOpenMiniTimerClick}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground flex items-center gap-1"
              title="Open Mini Timer"
            >
              <ExternalLink size={20} />
              <span className="text-sm hidden sm:block">Open Mini Timer</span>
            </button>
          )}
          <button
            onClick={handleSettingsClick}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
            title="Settings"
          >
            <SettingsIcon size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
