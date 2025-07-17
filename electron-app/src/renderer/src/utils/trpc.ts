import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../../../../server/src/index'
import { refreshAccessToken } from '../lib/auth'

// In Electron, environment variables are typically accessed differently.
// For now, hardcoding the server URL. Consider using ipcRenderer to get it from main process if needed.
// const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const serverUrl = 'http://localhost:3001'

export const trpc = createTRPCReact<AppRouter>()

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${serverUrl}/trpc`,
        async headers() {
          const token = localStorage.getItem('accessToken')
          return {
            Authorization: token ? `Bearer ${token}` : ''
          }
        },
        fetch: async (url, options = {}) => {
          const response = await fetch(url, options)

          // Check for authentication errors
          let shouldRefresh = false

          if (response.status === 401) {
            shouldRefresh = true
          } else if (response.status === 500) {
            // For 500 errors, check if they're JWT-related
            const urlStr = url.toString()
            if (
              urlStr.includes('token') ||
              urlStr.includes('jwt expired') ||
              urlStr.includes('TokenExpiredError')
            ) {
              shouldRefresh = true
            }
          }

          // Also check response body for JWT errors
          if (!shouldRefresh && (response.status === 400 || response.status === 500)) {
            try {
              const responseClone = response.clone()
              const responseText = await responseClone.text()

              if (
                responseText.includes('TokenExpiredError') ||
                responseText.includes('jwt expired') ||
                responseText.includes('Invalid or expired token') ||
                responseText.includes('UNAUTHORIZED')
              ) {
                shouldRefresh = true
              }
            } catch (e) {
              // If we can't read the response body, continue with original logic
            }
          }

          if (shouldRefresh) {
            console.log(`⚠️ Received ${response.status} error - Token likely expired or invalid`)
            if (!isRefreshing) {
              console.log('🔄 Starting token refresh process')
              isRefreshing = true
              refreshPromise = refreshAccessToken()
            } else {
              console.log('⏳ Another refresh already in progress, waiting for it to complete')
            }

            try {
              const newToken = await refreshPromise
              console.log(
                '✅ Token refresh successful, got new token:',
                newToken ? newToken.substring(0, 15) + '...' : 'none'
              )
              console.log('🔁 Retrying original request')
              // Retry the original request with new token
              const newOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${newToken}`
                }
              }
              return fetch(url, newOptions)
            } finally {
              isRefreshing = false
              refreshPromise = null
            }
          }

          return response
        }
      })
    ]
  })
