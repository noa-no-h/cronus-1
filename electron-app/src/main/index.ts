import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'fs/promises'
import { join, resolve as pathResolve } from 'path'
import { ActiveWindowDetails } from 'shared'
import icon from '../../resources/icon.png?asset'
import { nativeWindows } from '../native-modules/native-windows/index'

// Load .env file from the electron-app directory relative to where this file will be in `out/main`
dotenv.config({ path: pathResolve(__dirname, '../../.env') })

let mainWindow: BrowserWindow | null
let floatingWindow: BrowserWindow | null

function createFloatingWindow(): void {
  floatingWindow = new BrowserWindow({
    width: 300,
    height: 60,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    maximizable: false,
    show: false, // Initially hide; show when ready or when first status update comes
    webPreferences: {
      preload: join(__dirname, '../preload/floatingPreload.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (!floatingWindow) {
    console.error('Failed to create floating window')
    return
  }

  // On macOS, this makes the window appear on the currently active space.
  // To make it appear on ALL spaces, use setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }).
  if (process.platform === 'darwin') {
    floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    console.log('Floating window set to be visible on all workspaces for macOS.')
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
      const x = currentPosition[0]
      const y = currentPosition[1]
      floatingWindow.setPosition(x + deltaX, y + deltaY)
    }
  })

  floatingWindow.on('closed', () => {
    floatingWindow = null
    console.log('Floating window closed.')
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1270,
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
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-env-vars', () => {
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      // Add other vars you want to expose from your .env file
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
    (_event, status: 'productive' | 'unproductive' | 'maybe') => {
      if (floatingWindow) {
        console.log(`Main process: Attempting to send status ('${status}') to floating window.`)
        floatingWindow.webContents.send('floating-window-status-updated', status)
        if (!floatingWindow.isVisible()) {
          console.log('Main process: Floating window was not visible, calling show().')
          floatingWindow.show()
        } else {
          console.log('Main process: Floating window is already visible.')
        }
      } else {
        console.warn('Main process: Received status update, but floatingWindow is null.')
      }
    }
  )

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
