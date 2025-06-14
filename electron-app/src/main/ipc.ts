import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import fs from 'fs/promises'
import { join } from 'path'
import { Category } from 'shared/dist/types'
import icon from '../../resources/icon.png?asset'
import { nativeWindows } from '../native-modules/native-windows'
import { logMainToFile } from './logging'

interface Windows {
  mainWindow: BrowserWindow | null
  floatingWindow: BrowserWindow | null
}

export function registerIpcHandlers(windows: Windows, recreateFloatingWindow: () => void): void {
  ipcMain.on('move-floating-window', (_event, { deltaX, deltaY }) => {
    if (windows.floatingWindow) {
      const currentPosition = windows.floatingWindow.getPosition()
      const [currentX, currentY] = currentPosition
      windows.floatingWindow.setPosition(currentX + deltaX, currentY + deltaY)
    }
  })

  ipcMain.on('hide-floating-window', () => {
    if (windows.floatingWindow && windows.floatingWindow.isVisible()) {
      windows.floatingWindow.hide()
    }
  })

  ipcMain.on('show-floating-window', () => {
    if (windows.floatingWindow) {
      if (!windows.floatingWindow.isVisible()) {
        windows.floatingWindow.show()
      }
    } else {
      recreateFloatingWindow()
    }
  })

  ipcMain.handle('set-open-at-login', (_event, enable: boolean) => {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true
      })
    }
  })

  ipcMain.handle('enable-permission-requests', () => {
    logMainToFile('Enabling permission requests after onboarding completion')
    nativeWindows.setShouldRequestPermissions(true)
  })

  ipcMain.on('open-external-url', (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('get-floating-window-visibility', () => {
    return windows.floatingWindow?.isVisible() ?? false
  })

  ipcMain.on('log-to-file', (_event, _message: string, _data?: object) => {
    // logRendererToFile(message, data)
  })

  ipcMain.handle('get-env-vars', () => {
    return {
      isDev: is.dev,
      GOOGLE_CLIENT_ID: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID,
      POSTHOG_KEY: import.meta.env.MAIN_VITE_POSTHOG_KEY,
      CLIENT_URL: import.meta.env.MAIN_VITE_CLIENT_URL,
      POSTHOG_HOST: import.meta.env.MAIN_VITE_POSTHOG_HOST,
      GOOGLE_CLIENT_SECRET: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET
    }
  })

  ipcMain.handle('get-audio-data-url', async () => {
    try {
      const audioFilePath = join(app.getAppPath(), 'public', 'sounds', 'distraction.mp3')
      const buffer = await fs.readFile(audioFilePath)
      const base64 = buffer.toString('base64')
      return `data:audio/mp3;base64,${base64}`
    } catch (error) {
      console.error('Error reading audio file for data URL:', error)
      return null
    }
  })

  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      const buffer = await fs.readFile(filePath)
      return buffer
    } catch (error) {
      console.error('Error reading file:', error)
      throw error
    }
  })

  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error('Error deleting file via IPC:', error)
    }
  })

  ipcMain.on(
    'update-floating-window-status',
    (
      _event,
      data: {
        latestStatus: 'productive' | 'unproductive' | 'maybe' | null
        dailyProductiveMs: number
        dailyUnproductiveMs: number
        categoryName?: string
        categoryDetails?: Category
      }
    ) => {
      if (windows.floatingWindow) {
        windows.floatingWindow.webContents.send('floating-window-status-updated', data)
      } else {
        console.warn('Main process: Received status update, but floatingWindow is null.')
      }
    }
  )

  ipcMain.on('request-recategorize-view', (_event, categoryDetails?: Category) => {
    if (windows.mainWindow) {
      windows.mainWindow.show()
      windows.mainWindow.focus()

      if (windows.mainWindow.isMinimized()) {
        windows.mainWindow.restore()
      }
      windows.mainWindow.webContents.send('display-recategorize-page', categoryDetails)
    } else {
      console.error(
        'Main Process: ERROR: mainWindow is not available when "request-recategorize-view" was received.'
      )
    }
  })

  ipcMain.on('open-main-app-window', () => {
    if (windows.mainWindow) {
      windows.mainWindow.show()
      windows.mainWindow.focus()
    }
  })

  ipcMain.on('show-notification', (_event, { title, body }) => {
    logMainToFile('Received show-notification request', { title, body })
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: process.platform === 'win32' ? icon : undefined,
        actions: [{ type: 'button', text: 'Edit' }]
      })

      notification.on('click', () => {
        logMainToFile('Notification clicked. Focusing main window.')
        if (windows.mainWindow) {
          if (windows.mainWindow.isMinimized()) windows.mainWindow.restore()
          windows.mainWindow.focus()
        }
      })

      notification.on('action', (_event, index) => {
        logMainToFile(`Notification action clicked, index: ${index}`)
        if (index === 0) {
          // Corresponds to the 'Edit' button
          if (windows.mainWindow) {
            if (windows.mainWindow.isMinimized()) windows.mainWindow.restore()
            windows.mainWindow.focus()
          }
        }
      })

      notification.show()
    } else {
      logMainToFile('Notifications not supported on this system.')
    }
  })

  // This is a workaround for the main window's webContents being unavailable
  // when the renderer is ready.
  ipcMain.on('ping', () => console.log('pong'))

  windows.mainWindow?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com/')) {
      if (is.dev) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 600,
            height: 700,
            autoHideMenuBar: true,
            webPreferences: {}
          }
        }
      } else {
        shell.openExternal(url)
        return { action: 'deny' }
      }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })
}
