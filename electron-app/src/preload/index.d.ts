import { ElectronAPI } from '@electron-toolkit/preload'
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

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => () => void // Return type for cleanup function
      // Add the new function's type signature here
      getEnvVariables: () => Promise<{ GOOGLE_CLIENT_ID?: string; [key: string]: any }>
      // Define other methods of 'api' if you have them
      readFile: (filePath: string) => Promise<ArrayBuffer>
      deleteFile: (filePath: string) => Promise<void>
    }
  }
}
