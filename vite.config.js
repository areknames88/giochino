import { defineConfig } from 'vite';

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