import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FadeIn } from './components/animations/FadeIn'
import { PageContainer } from './components/layout/PageContainer'
import { LoginForm } from './components/login-form'
import { createTrpcClient, trpc } from './utils/trpc'
import { ActiveWindowInfo } from './components/active-window-info'

// GOOGLE_CLIENT_ID will now be fetched from main process
console.log('App.tsx rendering -- TOP LEVEL') // ADD THIS

function App(): React.JSX.Element {
  const [activeAppName, setActiveAppName] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('accessToken')
  )
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() => createTrpcClient())
  const [googleClientId, setGoogleClientId] = useState<string | null>(null) // State for fetched ID
  const [configError, setConfigError] = useState<string | null>(null) // State for config errors
  const [isLoadingConfig, setIsLoadingConfig] = useState(true) // State for loading config
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)

  // In App.tsx, before the final return
  console.log('App.tsx - googleClientId:', googleClientId)
  console.log('App.tsx - isLoadingConfig:', isLoadingConfig)
  console.log('App.tsx - configError:', configError)

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
    })
    return cleanup
  }, [])

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

    const cleanup = window.api.onActiveWindowChanged((details) => {
      // Assuming details can be ActiveWindowDetails, but check if it can be null from preload
      setActiveAppName(details.ownerName)
    })

    return () => {
      if (typeof cleanup === 'function') {
        cleanup() // Call cleanup if it's a function
      }
    }
  }, [])

  const handleLoginSuccess = (): void => {
    setIsAuthenticated(true)
  }

  const handleLogout = (): void => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsAuthenticated(false)
    // Potentially clear tRPC cache or reset queryClient if needed
  }

  if (isLoadingConfig) {
    return (
      <PageContainer>
        <div>Loading app configuration...</div>
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
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <PageContainer>
            {!isAuthenticated ? (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center max-w-2xl mx-auto px-4"
              >
                <FadeIn delay={0.3}>
                  <motion.h1
                    className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Productivity Dashboard
                  </motion.h1>
                  <FadeIn delay={0.5}>
                    <div className="mt-4 mb-8">
                      <ActiveWindowInfo windowDetails={activeWindow} />
                    </div>
                  </FadeIn>
                </FadeIn>

                <FadeIn delay={0.5}>
                  <motion.p
                    className="text-xl text-gray-400 mb-12 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    Welcome! You are logged in.
                  </motion.p>
                </FadeIn>

                <FadeIn delay={0.7}>
                  <motion.button
                    onClick={handleLogout}
                    className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-lg overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.span
                      className="relative z-10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      Logout
                    </motion.span>
                  </motion.button>
                </FadeIn>
              </motion.div>
            )}
          </PageContainer>
        </QueryClientProvider>
      </trpc.Provider>
    </GoogleOAuthProvider>
  )
}

export default App
