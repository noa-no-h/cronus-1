import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { Category } from 'shared'

// Define the structure of the data being sent
interface FloatingStatusUpdate {
  latestStatus: 'productive' | 'unproductive' | 'maybe' | null
  dailyProductiveMs: number
  dailyUnproductiveMs: number
  categoryDetails?: Category
}

export interface FloatingWindowApi {
  onStatusUpdate: (
    callback: (data: FloatingStatusUpdate) => void // Expect the full data object
  ) => () => void
  moveWindow: (deltaX: number, deltaY: number) => void
  hideFloatingWindow: () => void
  requestRecategorizeView: (category: Category | undefined) => void
}

const floatingApi: FloatingWindowApi = {
  onStatusUpdate: (callback: (data: FloatingStatusUpdate) => void) => {
    // The listener now expects the full FloatingStatusUpdate object
    const listener = (_event: IpcRendererEvent, data: FloatingStatusUpdate) => callback(data)
    ipcRenderer.on('floating-window-status-updated', listener)
    return () => {
      ipcRenderer.removeListener('floating-window-status-updated', listener)
    }
  },
  moveWindow: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('move-floating-window', { deltaX, deltaY })
  },
  hideFloatingWindow: () => {
    ipcRenderer.send('hide-floating-window')
  },
  requestRecategorizeView: (category: Category | undefined) => {
    ipcRenderer.send('request-recategorize-view', category)
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
