// Minimal static server for local preview and end-to-end tests.
// Usage: node scripts/serve.mjs [port] [directory]
// /api/* returns 404, so the app shows "AI belum diaktifkan" as on any static host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const root = resolve(process.argv[3] ?? 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
};

export function startServer(listenPort = port, directory = root) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      response.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"not_found"}');
      return;
    }
    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const filePath = join(directory, relative === '' ? 'index.html' : relative);
    if (!filePath.startsWith(directory)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const info = await stat(filePath);
      const target = info.isDirectory() ? join(filePath, 'index.html') : filePath;
      const body = await readFile(target);
      response.writeHead(200, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    }
  });
  return new Promise((resolvePromise) => server.listen(listenPort, '127.0.0.1', () => resolvePromise(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await startServer();
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
}
