import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { ActiveWindowDetails } from 'shared'
import { AppHeader } from './components/AppHeader'
import { CalendarView } from './components/CalendarView'
import { CurrentApplicationDisplay } from './components/CurrentApplicationDisplay'
import { Settings } from './components/Settings'
import { PageContainer } from './components/layout/PageContainer'
import { LoginForm } from './components/login-form'
import { useAuth } from './contexts/AuthContext'
import { uploadActiveWindowEvent } from './lib/activityUploader'
import { trpc } from './utils/trpc'

function App(): React.JSX.Element {
  const [activeAppName, setActiveAppName] = useState<string | null>(null)
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const currentUserId = user?.id
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const eventCreationMutation = trpc.activeWindowEvents.create.useMutation()

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
      setActiveAppName(details.ownerName)

      if (details && isAuthenticated && currentUserId) {
        uploadActiveWindowEvent(currentUserId, details, eventCreationMutation.mutateAsync)
      }
    })
    return cleanup
  }, [isAuthenticated, currentUserId, eventCreationMutation.mutateAsync])

  useEffect(() => {
    // Fetch Google Client ID from main process via preload
    setIsLoadingConfig(true)
    window.api
      .getEnvVariables()
      .then((envVars) => {
        if (envVars.GOOGLE_CLIENT_ID) {
          setGoogleClientId(envVars.GOOGLE_CLIENT_ID)
        } else {
          console.error('GOOGLE_CLIENT_ID not found in envVars from main process')
          setConfigError('Configuration error: Google Client ID not provided by main process.')
        }
      })
      .catch((err) => {
        console.error('Error fetching env vars from main process:', err)
        setConfigError('Could not load app configuration from main process.')
      })
      .finally(() => {
        setIsLoadingConfig(false)
      })
  }, [])

  if (isAuthLoading || isLoadingConfig) {
    return (
      <PageContainer>
        <div>Loading app configuration or authenticating...</div>
      </PageContainer>
    )
  }

  if (configError) {
    return (
      <PageContainer>
        <div className="text-red-500 p-4 border border-red-500 rounded-md bg-red-50 max-w-lg mx-auto mt-10">
          <strong>Application Error:</strong> {configError} <br /> Please ensure GOOGLE_CLIENT_ID is
          set in electron-app/.env and the app is restarted.
        </div>
      </PageContainer>
    )
  }

  if (!googleClientId) {
    // This case should ideally be covered by configError, but as a fallback:
    return (
      <PageContainer>
        <div className="text-red-500 p-4 border border-red-500 rounded-md bg-red-50 max-w-md mx-auto mt-10">
          <strong>Configuration Error:</strong> Google Client ID is missing or not loaded.
        </div>
      </PageContainer>
    )
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <PageContainer>
        {!isAuthenticated ? (
          <LoginForm />
        ) : (
          <div className="h-full flex w-full flex-col">
            {/* App Header */}
            <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />

            {/* Current Application Display */}
            <CurrentApplicationDisplay appName={activeAppName} />

            {/* Main content area */}
            <div className="flex-1 overflow-hidden p-4">
              <CalendarView />
            </div>

            {/* Settings Modal */}
            <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          </div>
        )}
      </PageContainer>
    </GoogleOAuthProvider>
  )
}

export default App
