import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

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
        <h1 className="text-2xl font-bold text-primary">Zeit</h1>
        <div className="flex items-center gap-2">
          {!isMiniTimerVisible && (
            <Button
              variant="ghost"
              onClick={onOpenMiniTimerClick}
              className="flex items-center gap-2"
              title="Open Mini Timer"
            >
              <ExternalLink size={20} />
              <span className="text-sm">Open Mini Timer</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleSettingsClick} title="Settings">
            <SettingsIcon size={24} />
          </Button>
        </div>
      </div>
    </div>
  )
}
