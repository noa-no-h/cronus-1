import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { ActiveWindowDetails, Category } from 'shared/dist/types.js'

// Permission types and status enums (match the native layer)
export enum PermissionType {
  Accessibility = 0,
  AppleEvents = 1,
  ScreenRecording = 2
}

export enum PermissionStatus {
  Denied = 0,
  Granted = 1,
  Pending = 2
}

export interface PermissionInfo {
  type: PermissionType
  status: PermissionStatus
  name: string
  description: string
}

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
  getFloatingWindowVisibility: () => ipcRenderer.invoke('get-floating-window-visibility'),

  // Permission-related methods
  getPermissionRequestStatus: (): Promise<boolean> =>
    ipcRenderer.invoke('get-permission-request-status'),
  getPermissionStatus: (permissionType: PermissionType): Promise<PermissionStatus> =>
    ipcRenderer.invoke('get-permission-status', permissionType),
  getPermissionsForTitleExtraction: (): Promise<boolean> =>
    ipcRenderer.invoke('get-permissions-for-title-extraction'),
  getPermissionsForContentExtraction: (): Promise<boolean> =>
    ipcRenderer.invoke('get-permissions-for-content-extraction'),
  requestPermission: (permissionType: PermissionType): Promise<void> =>
    ipcRenderer.invoke('request-permission', permissionType),
  enablePermissionRequests: (): Promise<void> => ipcRenderer.invoke('enable-permission-requests'),
  forceEnablePermissionRequests: (): Promise<void> =>
    ipcRenderer.invoke('force-enable-permission-requests'),
  startWindowTracking: (): Promise<void> => ipcRenderer.invoke('start-window-tracking'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (status: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: any) => callback(status)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  },
  captureScreenshotAndOCR: () => ipcRenderer.invoke('capture-screenshot-and-ocr')
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
