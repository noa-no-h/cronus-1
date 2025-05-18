export type TargetMode = "stargazers" | "forks" | "watchers" | "contributors";

export interface FormPreferences {
  apiKey?: string;
  repositoryUrl?: string;
  target_mode?: TargetMode;
  repos?: number;
  langJS?: boolean;
  langTS?: boolean;
  langPython?: boolean;
  langGo?: boolean;
  langRust?: boolean;
  langCpp?: boolean;
  langPerc?: number;
  followers?: number;
  following?: number;
  account_created?: number;
  repo_updated?: number;
}

export type LanguageKeys = 'langJS' | 'langTS' | 'langPython' | 'langGo' | 'langRust' | 'langCpp';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  formPreferences?: FormPreferences;
  hasSubscription?: boolean;
  stripeCustomerId?: string;
} 