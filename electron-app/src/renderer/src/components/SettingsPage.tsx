import { RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DistractionSoundSettings from './Settings/DistractionSoundSettings'
import GoalInputForm from './Settings/GoalInputForm'
import { PermissionsStatus } from './Settings/PermissionsStatus'
import { ThemeSwitcher } from './Settings/ThemeSwitcher'
import { Button } from './ui/button'

interface SettingsPageProps {
  onResetOnboarding: () => void
}

export function SettingsPage({ onResetOnboarding }: SettingsPageProps) {
  const { user, logout } = useAuth()

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
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 pt-0">
        <div className="space-y-4">
          <GoalInputForm />
          {/* <CategoryManagementSettings /> */}
          <DistractionSoundSettings />
          <ThemeSwitcher />
          <PermissionsStatus />
          <OnboardingSection />
          <LogOutButtonSection />
        </div>
      </div>
    </div>
  )
}
