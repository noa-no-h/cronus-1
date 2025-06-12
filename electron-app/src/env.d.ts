/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_GOOGLE_CLIENT_ID: string
  readonly MAIN_VITE_CLIENT_URL: string
  readonly MAIN_VITE_POSTHOG_KEY: string
  readonly MAIN_VITE_POSTHOG_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
