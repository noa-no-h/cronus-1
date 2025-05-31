/// <reference types="vite/client" />

// Global type declarations for the renderer environment.
// The types for window.api (exposed by the preload script)
// are now primarily defined in src/preload/index.d.ts.
// This file can be used for other global types if needed.

import { FloatingWindowApi } from '../../preload/floatingPreload'

declare global {
  interface Window {
    // window.electron and window.api types are expected to be provided globally
    // by preload/index.d.ts.
    // If type errors arise for window.electron.ipcRenderer.removeListener,
    // it indicates the global type from preload/index.d.ts for ElectronAPI
    // needs to be augmented or corrected.

    floatingApi: FloatingWindowApi
  }
}

export {}
