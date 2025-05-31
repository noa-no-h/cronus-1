export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  hasSubscription?: boolean;
  stripeCustomerId?: string;
  isWaitlisted?: boolean;
  tokenVersion?: number;
  electronAppSettings?: {
    calendarZoomLevel?: number;
  };
  userGoals?: {
    weeklyGoal: string;
    dailyGoal: string;
    lifeGoal: string;
  };
}

export interface ActiveWindowDetails {
  windowId: number;
  ownerName: string;
  type: 'window' | 'browser';
  browser?: 'chrome' | 'safari' | null;
  title: string;
  url?: string | null;
  content?: string | null;
  timestamp?: number;
  localScreenshotPath?: string | null;
  screenshotS3Url?: string | null;
  captureReason?: 'app_switch' | 'periodic_backup' | null;
}

export interface ActiveWindowEvent extends ActiveWindowDetails {
  userId: string;
}
