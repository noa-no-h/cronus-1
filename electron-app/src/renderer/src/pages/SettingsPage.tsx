import { RefreshCw } from 'lucide-react'
import { CategoryManagement } from '../components/settings/CategoryManagement' // We'll create this next
import DistractionSoundSettings from '../components/settings/DistractionSoundSettings'
import { PermissionsStatus } from '../components/settings/PermissionsStatus'
import { ThemeSwitcher } from '../components/settings/ThemeSwitcher'
import { Button } from '../components/ui/button'
import GoalInputForm from '../components/ui/GoalInputForm'
import { useAuth } from '../contexts/AuthContext'

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

  const UpdatesSection = () => {
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Updates</h2>
          <p className="text-muted-foreground mb-4">
            Check if a new version of Cronus is available.
          </p>
          <Button onClick={() => window.api.checkForUpdates()} variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check for Updates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 pt-0">
        <div className="space-y-4">
          <GoalInputForm />
          <CategoryManagement />
          <DistractionSoundSettings />
          <ThemeSwitcher />
          <PermissionsStatus />
          <UpdatesSection />
          <OnboardingSection />
          <LogOutButtonSection />
        </div>
      </div>
    </div>
  )
}
