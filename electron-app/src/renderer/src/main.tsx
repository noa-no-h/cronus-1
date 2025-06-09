import './assets/custom-title-bar.css'
import './styles/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './AppWrapper'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { createTrpcClient, trpc } from './utils/trpc'
import { PostHogProvider } from 'posthog-js/react'

const Main = () => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClientInstance] = useState(() => createTrpcClient())
  const [posthogKey, setPosthogKey] = useState<string | null>(null)
  const [posthogHost, setPosthogHost] = useState<string | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  useEffect(() => {
    window.api.getEnvVariables().then((envVars) => {
      setPosthogKey(envVars.POSTHOG_KEY)
      setPosthogHost(envVars.POSTHOG_HOST)
      setIsLoadingConfig(false)
    })
  }, [])

  if (isLoadingConfig) return null

  const options = {
    api_host: posthogHost || ''
  }

  return (
    <React.StrictMode>
      <PostHogProvider apiKey={posthogKey || ''} options={options}>
        <trpc.Provider client={trpcClientInstance} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </PostHogProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Main />)
