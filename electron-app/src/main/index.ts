import { is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, session } from 'electron'
import { ActiveWindowDetails } from 'shared/dist/types.js'
import { nativeWindows } from '../native-modules/native-windows'
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

// for testing
// console.log('GH_TOKEN in main process:', process.env.GH_TOKEN)

let mainWindow: BrowserWindow | null
let floatingWindow: BrowserWindow | null

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

    const recreateFloatingWindow = (): void => {
      if (!floatingWindow) {
        floatingWindow = createFloatingWindow(() => mainWindow)
      }
    }

    registerIpcHandlers({ mainWindow, floatingWindow }, recreateFloatingWindow)
    registerAutoUpdaterHandlers()

    // Start observing active window changes
    nativeWindows.startActiveWindowObserver((windowInfo: ActiveWindowDetails | null) => {
      if (windowInfo && mainWindow) {
        mainWindow.webContents.send('active-window-changed', windowInfo)
      }
    })

    // Handle app activation (e.g., clicking the dock icon on macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow(getUrlToHandleOnReady, (url, window) =>
          handleAppUrl(url, window)
        )
      }
    })
  }

  function setupCsp() {
    const devServerURL = 'http://localhost:5173'
    const serverUrl = import.meta.env.MAIN_VITE_SERVER_URL || 'http://localhost:3001'
    const csp = `default-src 'self'; script-src 'self' 'unsafe-eval' https://accounts.google.com https://*.googleusercontent.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com ${is.dev ? "'unsafe-inline' " + devServerURL : ''}; style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; media-src 'self' data:; img-src * data:; frame-src https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com; connect-src 'self' https://play.google.com https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com ${serverUrl} https://whatdidyougetdonetoday.s3.us-east-1.amazonaws.com https://whatdidyougetdonetoday.s3.amazonaws.com https://us.i.posthog.com https://eu.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com ${is.dev ? devServerURL : ''}`

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
