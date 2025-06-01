import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Theme } from '../../contexts/ThemeContext'
import { useTheme } from '../../contexts/ThemeContext'
import { trpc } from '../../utils/trpc'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { token } = useAuth()
  const [previousTheme, setPreviousTheme] = useState<Theme>(theme)

  // Fetch electron app settings
  const { data: electronAppSettings, isLoading: isLoadingSettings } =
    trpc.user.getElectronAppSettings.useQuery(
      { token: token || '' },
      {
        enabled: !!token,
        onSuccess: (data) => {
          if (data && 'theme' in data && data.theme) {
            const backendTheme = data.theme as 'light' | 'dark' | 'system'
            setTheme(backendTheme)
            setPreviousTheme(backendTheme)
          }
        },
        onError: (error) => {
          console.error('Failed to fetch theme settings:', error)
          // Optionally, set a default theme or rely on localStorage/context default
          // For now, just logging the error. The context will use its default or localStorage.
        }
      }
    )

  // Update electron app settings mutation
  const updateSettingsMutation = trpc.user.updateElectronAppSettings.useMutation({
    onError: (error) => {
      console.error('Failed to update theme:', error)
      // Revert to the previous theme on error
      setTheme(previousTheme)
      // alert('Failed to save theme preference. Please try again.'); // Optional: notify user
    }
    // We can also refetch settings on success/settled if needed, but not strictly necessary here
  })

  // This effect synchronizes the local previousTheme state if the theme is changed by other means
  // (e.g. initial load from context/localStorage before backend sync)
  useEffect(() => {
    setPreviousTheme(theme)
  }, [theme])

  const handleSetTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setPreviousTheme(theme) // Store current theme as previous before attempting change
    setTheme(newTheme) // Optimistically update UI

    if (token) {
      updateSettingsMutation.mutate({
        token,
        theme: newTheme
      })
    } else {
      // If no token, revert or handle locally (e.g. rely on localStorage in ThemeContext)
      // For now, we assume if there's no token, ThemeContext's localStorage is the source of truth
      localStorage.setItem('theme', newTheme)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="p-6 bg-card rounded-lg">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Theme</h2>
        <div className="animate-pulse">
          <div className="flex space-x-2">
            <div className="h-10 w-20 bg-muted rounded-md"></div>
            <div className="h-10 w-20 bg-muted rounded-md"></div>
            <div className="h-10 w-20 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-card rounded-lg">
      <h2 className="text-xl font-semibold text-card-foreground mb-4">Theme</h2>
      <div className="flex space-x-2">
        <button
          onClick={() => handleSetTheme('light')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
          disabled={updateSettingsMutation.isLoading}
        >
          Light
        </button>
        <button
          onClick={() => handleSetTheme('dark')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
          disabled={updateSettingsMutation.isLoading}
        >
          Dark
        </button>
        <button
          onClick={() => handleSetTheme('system')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'system'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
          disabled={updateSettingsMutation.isLoading}
        >
          System
        </button>
      </div>
    </div>
  )
}
