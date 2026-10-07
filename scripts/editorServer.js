import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_PATHS = {
  rooms: path.join(ROOT_DIR, 'src', 'data', 'rooms'),
  playables: path.join(ROOT_DIR, 'src', 'data', 'characters', 'playable'),
  npcs: path.join(ROOT_DIR, 'src', 'data', 'characters', 'npc'),
  dialogues: path.join(ROOT_DIR, 'src', 'data', 'dialogues')
};

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const EDITOR_HTML = path.join(ROOT_DIR, 'editor.html');

function readJsonDir(dirPath) {
  const result = {};
  if (!fs.existsSync(dirPath)) {
    return result;
  }
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const id = path.basename(file, '.json');
    try {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      result[id] = JSON.parse(content);
    } catch (err) {
      console.warn(`[editor] Errore lettura JSON ${file}:`, err.message);
    }
  }
  return result;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e7) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(payload);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('File non trovato');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Errore lettura file: ${err.message}`);
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // API endpoints
  if (pathname === '/api/data' && req.method === 'GET') {
    try {
      const data = {
        rooms: readJsonDir(DATA_PATHS.rooms),
        playables: readJsonDir(DATA_PATHS.playables),
        npcs: readJsonDir(DATA_PATHS.npcs),
        dialogues: readJsonDir(DATA_PATHS.dialogues)
      };
      sendJson(res, 200, { success: true, data });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  if (pathname === '/api/save/room' && req.method === 'POST') {
    try {
      const { roomId, data } = await parseBody(req);
      if (!roomId || typeof roomId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(roomId)) {
        sendJson(res, 400, { success: false, error: 'roomId non valido' });
        return;
      }
      const target = path.join(DATA_PATHS.rooms, `${roomId}.json`);
      fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`[editor] Salvata stanza: ${roomId}.json`);
      sendJson(res, 200, { success: true, message: `Stanza ${roomId} salvata` });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  if (pathname === '/api/save/dialogue' && req.method === 'POST') {
    try {
      const { dialogueId, data } = await parseBody(req);
      if (!dialogueId || typeof dialogueId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(dialogueId)) {
        sendJson(res, 400, { success: false, error: 'dialogueId non valido' });
        return;
      }
      const target = path.join(DATA_PATHS.dialogues, `${dialogueId}.json`);
      fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`[editor] Salvato dialogo: ${dialogueId}.json`);
      sendJson(res, 200, { success: true, message: `Dialogo ${dialogueId} salvato` });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  if (pathname === '/api/save/all' && req.method === 'POST') {
    try {
      const { rooms = {}, dialogues = {} } = await parseBody(req);
      let count = 0;

      for (const [roomId, data] of Object.entries(rooms)) {
        if (/^[a-zA-Z0-9_-]+$/.test(roomId)) {
          const target = path.join(DATA_PATHS.rooms, `${roomId}.json`);
          fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8');
          count += 1;
        }
      }

      for (const [dialogueId, data] of Object.entries(dialogues)) {
        if (/^[a-zA-Z0-9_-]+$/.test(dialogueId)) {
          const target = path.join(DATA_PATHS.dialogues, `${dialogueId}.json`);
          fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8');
          count += 1;
        }
      }

      console.log(`[editor] Salvati ${count} file in totale`);
      sendJson(res, 200, { success: true, count, message: `${count} file salvati con successo` });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // Static files & editor UI
  if (pathname === '/' || pathname === '/editor' || pathname === '/editor.html') {
    serveStatic(res, EDITOR_HTML);
    return;
  }

  // Static from public folder
  const publicCandidate = path.join(PUBLIC_DIR, pathname.replace(/^\/public\//, '/'));
  if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
    serveStatic(res, publicCandidate);
    return;
  }

  // Favicon direct
  if (pathname === '/favicon.svg') {
    serveStatic(res, path.join(PUBLIC_DIR, 'favicon.svg'));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const DEFAULT_PORT = 3333;

function startServer(port) {
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('\n======================================================');
    console.log('   JACKANAL - EDITOR DIALOGHI & SCENARI');
    console.log(`   In esecuzione su: ${url}`);
    console.log('======================================================\n');

    // Auto-apertura del browser su Windows
    if (process.platform === 'win32') {
      exec(`start ${url}`, (err) => {
        if (err) {
          console.log(`Apri manualmente il browser all'indirizzo: ${url}`);
        }
      });
    } else if (process.platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Porta ${port} occupata, provo ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[editor] Errore server:', err);
    }
  });
}

startServer(DEFAULT_PORT);
