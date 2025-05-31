import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { CategoryManagement } from '../components/settings/CategoryManagement' // We'll create this next

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)} // Go back to the previous page
            className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-4"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
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

        <CategoryManagement />
      </div>
    </PageContainer>
  )
}
