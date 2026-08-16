/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 覆盖后端接口基地址，默认 "/api"（开发环境由 Vite 代理转发） */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
