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

function createWindow(): void {
  // Create the browser window.
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
      sandbox: false
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
    // Open all other links in the user's default browser
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools automatically in development
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for environment variables, placed after createWindow
  ipcMain.handle('get-env-vars', () => {
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      // Add other vars you want to expose from your .env file
    }
  })

  // Add IPC handler for reading files
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      // const fs = await import('fs/promises') // fs is already imported globally in this file
      const buffer = await fs.readFile(filePath) // No checksum calculation
      return buffer // Return only the buffer (which will be an ArrayBuffer on the client)
    } catch (error) {
      console.error('Error reading file:', error)
      throw error
    }
  })

  // Add IPC handler for deleting files
  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error('Error deleting file via IPC:', error)
      // It's okay if this fails, it's a cleanup step
    }
  })

  createWindow()

  nativeWindows.startActiveWindowObserver((windowInfo: ActiveWindowDetails | null) => {
    if (windowInfo) {
      console.log('Active window info:', windowInfo)
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
