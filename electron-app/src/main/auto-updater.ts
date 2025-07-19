import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import * as fs from 'fs'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null
let updateTimer: NodeJS.Timeout | null = null

export function initializeAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  autoUpdater.logger = log
  log.transports.file.level = 'info'

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    mainWindow?.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info)
    mainWindow?.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available.')
    mainWindow?.webContents.send('update-status', { status: 'not-available' })
  })

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err)
    // Sentry.captureException(err)
    mainWindow?.webContents.send('update-status', {
      status: 'error',
      error: err.message
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`)
    mainWindow?.webContents.send('update-status', {
      status: 'downloading',
      progress: progressObj.percent
    })
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded.')
    mainWindow?.webContents.send('update-status', { status: 'downloaded' })
  })

  // Check for updates on startup (only in production)
  if (!app.isPackaged) return

  setTimeout(() => {
    checkForUpdatesIfNeeded('startup')
  }, 3000)

  // Setup daily timer for users who keep app open
  // setupDailyUpdateCheck()

  // Setup hourly timer for users who keep app open
  setupHourlyUpdateCheck()
}

function checkForUpdatesIfNeeded(trigger: string): void {
  const lastCheckTime = getLastCheckTime()
  const now = Date.now()
  const hoursSinceLastCheck = lastCheckTime === 0 ? 999 : (now - lastCheckTime) / (1000 * 60 * 60)

  log.info(
    `🔍 Update check (${trigger}): ${hoursSinceLastCheck === 999 ? 'never checked before' : hoursSinceLastCheck.toFixed(1) + ' hours ago'}`
  )

  // Check if it's been more than 1 hour since last check, or never checked
  if (hoursSinceLastCheck >= 1) {
    log.info(`✅ Triggering update check (${trigger})`)
    saveLastCheckTime(now)
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('Update check failed:', error)
      // Sentry.captureException(error)
    })
  } else {
    log.info(
      `⏸️ Skipping update check - checked ${hoursSinceLastCheck.toFixed(1)} hours ago (${trigger})`
    )
  }
}

// function setupDailyUpdateCheck(): void {
//   // Clear any existing timer
//   if (updateTimer) {
//     clearTimeout(updateTimer)
//     updateTimer = null
//   }

//   const now = new Date()
//   const next3AM = new Date()

//   // 3 AM
//   next3AM.setHours(3, 0, 0, 0)

//   // If it's already past 3 AM today, schedule for tomorrow
//   if (now.getHours() >= 3) {
//     next3AM.setDate(next3AM.getDate() + 1)
//   }

//   const msUntil3AM = next3AM.getTime() - now.getTime()

//   console.log(`📅 Next daily update check scheduled for: ${next3AM.toLocaleString()}`)

//   updateTimer = setTimeout(() => {
//     console.log('🔄 Daily update check triggered at 3 AM')
//     checkForUpdatesIfNeeded('daily_timer')

//     // Reschedule for next day
//     setupDailyUpdateCheck()
//   }, msUntil3AM)
// }

function setupHourlyUpdateCheck(): void {
  // Clear any existing timer
  if (updateTimer) {
    clearTimeout(updateTimer)
    updateTimer = null
  }

  // Schedule next check in 1 hour (3600000 ms)
  const msUntilNextHour = 3600000

  log.info(
    `📅 Next hourly update check scheduled for: ${new Date(Date.now() + msUntilNextHour).toLocaleString()}`
  )

  updateTimer = setTimeout(() => {
    log.info('🔄 Hourly update check triggered')
    checkForUpdatesIfNeeded('hourly_timer')

    // Reschedule for next hour
    setupHourlyUpdateCheck()
  }, msUntilNextHour)
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
    log.error('Failed to read last check time:', error)
  }
  return 0
}

function saveLastCheckTime(timestamp: number): void {
  try {
    const userDataPath = app.getPath('userData')
    const updateConfigPath = path.join(userDataPath, 'update-config.json')

    const config = { lastUpdateCheckTime: timestamp }
    fs.writeFileSync(updateConfigPath, JSON.stringify(config, null, 2))
    log.info(`💾 Saved last update check time: ${new Date(timestamp).toLocaleString()}`)
  } catch (error) {
    log.error('Failed to save last check time:', error)
  }
}

export function registerAutoUpdaterHandlers(): void {
  ipcMain.handle('check-for-updates', () => {
    log.info('🖱️ Manual update check requested')
    const now = Date.now()
    saveLastCheckTime(now)
    return autoUpdater.checkForUpdates()
  })
  ipcMain.handle('download-update', () => {
    try {
      return autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('Error downloading update:', error)
      // Sentry.captureException(error)
      throw error
    }
  })
  ipcMain.handle('install-update', () => {
    log.info('Requesting to quit and install update.')
    autoUpdater.quitAndInstall()
  })
}

export function cleanupAutoUpdater(): void {
  if (updateTimer) {
    clearTimeout(updateTimer)
    updateTimer = null
    log.info('🧹 Hourly update timer cleaned up')
  }
}
