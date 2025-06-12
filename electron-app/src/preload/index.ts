import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { ActiveWindowDetails, Category } from 'shared/dist/types.js'

// Custom APIs for renderer
const api = {
  onAuthCodeReceived: (callback: (code: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, code: string) => callback(code)
    ipcRenderer.on('auth-code-received', listener)
    return () => {
      ipcRenderer.removeListener('auth-code-received', listener)
    }
  },
  openExternalUrl: (url: string) => ipcRenderer.send('open-external-url', url),
  onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, details: ActiveWindowDetails) =>
      callback(details)
    ipcRenderer.on('active-window-changed', listener)
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('active-window-changed', listener)
    }
  },
  getAudioDataUrl: () => ipcRenderer.invoke('get-audio-data-url'),
  logToFile: (message: string, data?: object) => ipcRenderer.send('log-to-file', message, data),
  showNotification: (options: { title: string; body: string }) => {
    ipcRenderer.send('show-notification', options)
  },
  getEnvVariables: () => ipcRenderer.invoke('get-env-vars'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  onDisplayRecategorizePage: (callback: (categoryDetails?: Category) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, categoryDetails?: Category) =>
      callback(categoryDetails)
    ipcRenderer.on('display-recategorize-page', listener)
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('display-recategorize-page', listener)
    }
  },
  getFloatingWindowVisibility: () => ipcRenderer.invoke('get-floating-window-visibility')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
