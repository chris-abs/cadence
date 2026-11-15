interface ImportMetaEnv {
  /** "1" serves the API from the in-browser mock (dev server only). */
  readonly VITE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
