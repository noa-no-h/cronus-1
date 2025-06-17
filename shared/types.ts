export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  hasSubscription?: boolean;
  stripeCustomerId?: string;
  isWaitlisted?: boolean;
  tokenVersion?: number;
  hasCompletedOnboarding?: boolean;
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
  windowId?: number;
  ownerName: string;
  type: 'window' | 'browser' | 'system';
  browser?: 'chrome' | 'safari' | null;
  title: string;
  url?: string | null;
  content?: string | null;
  timestamp?: number;
  localScreenshotPath?: string | null;
  screenshotS3Url?: string | null;
  captureReason?: 'app_switch' | 'periodic_backup' | null;
  categoryReasoning?: string | null;
}

export interface ActiveWindowEvent extends ActiveWindowDetails {
  userId: string;
  categoryId?: string | null;
  categoryReasoning?: string | null;
}

export interface Category {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color: string; // Hex color code, e.g., "#FF5733"
  isProductive: boolean;
  isDefault: boolean; // Whether this is a default category
  createdAt: Date;
  updatedAt: Date;
}
