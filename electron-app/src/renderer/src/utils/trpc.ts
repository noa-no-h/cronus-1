import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../../../../server/src/index'
import { refreshAccessToken } from '../lib/auth'

// In Electron, environment variables are typically accessed differently.
// For now, hardcoding the server URL. Consider using ipcRenderer to get it from main process if needed.
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

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

          if (
            response.status === 401 ||
            (response.status === 500 &&
              (url.toString().includes('token') ||
                url.toString().includes('jwt expired') ||
                url.toString().includes('TokenExpiredError')))
          ) {
            if (!isRefreshing) {
              isRefreshing = true
              refreshPromise = refreshAccessToken()
            }

            try {
              const newToken = await refreshPromise
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
