import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import fs from 'fs/promises'
import { join } from 'path'
import { Category } from 'shared/dist/types'
import icon from '../../resources/icon.png?asset'
import { nativeWindows, PermissionType } from '../native-modules/native-windows'
import { logMainToFile } from './logging'
import { redactSensitiveContent } from './redaction'
import { getActiveWindow } from './activeWindow'

export interface ActivityToRecategorize {
  identifier: string
  nameToDisplay: string
  itemType: 'app' | 'website'
  currentCategoryId: string
  currentCategoryName: string
  currentCategoryColor: string
  categoryReasoning?: string
  originalUrl?: string
}

interface Windows {
  mainWindow: BrowserWindow | null
  floatingWindow: BrowserWindow | null
}

export function registerIpcHandlers(
  windows: Windows,
  recreateFloatingWindow: () => void,
  recreateMainWindow: () => BrowserWindow
): void {
  ipcMain.on('move-floating-window', (_event, { deltaX, deltaY }) => {
    if (windows.floatingWindow) {
      const currentPosition = windows.floatingWindow.getPosition()
      const [currentX, currentY] = currentPosition
      windows.floatingWindow.setPosition(currentX + deltaX, currentY + deltaY)
    }
  })

  if (process.platform === 'darwin') {
    ipcMain.handle('get-app-icon-path', (_event, appName: string) => {
      return nativeWindows.getAppIconPath(appName)
    })
  }

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
    logMainToFile('Enabling explicit permission requests after onboarding completion')
    nativeWindows.setPermissionDialogsEnabled(true)
  })

  ipcMain.handle('start-window-tracking', () => {
    logMainToFile('Starting active window observer after onboarding completion')
    // Call the global function we set up in main/index.ts
    if ((global as any).startActiveWindowObserver) {
      ;(global as any).startActiveWindowObserver()
    } else {
      logMainToFile('ERROR: startActiveWindowObserver function not available')
    }
  })

  // Permission-related IPC handlers
  ipcMain.handle('get-permission-request-status', () => {
    return nativeWindows.getPermissionDialogsEnabled()
  })

  ipcMain.handle('get-permission-status', (_event, permissionType: PermissionType) => {
    return nativeWindows.getPermissionStatus(permissionType)
  })

  ipcMain.handle('get-permissions-for-title-extraction', () => {
    return nativeWindows.hasPermissionsForTitleExtraction()
  })

  ipcMain.handle('get-permissions-for-content-extraction', () => {
    return nativeWindows.hasPermissionsForContentExtraction()
  })

  ipcMain.handle('request-permission', (_event, permissionType: PermissionType) => {
    logMainToFile(`Manually requesting permission: ${permissionType}`)
    nativeWindows.requestPermission(permissionType)
  })

  ipcMain.handle('force-enable-permission-requests', () => {
    logMainToFile('Force enabling explicit permission requests via settings')
    nativeWindows.setPermissionDialogsEnabled(true)
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

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('get-build-date', () => {
    return import.meta.env.VITE_BUILD_DATE
  })

  ipcMain.handle('get-audio-data-url', async () => {
    try {
      let audioFilePath: string
      if (is.dev) {
        // In development, the 'public' directory is at the root of the electron-app workspace
        audioFilePath = join(__dirname, '..', '..', 'public', 'sounds', 'distraction.mp3')
      } else {
        // In production, files in 'public' are copied to the resources directory's root
        audioFilePath = join(process.resourcesPath, 'sounds', 'distraction.mp3')
      }

      console.log(`[get-audio-data-url] Attempting to read audio file from: ${audioFilePath}`)
      const buffer = await fs.readFile(audioFilePath)
      const base64 = buffer.toString('base64')
      return `data:audio/mp3;base64,${base64}`
    } catch (error) {
      console.error('[get-audio-data-url] Error reading audio file', {
        error: String(error),
        stack: (error as Error).stack
      })
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

  ipcMain.handle('capture-screenshot-and-ocr', async () => {
    try {
      const result = nativeWindows.captureScreenshotAndOCRForCurrentWindow()
      logMainToFile('Screenshot + OCR captured', {
        success: result.success,
        textLength: result.ocrText?.length || 0
      })
      return result
    } catch (error) {
      logMainToFile('Error capturing screenshot + OCR', { error: String(error) })
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('redact-sensitive-content', (_event, content: string) => {
    return redactSensitiveContent(content)
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
      if (windows.floatingWindow && !windows.floatingWindow.isDestroyed()) {
        windows.floatingWindow.webContents.send('floating-window-status-updated', data)
      } else {
        console.warn(
          'Main process: Received status update, but floatingWindow is null or destroyed.'
        )
      }
    }
  )

  ipcMain.on('request-recategorize-view', (_event, activity?: ActivityToRecategorize) => {
    if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
      windows.mainWindow.show()
      windows.mainWindow.focus()
      if (windows.mainWindow.isMinimized()) {
        windows.mainWindow.restore()
      }
      windows.mainWindow.webContents.send('display-recategorize-page', activity)
    } else {
      // Main window is closed - recreate it
      console.log('Main window closed, recreating for recategorization...')
      windows.mainWindow = recreateMainWindow()

      // Wait for window to load, then send recategorize request
      windows.mainWindow.webContents.once('did-finish-load', () => {
        if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
          windows.mainWindow.webContents.send('display-recategorize-page', activity)
        }
      })
    }
  })

  ipcMain.on('open-main-app-window', () => {
    if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
      windows.mainWindow.show()
      windows.mainWindow.focus()
    } else {
      logMainToFile('Main window not available, recreating it.')
      windows.mainWindow = recreateMainWindow()
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
        if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
          if (windows.mainWindow.isMinimized()) windows.mainWindow.restore()
          windows.mainWindow.focus()
        } else {
          console.warn('Main window not available when notification clicked')
        }
      })

      notification.on('action', (_event, index) => {
        logMainToFile(`Notification action clicked, index: ${index}`)
        if (index === 0) {
          // Corresponds to the 'Edit' button
          if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
            if (windows.mainWindow.isMinimized()) windows.mainWindow.restore()
            windows.mainWindow.focus()
          } else {
            console.warn('Main window not available when notification action clicked')
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

  ipcMain.handle('on-auth-code-received', (event, code: string) => {
    logMainToFile('Auth code received in main process', { code: code.substring(0, 10) + '...' })

    if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
      windows.mainWindow.webContents.send('auth-code-received', code)
    }
  })

  // only using this for windows support
  ipcMain.handle('get-active-window', async () => {
    return await getActiveWindow()
  })

  // ipcMain.handle(
  //   'set-sentry-user',
  //   (
  //     _event,
  //     userData: { id: string; email: string; username: string; subscription: boolean } | null
  //   ) => {
  //     Sentry.setUser(userData)
  //     logMainToFile('Sentry user context updated', { userId: userData?.id, email: userData?.email })
  //   }
  // )
}
