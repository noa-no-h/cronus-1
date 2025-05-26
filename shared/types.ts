export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  hasSubscription?: boolean;
  stripeCustomerId?: string;
  isWaitlisted?: boolean;
  tokenVersion?: number;
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
}

export interface ActiveWindowEvent extends ActiveWindowDetails {
  userId: string;
}
