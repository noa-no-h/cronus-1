import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { User } from 'shared/types' // Assuming User type is in shared/types
import { trpc } from '../utils/trpc'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken?: string, userData?: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'))
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(
    localStorage.getItem('refreshToken')
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Use a query that is enabled only when a token exists.
  const {
    data: fetchedUser,
    error: userError,
    isLoading: userIsLoading,
    refetch: refetchUser
  } = trpc.auth.getUser.useQuery(
    { token: token! }, // token should not be null if enabled
    {
      enabled: !!token,
      retry: 1, // Retry once if it fails
      onSuccess: (data) => {
        setUser(data as User)
      },
      onError: (err) => {
        console.error('Failed to fetch user with token:', err)
        // Token might be invalid/expired, so log out
        logout()
      }
    }
  )

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    if (storedToken) {
      setToken(storedToken)
      // The enabled query will run if token is set
    } else {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    //isLoading should reflect the user fetching status if a token exists
    if (token && userIsLoading) {
      setIsLoading(true)
    } else if (token && (fetchedUser || userError)) {
      setIsLoading(false)
    } else if (!token) {
      setIsLoading(false)
    }
  }, [token, fetchedUser, userError, userIsLoading])

  const login = (accessToken: string, newRefreshToken?: string, userData?: User) => {
    localStorage.setItem('accessToken', accessToken)
    setToken(accessToken)
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
      setRefreshTokenState(newRefreshToken)
    }
    if (userData) {
      setUser(userData)
    } else {
      // If userData is not directly provided, rely on the query to fetch it.
      refetchUser()
    }
    setIsLoading(false) // Or let the query loading state handle this
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setToken(null)
    setRefreshTokenState(null)
    setIsLoading(false)
    // Optionally, reset tRPC query cache if needed
    // queryClient.removeQueries(); or specific queries
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated: !!user && !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
