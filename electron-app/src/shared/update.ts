import { ProgressInfo, UpdateInfo } from 'electron-updater'

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; info: UpdateInfo }
  | { status: 'not-available' }
  | { status: 'downloading'; progress: ProgressInfo }
  | { status: 'downloaded' }
  | { status: 'error'; error: Error }
