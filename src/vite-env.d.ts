/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MECHANICAL_SHOP_API_URL?: string;
  readonly VITE_MECHANICAL_SHOP_REST_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
