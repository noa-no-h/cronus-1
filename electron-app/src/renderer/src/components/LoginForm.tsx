import { CodeResponse, useGoogleLogin } from '@react-oauth/google'
import { useCallback, useEffect, useState } from 'react'
import { APP_NAME, APP_USP } from '../App'
import GoogleLogo from '../assets/icons/google.png'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onLoginSuccess?: () => void
}

export function LoginForm({ className, onLoginSuccess, ...props }: LoginFormProps) {
  // Common state
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [isDev, setIsDev] = useState(false)

  // State for browser-based flow (production)
  const [clientUrl, setClientUrl] = useState<string | null>(null)

  // Hooks
  const { loginWithGoogleCode } = useAuth()

  useEffect(() => {
    window.api
      .getEnvVariables()
      .then((envVars) => {
        setIsDev(!!envVars.isDev) // Ensure it's a boolean

        if (envVars.GOOGLE_CLIENT_ID) {
          setGoogleClientId(envVars.GOOGLE_CLIENT_ID)
        } else {
          console.error('GOOGLE_CLIENT_ID not found in envVars from main process')
        }

        if (envVars.isDev) {
          // We don't need CLIENT_URL in dev mode for the popup code flow
          return
        }

        if (envVars.CLIENT_URL) {
          setClientUrl(envVars.CLIENT_URL)
        } else {
          console.error('CLIENT_URL not found for production mode')
        }
      })
      .catch((err) => {
        console.error('Error fetching env vars from main process:', err)
      })
  }, [])

  // Handler for PRODUCTION browser-based flow
  const handleProdLoginClick = useCallback(() => {
    if (!googleClientId || !clientUrl) {
      console.error('Google Client ID or Client URL not available for production login.')
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

  const handleGoogleCodeSuccess = useCallback(
    async (codeResponse: Omit<CodeResponse, 'error' | 'error_description' | 'error_uri'>) => {
      // console.log('DEV LOGIN (CODE): Got code from Google popup:', codeResponse.code)
      try {
        await loginWithGoogleCode(codeResponse.code, false)
        // console.log('DEV LOGIN (CODE): Successfully logged in via context.')
        onLoginSuccess?.()
      } catch (error) {
        // console.error('DEV LOGIN (CODE): loginWithGoogleCode failed:', error)
      }
    },
    [loginWithGoogleCode, onLoginSuccess]
  )

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleCodeSuccess,
    onError: (error) => console.error('DEV LOGIN (CODE): useGoogleLogin hook onError:', error),
    flow: 'auth-code'
  })
  // --- END NEW DEV FLOW ---

  const renderLoginButton = () => {
    if (isDev) {
      return (
        <button
          onClick={() => googleLogin()}
          disabled={!googleClientId}
          className="non-draggable-area inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <img src={GoogleLogo} alt="Google Logo" className="w-4 h-4" />
          Sign in with Google
        </button>
      )
    }

    return (
      <button
        onClick={handleProdLoginClick}
        disabled={!googleClientId || !clientUrl}
        className="non-draggable-area inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        <img src={GoogleLogo} alt="Google Logo" className="w-4 h-4" />
        Sign in with Google
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full h-screen p-8 draggable-area',
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md mx-auto rounded-lg p-8 ">
        <div className="text-center">
          <h1 className="text-2xl text-gray-800 font-semibold">
            Welcome to {APP_NAME} {isDev ? '(Dev Mode)' : ''}
          </h1>
          <p className="text-sm text-gray-600 mb-6">{APP_USP}</p>
          <p className="text-sm text-gray-600 mb-6">Sign in with your Google account</p>
        </div>
        <div className="flex justify-center">{renderLoginButton()}</div>
      </div>
    </div>
  )
}
