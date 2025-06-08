import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import fs from 'fs/promises'
import { join, resolve as pathResolve } from 'path'
import { ActiveWindowDetails, Category } from 'shared'
import icon from '../../resources/icon.png?asset'
import { nativeWindows } from '../native-modules/native-windows'

// Load .env file from the electron-app directory relative to where this file will be in `out/main`
dotenv.config({ path: pathResolve(__dirname, '../../.env') })

let mainWindow: BrowserWindow | null
let floatingWindow: BrowserWindow | null

const FLOATING_WINDOW_WIDTH = 400
const FLOATING_WINDOW_HEIGHT = 60

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

function createFloatingWindow(): void {
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
      mainWindow?.webContents.send('floating-window-visibility-changed', false)
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
  const windowHeight = screenHeight // Or screenHeight if you want it to fill the height

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth,
    y: 0, // Position at the top of the work area
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
    if (url.startsWith('https://accounts.google.com/')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          autoHideMenuBar: true,
          webPreferences: {
            // No nodeIntegration or preload script for external auth pages typically
          }
        }
      }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await initializeLoggers()
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('log-to-file', (_event, _message: string, _data?: object) => {
    // logRendererToFile(message, data)
  })

  ipcMain.handle('get-env-vars', () => {
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
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

  createWindow()
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
