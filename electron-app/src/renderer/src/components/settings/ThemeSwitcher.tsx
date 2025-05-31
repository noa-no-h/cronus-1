import { useTheme } from '../../contexts/ThemeContext'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-6 bg-card rounded-lg">
      <h2 className="text-xl font-semibold text-card-foreground mb-4">Theme</h2>
      <div className="flex space-x-2">
        <button
          onClick={() => setTheme('light')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            theme === 'system'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent text-muted-foreground'
          }`}
        >
          System
        </button>
      </div>
    </div>
  )
}
