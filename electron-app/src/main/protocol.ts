import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { logMainToFile } from './logging'

const PROTOCOL_SCHEME = 'cronus'
let urlToHandleOnReady: string | null = null

export function handleAppUrl(url: string, mainWindow: BrowserWindow | null): void {
  logMainToFile('Processing deep link URL', { url })

  let code: string | null = null
  try {
    const parsedUrl = new URL(url)
    code = parsedUrl.searchParams.get('code')
  } catch (e) {
    logMainToFile('Failed to parse deep link URL', { url, error: e })
  }

  // new Notification({
  //   title: 'URL Received',
  //   body: `App received URL: ${url}`
  // }).show()

  if (!mainWindow || mainWindow.isDestroyed()) {
    urlToHandleOnReady = url
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()

  if (code) {
    mainWindow.webContents.send('auth-code-received', code)
  }
}

export function setupProtocolHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Handle protocol links on macOS when the app is running
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleAppUrl(url, getMainWindow())
  })

  // Handle the URL on initial launch (Windows, Linux)
  const initialUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
  if (initialUrl) {
    urlToHandleOnReady = initialUrl
  }
}

export function getUrlToHandleOnReady(): string | null {
  const url = urlToHandleOnReady
  urlToHandleOnReady = null // Consume the URL
  return url
}

export function setupSingleInstanceLock(getMainWindow: () => BrowserWindow | null): boolean {
  if (is.dev) {
    return true // Don't lock in development
  }

  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
    return false
  }

  app.on('second-instance', (_event, commandLine) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
    if (url) {
      handleAppUrl(url, mainWindow)
    }
  })

  return true
}
