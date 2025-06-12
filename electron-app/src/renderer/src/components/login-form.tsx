import { APP_NAME, APP_USP } from '@renderer/App'
import { cn } from '@renderer/lib/utils'
import { useCallback, useEffect, useState } from 'react'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onLoginSuccess?: () => void
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [clientUrl, setClientUrl] = useState<string | null>(null)

  useEffect(() => {
    window.api
      .getEnvVariables()
      .then((envVars) => {
        if (envVars.GOOGLE_CLIENT_ID) {
          setGoogleClientId(envVars.GOOGLE_CLIENT_ID)
        } else {
          console.error('GOOGLE_CLIENT_ID not found in envVars from main process')
        }
        if (envVars.CLIENT_URL) {
          setClientUrl(envVars.CLIENT_URL)
        } else {
          console.error('CLIENT_URL not found in envVars from main process')
        }
      })
      .catch((err) => {
        console.error('Error fetching env vars from main process:', err)
      })
  }, [])

  const handleLoginClick = useCallback(() => {
    if (!googleClientId || !clientUrl) {
      console.error('Google Client ID or Client URL not available.')
      // Optionally, show an error to the user
      return
    }

    const redirectWebAppSiteUri = `${clientUrl}/electron-callback`

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', googleClientId)
    authUrl.searchParams.set('redirect_uri', redirectWebAppSiteUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile email')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent') // Important to get a refresh token every time

    window.api.openExternalUrl(authUrl.toString())
  }, [googleClientId, clientUrl])

  return (
    <div className={cn('flex flex-col gap-6 items-center w-full p-8 m-auto', className)} {...props}>
      <div className="w-full max-w-md mx-auto rounded-lg p-8 bg-white">
        <div className="text-center">
          <h1 className="text-2xl text-gray-800 font-semibold">Welcome to {APP_NAME}</h1>
          <p className="text-sm text-gray-600 mb-6">{APP_USP}</p>
          <p className="text-sm text-gray-600 mb-6">Sign in with your Google account</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleLoginClick}
            disabled={!googleClientId || !clientUrl}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}
