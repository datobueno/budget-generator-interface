/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_ENV?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_DEFAULT_CURRENCY?: string;
  readonly VITE_DEFAULT_TAX_RATE?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
