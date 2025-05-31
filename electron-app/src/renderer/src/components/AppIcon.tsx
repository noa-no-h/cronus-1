import React, { useState } from 'react'

// Import icons
import cursorIcon from '../assets/icons/cursor.png'
import chromeIcon from '../assets/icons/chrome.png'
import safariIcon from '../assets/icons/safari.png'
import electronIcon from '../assets/icons/electron.png'
import spotifyIcon from '../assets/icons/spotify.png'
import figmaIcon from '../assets/icons/figma.png'
import notionIcon from '../assets/icons/notion.png'
import slackIcon from '../assets/icons/slack.png'
import githubIcon from '../assets/icons/github.png'
import terminalIcon from '../assets/icons/terminal.png'

interface AppIconProps {
  appName: string
  iconPath?: string | null
  size?: number
  className?: string
}

const AppIcon: React.FC<AppIconProps> = ({ appName, size = 24, className = '' }) => {
  const [iconError, setIconError] = useState(false)

  const iconMap: { [key: string]: string } = {
    Cursor: cursorIcon,
    'Google Chrome': chromeIcon,
    Safari: safariIcon,
    Electron: electronIcon,
    Spotify: spotifyIcon,
    Figma: figmaIcon,
    Notion: notionIcon,
    Slack: slackIcon,
    GitHub: githubIcon,
    Terminal: terminalIcon
  }

  // Try to find exact match or partial match
  let iconSrc = iconMap[appName]

  if (!iconSrc && !iconError) {
    // Try partial matching for apps like "Google Chrome Beta"
    const matchedKey = Object.keys(iconMap).find(
      (key) => appName.includes(key) || key.includes(appName)
    )
    if (matchedKey) {
      iconSrc = iconMap[matchedKey]
    }
  }

  // Show curated icon if available
  if (iconSrc && !iconError) {
    return (
      <img
        src={iconSrc}
        alt={`${appName} icon`}
        width={size}
        height={size}
        className={`rounded-sm ${className}`}
        onError={() => setIconError(true)}
        onLoad={() => console.log(`✅ Loaded icon for ${appName}`)}
      />
    )
  }

  // Fallback: Letter with app-specific colors
  const getAppColor = (name: string): string => {
    const colors = {
      Cursor: 'from-blue-500 to-purple-500',
      'Google Chrome': 'from-yellow-400 to-red-500',
      Safari: 'from-blue-400 to-blue-600',
      Electron: 'from-teal-400 to-cyan-500',
      Terminal: 'from-gray-700 to-gray-900',
      Slack: 'from-purple-500 to-pink-500',
      Discord: 'from-indigo-500 to-purple-600',
      Notion: 'from-gray-100 to-gray-300',
      Figma: 'from-orange-400 to-red-500'
    }
    return colors[name] || 'from-gray-400 to-gray-600'
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${getAppColor(appName)} rounded-sm text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={`${appName} (Letter fallback)`}
    >
      {appName.charAt(0).toUpperCase()}
    </div>
  )
}

export default AppIcon
