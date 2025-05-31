import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface FloatingWindowApi {
  onStatusUpdate: (
    callback: (status: 'productive' | 'unproductive' | 'maybe') => void
  ) => () => void
  moveWindow: (deltaX: number, deltaY: number) => void
}

const floatingApi: FloatingWindowApi = {
  onStatusUpdate: (callback: (status: 'productive' | 'unproductive' | 'maybe') => void) => {
    const listener = (_event: IpcRendererEvent, status: 'productive' | 'unproductive' | 'maybe') =>
      callback(status)
    ipcRenderer.on('floating-window-status-updated', listener)
    return () => {
      ipcRenderer.removeListener('floating-window-status-updated', listener)
    }
  },
  moveWindow: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('move-floating-window', { deltaX, deltaY })
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('floatingApi', floatingApi)
  } catch (error) {
    console.error('Error exposing floatingApi:', error)
  }
} else {
  // @ts-ignore (unsafe assignment)
  window.floatingApi = floatingApi
}
