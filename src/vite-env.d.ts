/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 프로젝트 주소. 없으면 방 기능이 꺼진다. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase 공개(anon) 키 */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
