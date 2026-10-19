/// <reference types="vite/client" />

declare module 'virtual:asset-manifest' {
  /** File names found in public/assets/ at build time, e.g. ['hirsipuu-tausta.png']. */
  const files: string[];
  export default files;
}
