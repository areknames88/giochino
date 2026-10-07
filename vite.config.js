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

function editorApiPlugin() {
  return {
    name: 'editor-api-plugin',
    apply: 'serve',
    configureServer(server) {
      const DATA_PATHS = {
        rooms: path.join(__dirname, 'src', 'data', 'rooms'),
        playables: path.join(__dirname, 'src', 'data', 'characters', 'playable'),
        npcs: path.join(__dirname, 'src', 'data', 'characters', 'npc'),
        dialogues: path.join(__dirname, 'src', 'data', 'dialogues')
      };

      function readJsonDir(dirPath) {
        const result = {};
        if (!fs.existsSync(dirPath)) return result;
        const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          const id = path.basename(file, '.json');
          try {
            result[id] = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
          } catch (e) {
            console.warn(`[editor-api] Errore lettura ${file}:`, e.message);
          }
        }
        return result;
      }

      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;

        if (pathname === '/api/data' && req.method === 'GET') {
          const data = {
            rooms: readJsonDir(DATA_PATHS.rooms),
            playables: readJsonDir(DATA_PATHS.playables),
            npcs: readJsonDir(DATA_PATHS.npcs),
            dialogues: readJsonDir(DATA_PATHS.dialogues)
          };
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, data }));
          return;
        }

        if (pathname === '/api/save/all' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { rooms = {}, dialogues = {} } = JSON.parse(body);
              let count = 0;
              for (const [roomId, data] of Object.entries(rooms)) {
                if (/^[a-zA-Z0-9_-]+$/.test(roomId)) {
                  fs.writeFileSync(path.join(DATA_PATHS.rooms, `${roomId}.json`), JSON.stringify(data, null, 2) + '\n', 'utf8');
                  count += 1;
                }
              }
              for (const [dialogueId, data] of Object.entries(dialogues)) {
                if (/^[a-zA-Z0-9_-]+$/.test(dialogueId)) {
                  fs.writeFileSync(path.join(DATA_PATHS.dialogues, `${dialogueId}.json`), JSON.stringify(data, null, 2) + '\n', 'utf8');
                  count += 1;
                }
              }
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, count }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
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
    plugins: singleFile ? [inlineEntryScript()] : [editorApiPlugin()]
  };
});