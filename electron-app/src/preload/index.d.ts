import { ElectronAPI } from '@electron-toolkit/preload'

// Define ActiveWindowDetails here, as it's used by the api type
export interface ActiveWindowDetails {
  id: number | string
  ownerName: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => () => void
      // Define other methods of 'api' if you have them
    }
  }
}
