import { Settings as SettingsIcon } from 'lucide-react'

interface AppHeaderProps {
  onSettingsClick: () => void
}

export function AppHeader({ onSettingsClick }: AppHeaderProps): React.JSX.Element {
  return (
    <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 h-16">
      <div className="flex justify-between items-center h-16 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Productivity Dashboard
        </h1>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
        >
          <SettingsIcon size={24} />
        </button>
      </div>
    </div>
  )
}
