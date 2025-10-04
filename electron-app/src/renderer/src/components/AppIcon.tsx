import React, { useState, useEffect } from 'react'

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
import settingsIcon from '../assets/icons/settings.png'

interface AppIconProps {
  appName: string
  iconPath?: string | null
  size?: number
  className?: string
}

// Global cache to prevent duplicate native calls across component instances
const globalIconCache = new Map<string, string | null>()
const iconLoadingPromises = new Map<string, Promise<string | null>>()

const AppIcon: React.FC<AppIconProps> = ({ appName, size = 24, className = '' }) => {
  const [iconError, setIconError] = useState(false)
  const [nativeIconDataUrl, setNativeIconDataUrl] = useState<string | null>(null)
  const [isLoadingNativeIcon, setIsLoadingNativeIcon] = useState(false)

  const iconMap: { [key: string]: string } = {
    Cursor: cursorIcon,
    'Google Chrome': chromeIcon,
    'Google Calendar':
      'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
    Safari: safariIcon,
    Electron: electronIcon,
    Spotify: spotifyIcon,
    Figma: figmaIcon,
    Notion: notionIcon,
    Slack: slackIcon,
    GitHub: githubIcon,
    Terminal: terminalIcon,
    Settings: settingsIcon
  }

  // Try to find exact match or partial match in curated icons
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

  // Load native icon if no curated icon found
  useEffect(() => {
    if (!iconSrc && !iconError) {
      // Check global cache first
      const cacheKey = appName
      if (globalIconCache.has(cacheKey)) {
        const cachedDataUrl = globalIconCache.get(cacheKey)
        setNativeIconDataUrl(cachedDataUrl || null)
        return
      }

      // Check if we're already loading this icon
      if (iconLoadingPromises.has(cacheKey)) {
        iconLoadingPromises.get(cacheKey)?.then((dataUrl) => {
          setNativeIconDataUrl(dataUrl)
        })
        return
      }

      // Start loading if not already in progress
      if (!isLoadingNativeIcon) {
        setIsLoadingNativeIcon(true)
        
        const loadPromise = window.api
          .getAppIconPath(appName)
          .then((path) => {
            if (path) {
              return window.api
                .readFile(path)
                .then((fileData) => {
                  if (fileData) {
                    // Convert the file data to a data URL
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileData)))
                    const dataUrl = `data:image/png;base64,${base64}`
                    return dataUrl
                  }
                  return null
                })
                .catch((error) => {
                  console.error('Failed to read icon file:', error)
                  return null
                })
            }
            return null
          })
          .catch((error) => {
            console.error('Failed to get native icon for', appName, error)
            return null
          })

        iconLoadingPromises.set(cacheKey, loadPromise)

        loadPromise
          .then((dataUrl) => {
            // Cache the result (even if null)
            globalIconCache.set(cacheKey, dataUrl)
            setNativeIconDataUrl(dataUrl)
          })
          .finally(() => {
            setIsLoadingNativeIcon(false)
            iconLoadingPromises.delete(cacheKey)
          })
      }
    }
  }, [appName, iconSrc, iconError, isLoadingNativeIcon])

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
      />
    )
  }

  // Show native icon if available
  if (nativeIconDataUrl) {
    return (
      <img
        src={nativeIconDataUrl}
        alt={`${appName} icon`}
        width={size}
        height={size}
        className={`rounded-sm ${className}`}
        onError={() => setNativeIconDataUrl(null)}
      />
    )
  }

  // Fallback: Letter with app-specific colors
  const getAppColor = (name: string): string => {
    const colors = {
      Cursor: 'from-blue-500 to-purple-500',
      'Google Chrome': 'from-yellow-400 to-red-500',
      'Google Calendar': 'from-blue-500 to-indigo-600',
      Safari: 'from-blue-400 to-blue-600',
      Electron: 'from-teal-400 to-cyan-500',
      Terminal: 'from-gray-700 to-gray-900',
      Slack: 'from-purple-500 to-pink-500',
      Discord: 'from-indigo-500 to-purple-600',
      Notion: 'from-gray-100 to-gray-300',
      Figma: 'from-orange-400 to-red-500',
      Settings: 'from-gray-400 to-gray-600'
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
