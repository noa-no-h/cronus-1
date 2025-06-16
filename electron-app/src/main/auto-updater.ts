import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'

let mainWindow: BrowserWindow | null = null

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
    autoUpdater.checkForUpdates()
  }, 3000)
}

export function registerAutoUpdaterHandlers(): void {
  ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdates())
  ipcMain.handle('download-update', () => autoUpdater.downloadUpdate())
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())
}
