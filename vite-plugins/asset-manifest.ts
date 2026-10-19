import { existsSync, readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:asset-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const IMAGE_FILE = /\.(png|jpe?g|webp)$/i;

/**
 * Exposes the list of image files in public/assets/ as `virtual:asset-manifest`.
 * The game loads only the images that actually exist; everything else is drawn by code.
 */
export function assetManifest(): Plugin {
  let dir = '';
  const list = (): string[] =>
    existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE_FILE.test(f)).sort() : [];

  return {
    name: 'asset-manifest',
    configResolved(config) {
      dir = resolve(config.publicDir, 'assets');
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return `export default ${JSON.stringify(list())};`;
    },
    configureServer(server) {
      // Pick up images added or removed while the dev server is running.
      server.watcher.add(dir);
      const onChange = (file: string) => {
        if (!file.startsWith(dir + sep)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
