import { ElectronAPI as BaseElectronAPI } from '@electron-toolkit/preload'
import type { ActiveWindowDetails } from '../native-modules/native-windows'

// Define ActiveWindowDetails here, as it's used by the api type
export interface ActiveWindowDetails {
  id: number
  ownerName: string
  type: 'window' | 'browser'
  browser: 'chrome' | 'safari'
  title: string
  url?: string
  content?: string
  timestamp?: number
}

// Define a more specific type for ipcRenderer if BaseElectronAPI is not sufficient
interface CustomIpcRenderer extends BaseElectronAPI['ipcRenderer'] {
  removeListener: (channel: string, listener: (...args: any[]) => void) => void
  // Potentially include other methods like on, send, invoke if they also need explicit typing
  // For now, let's assume BaseElectronAPI['ipcRenderer'] has them, and we only add/ensure removeListener
  on: (channel: string, listener: (...args: any[]) => void) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

interface CustomElectronAPI extends BaseElectronAPI {
  ipcRenderer: CustomIpcRenderer
}

declare global {
  interface Window {
    electron: CustomElectronAPI // Use the custom, more specific type
    api: {
      onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => () => void // Return type for cleanup function
      // Add the new function's type signature here
      getEnvVariables: () => Promise<{ GOOGLE_CLIENT_ID?: string; [key: string]: any }>
      // Define other methods of 'api' if you have them
      readFile: (filePath: string) => Promise<ArrayBuffer>
      deleteFile: (filePath: string) => Promise<void>
      getFloatingWindowVisibility: () => Promise<boolean>
      onDisplayRecategorizePage: (callback: (category: Category) => void) => () => void
      getAudioDataUrl: () => Promise<string | null>
    }
  }
}
