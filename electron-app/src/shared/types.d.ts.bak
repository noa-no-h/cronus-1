export interface User {
  id: string
  email: string
  name: string
  picture?: string | null
  hasSubscription?: boolean
  stripeCustomerId?: string
  isWaitlisted?: boolean
  tokenVersion?: number
  hasCompletedOnboarding?: boolean
  electronAppSettings?: {
    calendarZoomLevel?: number
  }
  userProjectsAndGoals?: string
}
export interface ActiveWindowDetails {
  windowId?: number
  ownerName: string
  type: 'window' | 'browser' | 'system' | 'manual' | 'calendar'
  browser?: 'chrome' | 'safari' | 'arc' | null
  title?: string | null
  url?: string | null
  content?: string | null
  timestamp: number
  contentSource?: 'ocr' | 'accessibility' | null
  localScreenshotPath?: string | null
  screenshotS3Url?: string | null
  durationMs?: number
}
export interface ActiveWindowEvent extends ActiveWindowDetails {
  _id?: string
  userId: string
  categoryId?: string | null
  categoryReasoning?: string | null
  lastCategorizationAt?: Date
  oldCategoryId?: string | null
  oldCategoryReasoning?: string | null
}
export interface Category {
  _id: string
  userId: string
  name: string
  description?: string
  color: string
  isProductive: boolean
  isDefault: boolean // Whether this is a default category
  isArchived?: boolean
  isLikelyToBeOffline?: boolean
  createdAt: Date
  updatedAt: Date
}
