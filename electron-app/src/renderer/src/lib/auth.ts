import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../../../server/src/index'

// In Electron, environment variables are typically accessed differently.
// For now, hardcoding the server URL. Consider using ipcRenderer to get it from main process if needed.
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  try {
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${serverUrl}/trpc`
        })
      ]
    })

    const response = await client.auth.refreshToken.mutate({
      refreshToken
    })

    localStorage.setItem('accessToken', response.accessToken)
    // localStorage.setItem('token', response.accessToken); // Original had this, decide if needed

    return response.accessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    // Only clear auth-related tokens, not other localStorage data like onboarding state
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // localStorage.removeItem('token'); // Original had this
    // In Electron, direct window.location.href might not be what you want for a login redirect.
    // This might need to be handled by IPC to the main process to show a login window or view.
    // For now, just re-throwing. Consider how to handle UI update for login.
    throw error
  }
}

export async function exchangeGoogleCodeForTokens(code: string, isDesktopFlow: boolean) {
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${serverUrl}/trpc`
      })
    ]
  })

  return client.auth.exchangeGoogleCode.mutate({ code, isDesktopFlow })
}
