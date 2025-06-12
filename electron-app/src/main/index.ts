import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Notification, screen, session, shell } from 'electron'
import fs from 'fs/promises'
import { join } from 'path'
import { ActiveWindowDetails, Category } from 'shared/dist/types.js'
import icon from '../../resources/icon.png?asset'
import { nativeWindows } from '../native-modules/native-windows'
const { nativeTheme } = require('electron')

const PROTOCOL_SCHEME = 'cronus'
let urlToHandleOnReady: string | null = null

// Load .env file from the electron-app directory relative to where this file will be in `out/main`
// dotenv.config({ path: pathResolve(__dirname, '../../.env') }) -- no longer needed, Vite handles this

let mainWindow: BrowserWindow | null
let floatingWindow: BrowserWindow | null

const FLOATING_WINDOW_WIDTH = 400
const FLOATING_WINDOW_HEIGHT = 55

// --- File Logger Setup ---
const mainLogFilePath = join(app.getAppPath(), 'whatdidyougetdonethisweek-main.log')
const rendererLogFilePath = join(app.getAppPath(), 'whatdidyougetdonethisweek-renderer.log')

async function initializeLoggers(): Promise<void> {
  try {
    await fs.writeFile(mainLogFilePath, `--- Main Log started at ${new Date().toISOString()} ---\n`)
    await fs.writeFile(
      rendererLogFilePath,
      `--- Renderer Log started at ${new Date().toISOString()} ---\n`
    )
  } catch (err) {
    console.error('Failed to initialize log files:', err)
  }
}

async function logMainToFile(message: string, data?: object): Promise<void> {
  const timestamp = new Date().toISOString()
  let logEntry = `${timestamp} - ${message}`
  if (data) {
    try {
      logEntry += `\n${JSON.stringify(data, null, 2)}`
    } catch (e) {
      logEntry += `\n[Could not stringify data]`
    }
  }
  try {
    await fs.appendFile(mainLogFilePath, logEntry + '\n')
  } catch (err) {
    console.error('Failed to write to main log file:', err)
  }
}

async function logRendererToFile(message: string, data?: object): Promise<void> {
  const timestamp = new Date().toISOString()
  let logEntry = `${timestamp} - ${message}`
  if (data) {
    try {
      logEntry += `\n${JSON.stringify(data, null, 2)}`
    } catch (e) {
      logEntry += `\n[Could not stringify data]`
    }
  }
  try {
    await fs.appendFile(rendererLogFilePath, logEntry + '\n')
  } catch (err) {
    console.error('Failed to write to renderer log file:', err)
  }
}
// --- End File Logger Setup ---

function handleAppUrl(url: string): void {
  logMainToFile('Processing deep link URL', { url })

  // Parse the code from the URL
  let code: string | null = null
  try {
    const parsedUrl = new URL(url)
    code = parsedUrl.searchParams.get('code')
  } catch (e) {
    logMainToFile('Failed to parse deep link URL', { url, error: e })
  }

  // Show a notification for debugging
  new Notification({
    title: 'URL Received',
    body: `App received URL: ${url}`
  }).show()

  // If the main window does not exist or is destroyed, store the URL for later
  if (!mainWindow || mainWindow.isDestroyed()) {
    urlToHandleOnReady = url
    return
  }

  // Focus and restore the window if needed
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()

  // Send the code to the renderer if available
  if (code) {
    mainWindow.webContents.send('auth-code-received', code)
  }
}

function createFloatingWindow(): void {
  if (is.dev) {
    nativeTheme.themeSource = 'dark'
  }
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize // Use workAreaSize to avoid OS menu bars

  const x = Math.round(screenWidth / 2 - FLOATING_WINDOW_WIDTH / 2)
  const y = 0 // Position at the very top of the work area

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: FLOATING_WINDOW_WIDTH,
    height: FLOATING_WINDOW_HEIGHT,
    x: x,
    y: y,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    maximizable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/floatingPreload.js'),
      sandbox: false,
      contextIsolation: true
    }
  }

  // Temporarily remove macOS-specific vibrancy for testing solid background
  // if (process.platform === 'darwin') {
  //   windowOptions.vibrancy = 'sidebar'
  //   windowOptions.visualEffectState = 'active'
  // }

  floatingWindow = new BrowserWindow(windowOptions)

  if (!floatingWindow) {
    console.error('Failed to create floating window')
    return
  }

  // Listeners for visibility changes to inform the main window
  floatingWindow.on('show', () => {
    // console.log('Floating window event: show (from createFloatingWindow setup)')
    mainWindow?.webContents.send('floating-window-visibility-changed', true)
  })
  floatingWindow.on('hide', () => {
    // console.log('Floating window event: hide (from createFloatingWindow setup)')
    mainWindow?.webContents.send('floating-window-visibility-changed', false)
  })

  // On macOS, this makes the window appear on the currently active space.
  // To make it appear on ALL spaces, use setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }).
  if (process.platform === 'darwin') {
    floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    console.log(
      'Floating window set to be visible on all workspaces for macOS (in createFloatingWindow).'
    )
  }

  floatingWindow.webContents.on('did-finish-load', () => {
    console.log('Floating window content finished loading.')
    if (is.dev) {
      floatingWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  floatingWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`Floating window failed to load: ${errorCode}, ${errorDescription}`)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const floatingUrl = `${process.env['ELECTRON_RENDERER_URL']}/floating.html`
    console.log(`Loading floating window URL (dev): ${floatingUrl}`)
    floatingWindow
      .loadURL(floatingUrl)
      .catch((err) => console.error('Failed to load floating URL (dev):', err))
  } else {
    const floatingFilePath = join(__dirname, '../renderer/floating.html')
    console.log(`Loading floating window file (prod): ${floatingFilePath}`)
    floatingWindow
      .loadFile(floatingFilePath)
      .catch((err) => console.error('Failed to load floating file (prod):', err))
  }

  floatingWindow.on('ready-to-show', () => {
    // Do not show immediately; wait for the first status update
  })

  ipcMain.on('move-floating-window', (_event, { deltaX, deltaY }) => {
    if (floatingWindow) {
      const currentPosition = floatingWindow.getPosition()
      const currentX = currentPosition[0]
      const currentY = currentPosition[1]
      floatingWindow.setPosition(currentX + deltaX, currentY + deltaY)
    }
  })

  ipcMain.on('hide-floating-window', () => {
    if (floatingWindow && floatingWindow.isVisible()) {
      floatingWindow.hide()
      console.log('Floating window hidden by user.')
    }
  })

  ipcMain.on('show-floating-window', () => {
    if (floatingWindow) {
      // Ensure position is set before showing, in case it was moved or never shown
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: screenWidth } = primaryDisplay.workAreaSize
      const x = Math.round(screenWidth / 2 - FLOATING_WINDOW_WIDTH / 2)
      const y = 0 // Position at the very top of the work area
      floatingWindow.setPosition(x, y, false) // false for animate parameter
      floatingWindow.show() // This will trigger the 'show' event and send IPC
      // console.log('Floating window shown via AppHeader button.') // Covered by event listener
      // mainWindow?.webContents.send('floating-window-visibility-changed', true) // Covered by event listener
    } else {
      createFloatingWindow() // This will create, attach listeners, and eventually show & send IPC
      console.log('Floating window was null, created new one. Visibility will be reported.')
    }
  })

  floatingWindow.on('closed', () => {
    floatingWindow = null
    console.log('Floating window closed.')
  })
}

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const windowWidth = 800
  const windowHeight = screenHeight

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth,
    y: 0,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (!mainWindow) {
    console.error('Failed to create main window')
    return
  }

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // In production, always open Google OAuth URLs externally
    if (url.startsWith('https://accounts.google.com/')) {
      if (is.dev) {
        // Allow popup in dev mode for in-app Google login
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

  // --- DEV/PROD renderer loading logic ---
  if (is.dev) {
    const devUrl = process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:5173'
    console.log('---')
    console.log('✅ Development Renderer URL for Google Cloud Console:')
    console.log(devUrl)
    console.log('---')
    mainWindow.loadURL(devUrl)
  } else {
    console.log('---')
    console.log('❌ Production Renderer URL for Google Cloud Console:')
    console.log(join(__dirname, '../renderer/index.html'))
    console.log('---')
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  // ---------------------------------------

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // After the window loads, if there is a queued URL, process it
  mainWindow.webContents.on('did-finish-load', () => {
    if (urlToHandleOnReady) {
      handleAppUrl(urlToHandleOnReady)
      urlToHandleOnReady = null
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  const devServerURL = 'http://localhost:5173'

  // More lenient CSP to allow all Google assets
  const csp = `default-src 'self'; script-src 'self' 'unsafe-eval' https://accounts.google.com https://*.googleusercontent.com ${is.dev ? "'unsafe-inline' " + devServerURL : ''}; style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; media-src 'self' data:; img-src * data:; frame-src https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com; connect-src 'self' https://play.google.com https://accounts.google.com https://*.googleusercontent.com https://accounts.youtube.com http://localhost:3001 https://whatdidyougetdonetoday.s3.us-east-1.amazonaws.com https://whatdidyougetdonetoday.s3.amazonaws.com https://eu.i.posthog.com ${is.dev ? devServerURL : ''}`

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'Cross-Origin-Opener-Policy': ['unsafe-none']
      }
    })
  })

  // --- SINGLE INSTANCE LOCK (Production-only) ---
  if (!is.dev) {
    const gotTheLock = app.requestSingleInstanceLock()

    if (!gotTheLock) {
      app.quit()
    } else {
      app.on('second-instance', (_event, commandLine) => {
        // Someone tried to run a second instance. We should focus our window.
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }

        // Find the URL in the command line arguments
        const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
        if (url) {
          handleAppUrl(url)
        }
      })
    }
  }
  // --- END SINGLE INSTANCE LOCK ---

  // Handle the URL on initial launch (Windows, Linux)
  const initialUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
  if (initialUrl) {
    urlToHandleOnReady = initialUrl
  }

  electronApp.setAppUserModelId('com.electron')

  // // Enable auto-start on macOS
  // if (process.platform === 'darwin') {
  //   app.setLoginItemSettings({
  //     openAtLogin: true,
  //     openAsHidden: true // starts the app hidden without opening the window
  //   })
  // }

  ipcMain.handle('set-open-at-login', (_event, enable: boolean) => {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true
      })
    }
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('open-external-url', (_event, url: string) => {
    shell.openExternal(url)
  })

  // Handle protocol links on macOS when the app is running
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleAppUrl(url)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-floating-window-visibility', () => {
    return floatingWindow?.isVisible() ?? false
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
      // Add other vars you want to expose from your .env file
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
      // It's okay if this fails, it's a cleanup step
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
      if (floatingWindow) {
        // console.log(`Main process: Attempting to send data to floating window:`, data)
        floatingWindow.webContents.send('floating-window-status-updated', data) // Send the whole data object
        if (floatingWindow.isVisible()) {
          // console.log('Main process: Data sent to VISIBLE floating window.')
        } else {
          console.log('Main process: Data sent to HIDDEN floating window (will not auto-show).')
        }
      } else {
        console.warn('Main process: Received status update, but floatingWindow is null.')
      }
    }
  )

  ipcMain.on('request-recategorize-view', (_event, categoryDetails?: Category) => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()

      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.webContents.send('display-recategorize-page', categoryDetails)
    } else {
      console.error(
        'Main Process: ERROR: mainWindow is not available when "request-recategorize-view" was received to show category details.'
      )
    }
  })

  ipcMain.on('open-main-app-window', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  ipcMain.on('show-notification', (_event, { title, body }) => {
    logMainToFile('Received show-notification request', { title, body })
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: process.platform === 'win32' ? icon : undefined, // Optional: icon for notification
        actions: [{ type: 'button', text: 'Edit' }]
      })

      notification.on('click', () => {
        logMainToFile('Notification clicked. Focusing main window.')
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
      })

      notification.on('action', (_event, index) => {
        logMainToFile(`Notification action clicked, index: ${index}`)
        if (index === 0) {
          // Corresponds to the 'Edit' button
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
          }
        }
      })

      notification.show()
    } else {
      logMainToFile('Notifications not supported on this system.')
    }
  })

  createWindow()

  // Handle any URL that was received before the window was created
  if (urlToHandleOnReady) {
    handleAppUrl(urlToHandleOnReady)
    urlToHandleOnReady = null
  }

  createFloatingWindow()

  nativeWindows.startActiveWindowObserver((windowInfo: ActiveWindowDetails | null) => {
    if (windowInfo) {
      // console.log('Active window info:', windowInfo) // Too noisy for general use
      if (mainWindow) {
        mainWindow.webContents.send('active-window-changed', windowInfo)
      }
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
