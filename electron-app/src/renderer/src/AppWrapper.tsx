import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { MainAppContent } from './App'
import './assets/custom-title-bar.css'
import { PageContainer } from './components/layout/PageContainer'
import { LoginForm } from './components/login-form'
import Spinner from './components/ui/Spinner'
import { useAuth } from './contexts/AuthContext'

function AppWrapper(): React.JSX.Element {
  const { isAuthenticated, isLoading: isAuthLoading, loginWithGoogleCode } = useAuth()
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  useEffect(() => {
    const cleanup = window.api.onAuthCodeReceived(async (code) => {
      try {
        await loginWithGoogleCode(code, true)
        // Optionally, show a success notification
      } catch (err) {
        // Handle error (show notification, etc)
      }
    })
    return cleanup
  }, [])

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
