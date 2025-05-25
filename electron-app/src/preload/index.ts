import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import type { ActiveWindowDetails } from '../native-modules/native-windows'

// Custom APIs for renderer
const api = {
  onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, details: ActiveWindowDetails) =>
      callback(details)
    ipcRenderer.on('active-window-changed', listener)
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('active-window-changed', listener)
    }
  }
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
