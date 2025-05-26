import { CredentialResponse, GoogleLogin } from '@react-oauth/google'
import { cn } from '@renderer/lib/utils'
import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'

// GOOGLE_CLIENT_ID is now provided by App.tsx through GoogleOAuthProvider
// const defaultPageAfterLogin = '/' // This can be removed if not used

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onLoginSuccess?: () => void
}

export function LoginForm({ className, onLoginSuccess, ...props }: LoginFormProps) {
  const googleLoginMutation = trpc.auth.googleLogin.useMutation()
  const { login } = useAuth()

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return

      try {
        const response = await googleLoginMutation.mutateAsync({
          credential: credentialResponse.credential
        })

        login(response.accessToken, response.refreshToken, response.user)

        console.log('Electron App: Login via context successful')
        onLoginSuccess?.()
      } catch (error) {
        console.error('Electron App: Login failed:', error)
      }
    },
    [googleLoginMutation, login, onLoginSuccess]
  )

  // Removed the direct GOOGLE_CLIENT_ID check here, App.tsx handles global config check

  return (
    <div className={cn('flex flex-col gap-6 items-center w-full p-8', className)} {...props}>
      <div className="w-full max-w-md mx-auto shadow-lg rounded-lg p-8 bg-white">
        <div className="text-center">
          <h1 className="text-2xl text-gray-800 font-semibold">Welcome</h1>
          <p className="text-sm text-gray-600 mb-6">Sign in with your Google account</p>
        </div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log('Electron App: Login Failed')}
            // clientId is inherited from GoogleOAuthProvider in App.tsx
          />
        </div>
      </div>
    </div>
  )
}
