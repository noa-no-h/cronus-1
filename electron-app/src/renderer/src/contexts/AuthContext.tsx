import { createContext, JSX, ReactNode, useContext, useEffect, useState } from 'react'
import { User } from 'shared/dist/types.js'
import { exchangeGoogleCodeForTokens } from '../lib/auth'
import { trpc } from '../utils/trpc'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken?: string, userData?: User) => void
  logout: () => void
  loginWithGoogleCode: (code: string, isDesktopFlow: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const {
    data: _fetchedUser,
    error: _userError,
    isLoading: userIsLoading,
    refetch: refetchUser
  } = trpc.auth.getUser.useQuery(
    { token: token! },
    {
      enabled: !!token,
      retry: 1,
      onSuccess: (data) => {
        setUser(data as User)
      },
      onError: (err) => {
        console.error('Failed to fetch user with token during query:', err)
        logout()
      }
    }
  )

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    if (!storedToken) {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        const newToken = event.newValue
        setToken(newToken)
        if (newToken) {
          refetchUser()
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refetchUser])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
    } else if (userIsLoading) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [token, userIsLoading])

  const login = (accessToken: string, newRefreshToken?: string, userData?: User) => {
    localStorage.setItem('accessToken', accessToken)
    setToken(accessToken)
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
    }
    if (userData) {
      setUser(userData)
      setIsLoading(false)
    } else {
      refetchUser()
    }
  }

  const logout = () => {
    const currentToken = localStorage.getItem('accessToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
    setIsLoading(false)
    if (currentToken) {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'accessToken',
          oldValue: currentToken,
          newValue: null,
          storageArea: localStorage
        })
      )
    }
  }

  const loginWithGoogleCode = async (code: string, isDesktopFlow: boolean) => {
    const { accessToken, refreshToken, user } = await exchangeGoogleCodeForTokens(
      code,
      isDesktopFlow
    )
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    setToken(accessToken)
    setUser(user)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        loginWithGoogleCode
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
