/// <reference types="vite/client" />

// Global type declarations for the renderer environment.
// The types for window.api (exposed by the preload script)
// are now primarily defined in src/preload/index.d.ts.
// This file can be used for other global types if needed.

import { ActiveWindowDetails } from 'shared'
import { FloatingWindowApi } from '../../preload/floatingPreload'

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on(channel: string, func: (...args: any[]) => void): void
        send(channel: string, ...args: any[]): void
        invoke(channel: string, ...args: any[]): Promise<any>
      }
    }
    api: {
      onActiveWindowChanged: (callback: (details: ActiveWindowDetails) => void) => () => void
      getEnvVariables: () => Promise<{ [key: string]: string }>
      readFile: (filePath: string) => Promise<ArrayBuffer>
      deleteFile: (filePath: string) => Promise<void>
    }
    floatingApi: FloatingWindowApi
  }
}

export {}
