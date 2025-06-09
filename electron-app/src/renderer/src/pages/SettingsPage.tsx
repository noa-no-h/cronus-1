import { CategoryManagement } from '../components/settings/CategoryManagement' // We'll create this next
import DistractionSoundSettings from '../components/settings/DistractionSoundSettings'
import { ThemeSwitcher } from '../components/settings/ThemeSwitcher'
import { Button } from '../components/ui/button'
import GoalInputForm from '../components/ui/GoalInputForm'
import { useAuth } from '../contexts/AuthContext'

export function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 pt-0">
        <div className="space-y-4">
          <CategoryManagement />
          <DistractionSoundSettings />
          <GoalInputForm />
          <ThemeSwitcher />
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <p className="text-muted-foreground mb-4">Logged in as: {user?.email || 'Unknown'}</p>
              <Button onClick={logout} variant="destructive" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
