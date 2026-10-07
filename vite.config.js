import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SINGLE_FILE_MODE = 'single';

function inlineEntryScript() {
  return {
    name: 'inline-entry-script',
    enforce: 'post',
    apply: 'build',
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find(
        (item) => item.type === 'chunk' && item.isEntry
      );
      const page = Object.values(bundle).find(
        (item) => item.type === 'asset' && item.fileName.endsWith('.html')
      );

      if (!entry || !page) {
        return;
      }

      const escaped = entry.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tag = new RegExp(`<script[^>]*src="[^"]*${escaped}"[^>]*></script>`);

      page.source = page.source.replace(
        tag,
        `<script type="module">\n${entry.code}\n</script>`
      );

      delete bundle[entry.fileName];
    },
    closeBundle() {
      try {
        const srcPath = path.resolve(__dirname, 'docs/dist-single/index.html');
        if (fs.existsSync(srcPath)) {
          const rootDistSingle = path.resolve(__dirname, 'dist-single');
          if (!fs.existsSync(rootDistSingle)) {
            fs.mkdirSync(rootDistSingle, { recursive: true });
          }
          fs.copyFileSync(srcPath, path.join(rootDistSingle, 'index.html'));

          const docsRoot = path.resolve(__dirname, 'docs');
          fs.copyFileSync(srcPath, path.join(docsRoot, 'index.html'));
        }
      } catch (err) {
        console.warn('Mirroring single-file build failed:', err);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const singleFile = mode === SINGLE_FILE_MODE;

  return {
    base: './',
    define: singleFile ? { 'import.meta.env.DEV': 'false' } : {},
    build: {
      outDir: singleFile ? 'docs/dist-single' : 'dist',
      assetsDir: 'assets',
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 2000
    },
    server: {
      port: 5173,
      host: true
    },
    plugins: singleFile ? [inlineEntryScript()] : []
  };
});