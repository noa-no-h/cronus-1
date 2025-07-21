import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { CategoryManagementSettings } from './Settings/CategoryManagementSettings'
import { DistractionSoundSettings } from './Settings/DistractionSoundSettings'
import GoalInputForm from './Settings/GoalInputForm'
import { MultiPurposeAppsSettings } from './Settings/MultiPurposeAppsSettings'
import { PermissionsStatus } from './Settings/PermissionsStatus'
import { ThemeSwitcher } from './Settings/ThemeSwitcher'
import { AppInformation } from './Settings/VersionDisplay'
import { Button } from './ui/button'
import { GoogleCalendarSettings } from './Settings/GoogleCalendarSettings'

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
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <p className="text-muted-foreground mb-4">Logged in as: {user?.email || 'Unknown'}</p>
          <Button onClick={logout} variant="destructive" size="sm">
            Logout
          </Button>
        </div>
      </div>
    )
  }

  const OnboardingSection = () => {
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Onboarding</h2>
          <p className="text-muted-foreground mb-4">
            Restart the setup process to review your goals and permissions.
          </p>
          <Button onClick={onResetOnboarding} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Onboarding
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="p-2 pt-0 pb-4">
        <div className="space-y-4">
          <GoalInputForm shouldFocus={focusOn === 'goal-input'} />
          <GoogleCalendarSettings />
          <CategoryManagementSettings />
          <DistractionSoundSettings />
          <MultiPurposeAppsSettings />
          <ThemeSwitcher />
          <OnboardingSection />
          <LogOutButtonSection />
          <AppInformation onShowPermissions={() => setShowPermissions((v) => !v)} />
          {showPermissions && <PermissionsStatus />}
        </div>
      </div>
    </div>
  )
}
