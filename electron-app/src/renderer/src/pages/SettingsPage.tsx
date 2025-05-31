import { Button } from '@renderer/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { CategoryManagement } from '../components/settings/CategoryManagement' // We'll create this next
import { ThemeSwitcher } from '../components/settings/ThemeSwitcher'

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="custom-title-bar"></div>
      <div className="p-4 md:p-6 pt-[40px]">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => navigate(-1)} // Go back to the previous page
            aria-label="Go back"
            variant="ghost"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

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
          <ThemeSwitcher />
          <CategoryManagement />
        </div>
      </div>
    </PageContainer>
  )
}
