import './assets/custom-title-bar.css'
import './styles/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './AppWrapper'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { createTrpcClient, trpc } from './utils/trpc'

const Main = () => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClientInstance] = useState(() => createTrpcClient())

  return (
    <React.StrictMode>
      <trpc.Provider client={trpcClientInstance} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Main />)
