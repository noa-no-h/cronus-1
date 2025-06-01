import { Button } from '@renderer/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { CategoryManagement } from '../components/settings/CategoryManagement' // We'll create this next
import { ThemeSwitcher } from '../components/settings/ThemeSwitcher'
import GoalInputForm from '@renderer/components/ui/GoalInputForm'
import { useAuth } from '../contexts/AuthContext'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <PageContainer>
      {/* This div is for the draggable window region */}
      <div className="custom-title-bar fixed top-0 left-0 right-0 h-[30px] z-50"></div>
      {/* Sticky header for Back button and Title */}
      <div className="sticky top-[30px] mt-8 h-16 z-40 bg-background border-b border-border pt-2 pb-2 px-4 md:px-6 flex items-center">
        <Button
          onClick={() => navigate(-1)} // Go back to the previous page
          aria-label="Go back"
          variant="ghost"
          className="mr-2" // Added margin for spacing
        >
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Scrollable content area */}
      <div className="p-4 md:p-6 pt-4">
        {' '}
        {/* Adjusted padding-top */}
        {/* User Account Section (can be moved from existing Settings modal or recreated) */}
        {/* <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Account</h2>
          <p className="text-gray-400">Logged in as: {user?.email || 'Unknown'}</p>
          <button
            onClick={logout}
            className="mt-4 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            Logout
          </button>
        </div> */}
        <div className="space-y-8">
          <CategoryManagement />
          <GoalInputForm />
          <ThemeSwitcher />
        </div>
      </div>
      <div className="p-4 md:p-6 pt-4">
        <div className="space-y-8">
          <div className="bg-muted/30 rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <p className="text-muted-foreground mb-4">Logged in as: {user?.email || 'Unknown'}</p>
            <Button onClick={logout} variant="destructive" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
