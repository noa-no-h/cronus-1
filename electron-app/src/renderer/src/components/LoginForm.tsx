import { CodeResponse, useGoogleLogin } from '@react-oauth/google'
import { usePostHog } from 'posthog-js/react'
import { useCallback, useEffect, useState } from 'react'
import { APP_USP } from '../App'
import GoogleLogo from '../assets/icons/google.png'
import LogoWithTextDark from '../assets/logo-with-text-dark-mode.png'
import LogoWithTextLight from '../assets/logo-with-text-light-mode.png'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../lib/utils'

console.log("\n\nCONSOLE LOG!! (LoginForm.tsx loaded)\n\n")
interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onLoginSuccess?: () => void
}

export function LoginForm({ className, onLoginSuccess, ...props }: LoginFormProps) {
  console.log('[LoginForm] window.location.origin:', window.location.origin);
  const { theme } = useTheme()
  const posthog = usePostHog()
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    posthog?.capture('viewed_login_form')
  }, [])

  // Common state
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [isDev, setIsDev] = useState(false)

  // State for browser-based flow (production)
  const [clientUrl, setClientUrl] = useState<string | null>(null)

  // Hooks
  const { loginWithGoogleCode } = useAuth()

  useEffect(() => {
    console.log('[LoginForm] useEffect running');
    if (!window.api) {
      console.error('[LoginForm] window.api is undefined!');
      return;
    }
    window.api
      .getEnvVariables()
      .then((envVars) => {
        console.log('[LoginForm] envVars loaded:', envVars);
        setIsDev(!!envVars.isDev); // Ensure it's a boolean

        if (envVars.GOOGLE_CLIENT_ID) {
          console.log('[LoginForm] GOOGLE_CLIENT_ID found');
          setGoogleClientId(envVars.GOOGLE_CLIENT_ID);
        } else {
          console.error('[LoginForm] GOOGLE_CLIENT_ID not found in envVars from main process');
        }

        if (envVars.isDev) {
          console.log('[LoginForm] isDev is true, skipping CLIENT_URL');
          // We don't need CLIENT_URL in dev mode for the popup code flow
          return;
        }

        if (envVars.CLIENT_URL) {
          console.log('[LoginForm] CLIENT_URL found');
          setClientUrl(envVars.CLIENT_URL);
        } else {
          console.error('[LoginForm] CLIENT_URL not found for production mode');
        }
      })
      .catch((err) => {
        console.error('[LoginForm] Error fetching env vars from main process:', err);
      });
  }, []);

  // Handler for PRODUCTION browser-based flow
  const handleProdLoginClick = useCallback(() => {
    posthog?.capture('initiated_login', { login_type: 'production' })
    if (!googleClientId || !clientUrl) {
      console.error('Google Client ID or Client URL not available for production login.')
      return
    }

    const redirectWebAppSiteUri = `${clientUrl}/electron-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', redirectWebAppSiteUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set(
      'scope',
      'openid profile email https://www.googleapis.com/auth/calendar.readonly'
      // 'openid profile email'
    );
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent'); // Important to get a refresh token every time

    // Log the redirect URI and full OAuth URL
    console.log('Google OAuth redirect_uri:', redirectWebAppSiteUri);
    console.log('Full Google OAuth URL:', authUrl.toString());

    window.api.openExternalUrl(authUrl.toString());
  }, [googleClientId, clientUrl])

  const handleGoogleCodeSuccess = useCallback(
    async (codeResponse: Omit<CodeResponse, 'error' | 'error_description' | 'error_uri'>) => {
      // console.log('DEV LOGIN (CODE): Got code from Google popup:', codeResponse.code)
      try {
        await loginWithGoogleCode(codeResponse.code, false)
        posthog?.capture('login_success')
        // console.log('DEV LOGIN (CODE): Successfully logged in via context.')
        onLoginSuccess?.()
      } catch (error: unknown) {
        console.error('DEV LOGIN (CODE): loginWithGoogleCode failed:', error)
      }
    },
    [loginWithGoogleCode, onLoginSuccess]
  )

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleCodeSuccess,
    onError: (error) => console.error('DEV LOGIN (CODE): useGoogleLogin hook onError:', error),
    flow: 'auth-code',
    scope: 'openid profile email https://www.googleapis.com/auth/calendar.readonly'
    // scope: 'openid profile email'
  })

  const renderLoginButton = () => {
    if (isDev) {
      return (
        <button
          onClick={() => {
            posthog?.capture('initiated_login', { login_type: 'development' })
            googleLogin()
          }}
          disabled={!googleClientId}
          className="non-draggable-area inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 disabled:opacity-50"
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
        className="non-draggable-area inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 disabled:opacity-50"
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
      <div className="w-full max-w-lg mx-auto rounded-lg p-8">
        <div className="text-center">
          <div className="mb-2 flex flex-col items-center justify-center">
            <img
              src={isDarkMode ? LogoWithTextDark : LogoWithTextLight}
              alt="Cronus"
              className="h-24 mx-auto"
            />
            {isDev && <p className="text-xs text-muted-foreground mt-2">dev mode</p>}
          </div>

          <p className="text-lg text-muted-foreground mb-6">{APP_USP}</p>
        </div>
        <div className="flex justify-center">{renderLoginButton()}</div>
      </div>
    </div>
  )
}
