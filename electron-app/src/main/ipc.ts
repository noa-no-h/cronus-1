import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import fs from 'fs/promises'
import { join } from 'path'
import { Category } from 'shared/dist/types'
import icon from '../../resources/icon.png?asset'
import { nativeWindows, PermissionType } from '../native-modules/native-windows'
import { logMainToFile } from './logging'
import { redactSensitiveContent } from './redaction'
import { setAllowForcedQuit } from './windows'

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

// Helper function to format duration for display
function formatDurationForDisplay(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
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

  ipcMain.handle('get-app-icon-path', (_event, appName: string) => {
    return nativeWindows.getAppIconPath(appName)
  })

  ipcMain.on('hide-floating-window', () => {
    if (windows.floatingWindow && windows.floatingWindow.isVisible()) {
      windows.floatingWindow.hide()
    }
  })

  ipcMain.on('show-floating-window', () => {
    try {
      if (windows.floatingWindow && !windows.floatingWindow.isDestroyed()) {
        if (!windows.floatingWindow.isVisible()) {
          windows.floatingWindow.show()
        }
      } else {
        console.log('Creating new floating window...')
        recreateFloatingWindow()

        // Give the floating window a moment to initialize before showing
        if (windows.floatingWindow && !windows.floatingWindow.isDestroyed()) {
          setTimeout(() => {
            if (windows.floatingWindow && !windows.floatingWindow.isDestroyed()) {
              windows.floatingWindow.show()
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error in show-floating-window handler:', error)
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

  ipcMain.handle('pause-window-tracking', () => {
    logMainToFile('Pausing active window observer')
    // Call the global function to stop tracking
    if ((global as any).stopActiveWindowObserver) {
      ;(global as any).stopActiveWindowObserver()
    } else {
      logMainToFile('ERROR: stopActiveWindowObserver function not available')
    }
  })

  ipcMain.handle('resume-window-tracking', () => {
    logMainToFile('Resuming active window observer')
    // Call the global function to start tracking again
    if ((global as any).startActiveWindowObserver) {
      ;(global as any).startActiveWindowObserver()
    } else {
      logMainToFile('ERROR: startActiveWindowObserver function not available')
    }
  })

  // for pausing the timer when tracking is paused
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
        isTrackingPaused?: boolean,
        totalDurationMs?: number  // Make sure this field is populated
      }
    ) => {
      if (
        windows.floatingWindow &&
        !windows.floatingWindow.isDestroyed() &&
        !windows.floatingWindow.webContents.isDestroyed()
      ) {
        windows.floatingWindow.webContents.send('floating-window-status-updated', data)
      } else {
        console.warn(
          'Main process: Received status update, but floatingWindow is null or destroyed.'
        )
      }
    }
  )

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
    const env = {
      isDev: is.dev,
      MAIN_VITE_OPENAI_API_KEY: import.meta.env.MAIN_VITE_OPENAI_API_KEY,
      MAIN_VITE_OPENROUTER_API_KEY: import.meta.env.MAIN_VITE_OPENROUTER_API_KEY,
      GOOGLE_CLIENT_ID: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID,
      POSTHOG_KEY: import.meta.env.MAIN_VITE_POSTHOG_KEY,
      CLIENT_URL: import.meta.env.MAIN_VITE_CLIENT_URL,
      POSTHOG_HOST: import.meta.env.MAIN_VITE_POSTHOG_HOST,
      GOOGLE_CLIENT_SECRET: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET
    }
    return env
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

  // Handler for quit confirmation modal
  ipcMain.handle('confirm-quit', () => {
    logMainToFile('User confirmed quit, closing app')

    // Allow the app to quit normally when user confirms
    setAllowForcedQuit(true)

    if (windows.mainWindow && !windows.mainWindow.isDestroyed()) {
      windows.mainWindow.destroy()
    }

    if (windows.floatingWindow && !windows.floatingWindow.isDestroyed()) {
      windows.floatingWindow.destroy()
    }

    app.quit()
  })

  // SketchyBar integration - export category data to JSON file
  ipcMain.handle('export-categories-for-sketchybar', async (_event, categoryData: any[], mostRecentCategoryId?: string | null) => {
    try {
      const tempDir = app.getPath('temp')
      const dataPath = join(tempDir, 'cronus-category-data.json')
      
      const exportData = {
        timestamp: new Date().toISOString(),
        mostRecentCategoryId: mostRecentCategoryId,
        categories: categoryData.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          emoji: cat.emoji,
          isProductive: cat.isProductive,
          totalDurationMs: cat.totalDurationMs,
          // Format duration for display
          formattedDuration: formatDurationForDisplay(cat.totalDurationMs)
        }))
      }
      
      await fs.writeFile(dataPath, JSON.stringify(exportData, null, 2))
      logMainToFile('Exported category data for SketchyBar', { dataPath, categoriesCount: categoryData.length, mostRecentCategory: mostRecentCategoryId })
      
      return { success: true, path: dataPath }
    } catch (error) {
      logMainToFile('Failed to export category data for SketchyBar', { error: String(error) })
      return { success: false, error: String(error) }
    }
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

// Make the floating window disappear and reappear every minute
export function startFloatingWindowBlinker(windows: Windows) {
  setInterval(() => {
    if (
      windows.floatingWindow &&
      !windows.floatingWindow.isDestroyed() &&
      windows.floatingWindow.isVisible()
    ) {
      windows.floatingWindow.hide()
      setTimeout(() => {
        if (
          windows.floatingWindow &&
          !windows.floatingWindow.isDestroyed() &&
          !windows.floatingWindow.isVisible()
        ) {
          windows.floatingWindow.showInactive() // <-- does not steal focus
        }
      }, 100)
    }
  }, 60 * 1000) // every 60 seconds
}

// Call this function after creating the floating window and registering IPC handlers
// Example usage (in your main process entry point):
// startFloatingWindowBlinker(windows)
