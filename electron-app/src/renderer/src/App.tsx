import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ActiveWindowDetails } from 'shared'
import './assets/custom-title-bar.css'
import { AppHeader } from './components/AppHeader'
import TopActivityWidget from './components/TopActivityWidget'
import { PageContainer } from './components/layout/PageContainer'
import { LoginForm } from './components/login-form'
import DistractionCategorizationResult from './components/ui/DistractionCategorizationResult'
import Spinner from './components/ui/Spinner'
import { useAuth } from './contexts/AuthContext'
import { uploadActiveWindowEvent } from './lib/activityUploader'
import { SettingsPage } from './pages/SettingsPage'
import { trpc } from './utils/trpc'

function MainAppContent() {
  const { user, isAuthenticated, token } = useAuth()
  const currentUserId = user?.id
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(false)

  const eventCreationMutation = trpc.activeWindowEvents.create.useMutation()

  const handleOpenMiniTimer = () => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
      if (details && isAuthenticated && token) {
        uploadActiveWindowEvent(token, details, eventCreationMutation.mutateAsync)
      }
    })
    return cleanup
  }, [isAuthenticated, token, eventCreationMutation.mutateAsync])

  useEffect(() => {
    const handleVisibilityChange = (_event, isVisible: boolean) => {
      setIsMiniTimerVisible(isVisible)
      console.log('App.tsx: Mini timer visibility changed to:', isVisible)
    }
    window.electron?.ipcRenderer?.on('floating-window-visibility-changed', handleVisibilityChange)
    return () => {
      window.electron?.ipcRenderer?.removeListener(
        'floating-window-visibility-changed',
        handleVisibilityChange
      )
    }
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="custom-title-bar"></div>
      <AppHeader
        onOpenMiniTimerClick={handleOpenMiniTimer}
        isMiniTimerVisible={isMiniTimerVisible}
      />
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        <DistractionCategorizationResult activeWindow={activeWindow} />

        <TopActivityWidget />
      </div>
    </div>
  )
}

function AppWrapper(): React.JSX.Element {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  useEffect(() => {
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
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
          <div className="mt-4 text-gray-500">Loading app configuration or authenticating...</div>
        </div>
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
          <Routes>
            <Route path="/" element={<MainAppContent />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        )}
      </PageContainer>
    </GoogleOAuthProvider>
  )
}

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  )
}

export default App
