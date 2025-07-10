import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null
let dailyUpdateTimer: NodeJS.Timeout | null = null

export function initializeAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', { status: 'not-available' })
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-status', {
      status: 'error',
      error: err.message
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-status', {
      status: 'downloading',
      progress: progressObj.percent
    })
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-status', { status: 'downloaded' })
  })

  // Check for updates on startup (only in production)
  if (!app.isPackaged) return

  setTimeout(() => {
    checkForUpdatesIfNeeded('startup')
  }, 3000)

  // Setup daily timer for users who keep app open
  setupDailyUpdateCheck()
}

function checkForUpdatesIfNeeded(trigger: string): void {
  const lastCheckTime = getLastCheckTime()
  const now = Date.now()
  const hoursSinceLastCheck = lastCheckTime === 0 ? 999 : (now - lastCheckTime) / (1000 * 60 * 60)

  console.log(
    `🔍 Update check (${trigger}): ${hoursSinceLastCheck === 999 ? 'never checked before' : hoursSinceLastCheck.toFixed(1) + ' hours ago'}`
  )

  // Check if it's been more than 20 hours since last check, or never checked
  if (hoursSinceLastCheck >= 20) {
    console.log(`✅ Triggering update check (${trigger})`)
    saveLastCheckTime(now)
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('Update check failed:', error)
    })
  } else {
    console.log(
      `⏸️ Skipping update check - checked ${hoursSinceLastCheck.toFixed(1)} hours ago (${trigger})`
    )
  }
}

function setupDailyUpdateCheck(): void {
  // Clear any existing timer
  if (dailyUpdateTimer) {
    clearTimeout(dailyUpdateTimer)
    dailyUpdateTimer = null
  }

  const now = new Date()
  const next3AM = new Date()

  // 3 AM
  next3AM.setHours(3, 0, 0, 0)

  // If it's already past 3 AM today, schedule for tomorrow
  if (now.getHours() >= 3) {
    next3AM.setDate(next3AM.getDate() + 1)
  }

  const msUntil3AM = next3AM.getTime() - now.getTime()

  console.log(`📅 Next daily update check scheduled for: ${next3AM.toLocaleString()}`)

  dailyUpdateTimer = setTimeout(() => {
    console.log('🔄 Daily update check triggered at 3 AM')
    checkForUpdatesIfNeeded('daily_timer')

    // Reschedule for next day
    setupDailyUpdateCheck()
  }, msUntil3AM)
}

function getLastCheckTime(): number {
  try {
    const userDataPath = app.getPath('userData')
    const updateConfigPath = path.join(userDataPath, 'update-config.json')

    if (fs.existsSync(updateConfigPath)) {
      const configData = fs.readFileSync(updateConfigPath, 'utf8')
      const config = JSON.parse(configData)
      return config.lastUpdateCheckTime || 0
    }
  } catch (error) {
    console.error('Failed to read last check time:', error)
  }
  return 0
}

function saveLastCheckTime(timestamp: number): void {
  try {
    const userDataPath = app.getPath('userData')
    const updateConfigPath = path.join(userDataPath, 'update-config.json')

    const config = { lastUpdateCheckTime: timestamp }
    fs.writeFileSync(updateConfigPath, JSON.stringify(config, null, 2))
    console.log(`💾 Saved last update check time: ${new Date(timestamp).toLocaleString()}`)
  } catch (error) {
    console.error('Failed to save last check time:', error)
  }
}

export function registerAutoUpdaterHandlers(): void {
  ipcMain.handle('check-for-updates', () => {
    console.log('🖱️ Manual update check requested')
    const now = Date.now()
    saveLastCheckTime(now)
    return autoUpdater.checkForUpdates()
  })
  ipcMain.handle('download-update', () => autoUpdater.downloadUpdate())
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())
}

export function cleanupAutoUpdater(): void {
  if (dailyUpdateTimer) {
    clearTimeout(dailyUpdateTimer)
    dailyUpdateTimer = null
    console.log('🧹 Daily update timer cleaned up')
  }
}
