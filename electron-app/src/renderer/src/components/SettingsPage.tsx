import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { CategoryManagementSettings } from './Settings/CategoryManagementSettings'
import { DistractionSoundSettings } from './Settings/DistractionSoundSettings'
import GoalInputForm from './Settings/GoalInputForm'
import { GoogleCalendarSettings } from './Settings/GoogleCalendarSettings'
import { MultiPurposeAppsSettings } from './Settings/MultiPurposeAppsSettings'
import { PermissionsStatus } from './Settings/PermissionsStatus'
import { ThemeSwitcher } from './Settings/ThemeSwitcher'
import { AppInformation } from './Settings/VersionDisplay'
import { Button } from './ui/button'

interface SettingsPageProps {
  onResetOnboarding: () => void
}

export function SettingsPage({ onResetOnboarding }: SettingsPageProps) {
  const { user, logout } = useAuth()
  const { focusOn, setFocusOn } = useSettings()
  const [showPermissions, setShowPermissions] = useState(false)

  useEffect(() => {
    if (focusOn === 'goal-input') {
      // The focusing logic will be inside GoalInputForm
      // We reset the focus request here after a short delay
      // to allow the component to render and focus.
      setTimeout(() => setFocusOn(null), 100)
    }
  }, [focusOn, setFocusOn])

  const LogOutButtonSection = () => {
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Account & Onboarding</h2>
          <p className="text-muted-foreground mb-4">Logged in as: {user?.email || 'Unknown'}</p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                logout()
                onResetOnboarding()
              }}
              variant="destructive"
              size="sm"
            >
              Logout
            </Button>
            <Button onClick={onResetOnboarding} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Onboarding
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 p-2 pt-0 pb-4">
      <div className="space-y-4">
        <GoalInputForm shouldFocus={focusOn === 'goal-input'} />
        <CategoryManagementSettings />
        <DistractionSoundSettings />
        <MultiPurposeAppsSettings />
        <ThemeSwitcher />
        <GoogleCalendarSettings />
        <LogOutButtonSection />
        <AppInformation onShowPermissions={() => setShowPermissions((v) => !v)} />
        {showPermissions && <PermissionsStatus />}
      </div>
    </div>
  )
}
