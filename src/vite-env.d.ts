/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_TELEGRAM_APP_LINK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
