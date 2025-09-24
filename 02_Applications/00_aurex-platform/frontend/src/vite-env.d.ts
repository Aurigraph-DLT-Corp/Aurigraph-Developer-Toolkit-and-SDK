/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_DEBUG?: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
  readonly VITE_HOTJAR_ID?: string;
  // Add more env variables types here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}