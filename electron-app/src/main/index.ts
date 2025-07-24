import { is, optimizer } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import { app, BrowserWindow, session } from 'electron'
import { ActiveWindowDetails } from 'shared/dist/types.js'
import { initializeAutoUpdater, registerAutoUpdaterHandlers } from './auto-updater'
import { registerIpcHandlers } from './ipc'
import { initializeLoggers } from './logging'
import {
  getUrlToHandleOnReady,
  handleAppUrl,
  setupProtocolHandlers,
  setupSingleInstanceLock
} from './protocol'
import { createFloatingWindow, createMainWindow } from './windows'
import { getActiveWindow } from './activeWindow'
import os from 'os'

// Explicitly load .env files to ensure production run-time app uses the correct .env file
dotenv.config({ path: is.dev ? '.env.development' : '.env.production' })

let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null

// Define the type for your nativeWindows module (customize as needed)
type NativeWindows = {
  startActiveWindowObserver: (callback: (windowInfo: ActiveWindowDetails | null) => void) => void
  // Add other methods if needed
}

function App() {
  async function initializeApp() {
    await initializeLoggers()

    if (!setupSingleInstanceLock(() => mainWindow)) {
      return
    }

    // Set a different AppUserModelId for development to allow dev and prod to run side-by-side.
    if (is.dev) {
      app.setAppUserModelId('com.cronus.app.dev')
    } else {
      app.setAppUserModelId('com.cronus.app')
    }

    if (process.platform === 'darwin') {
      await app.dock?.show()
    }

    setupCsp()
    setupProtocolHandlers(() => mainWindow)

    mainWindow = createMainWindow(getUrlToHandleOnReady, (url, window) => handleAppUrl(url, window))
    initializeAutoUpdater(mainWindow)
    floatingWindow = createFloatingWindow(() => mainWindow)

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    if (floatingWindow) {
      floatingWindow.on('closed', () => {
        floatingWindow = null
      })
    }

    const recreateMainWindow = (): BrowserWindow => {
      mainWindow = createMainWindow(getUrlToHandleOnReady, (url, window) =>
        handleAppUrl(url, window)
      )
      return mainWindow
    }

    const recreateFloatingWindow = (): void => {
      if (!floatingWindow) {
        floatingWindow = createFloatingWindow(() => mainWindow)
      }
    }

    registerIpcHandlers({ mainWindow, floatingWindow }, recreateFloatingWindow, recreateMainWindow)
    registerAutoUpdaterHandlers()

    // Don't start observing active window changes immediately
    // This will be started after onboarding is complete via IPC call
    // Store the callback for later use
    const windowChangeCallback = (windowInfo: ActiveWindowDetails | null) => {
      if (windowInfo && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('active-window-changed', windowInfo)
      }
    }

    // Make the callback available to IPC handlers
    let nativeWindows: NativeWindows | undefined
    if (process.platform === 'darwin') {
      nativeWindows = (await import('../native-modules/native-windows')).nativeWindows
    }
    ;(global as any).startActiveWindowObserver = () => {
      nativeWindows?.startActiveWindowObserver(windowChangeCallback)
    }

    if (os.platform() === 'win32') {
      setInterval(async () => {
        try {
          const win = await getActiveWindow()
          if (win && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('active-window-changed', win)
          }
        } catch (e) {
          console.error('Error getting active window:', e)
        }
      }, 1000)
    }

    // Handle app activation (e.g., clicking the dock icon on macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow(getUrlToHandleOnReady, (url, window) =>
          handleAppUrl(url, window)
        )
      } else {
        // If there are windows (like the floating window), show the main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
        } else {
          // Main window doesn't exist, recreate it
          mainWindow = createMainWindow(getUrlToHandleOnReady, (url, window) =>
            handleAppUrl(url, window)
          )
        }
      }
    })
  }

  function setupCsp() {
    const devServerURL = 'http://localhost:5173'
    const serverUrl = import.meta.env.MAIN_VITE_SERVER_URL || 'http://localhost:3001'
    const csp = `default-src 'self'; script-src 'self' 'unsafe-eval' https://accounts.google.com https://*.googleusercontent.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://*.loom.com https://*.prod-east.frontend.public.atl-paas.net https://cdn.segment.com ${is.dev ? "'unsafe-inline' " + devServerURL : ''}; style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.gstatic.com https://*.loom.com https://*.prod-east.frontend.public.atl-paas.net; font-src 'self' https://fonts.gstatic.com https://*.loom.com https://*.prod-east.frontend.public.atl-paas.net; media-src 'self' data: blob: https://cdn.loom.com https://*.loom.com; img-src * data:; frame-src https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com https://*.loom.com; connect-src 'self' http://localhost:3001 http://127.0.0.1:3001 https://play.google.com https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com https://*.loom.com https://api-private.atlassian.com https://as.atlassian.com https://*.sentry.io https://api.segment.io https://cdn.segment.com https://*.prod-east.frontend.public.atl-paas.net https://whatdidyougetdonetoday.s3.us-east-1.amazonaws.com https://whatdidyougetdonetoday.s3.amazonaws.com https://us.i.posthog.com https://eu.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://whatdidyougetdonetoday-ai-server.onrender.com ${is.dev ? devServerURL : ''}; worker-src 'self' blob:`

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
          'Cross-Origin-Opener-Policy': ['unsafe-none']
        }
      })
    })
  }

  app.whenReady().then(initializeApp)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}

App()
