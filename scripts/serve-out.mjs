#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DEFAULT_DIR = 'out';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function printHelp() {
  console.log(`Static file server for the Next.js export output.\n\n` +
    `Usage: npm run start [-- [options]]\n\n` +
    `Options:\n` +
    `  -p, --port <number>   Port to listen on (default: ${DEFAULT_PORT})\n` +
    `  -d, --dir <path>      Directory to serve (default: ${DEFAULT_DIR})\n` +
    `  -h, --help            Show this help message\n`);
}

function normalizeOptions(argv) {
  let port = DEFAULT_PORT;
  let dir = DEFAULT_DIR;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        return { help: true };
      case '-p':
      case '--port':
        i += 1;
        if (i >= argv.length) {
          throw new Error(`${arg} option requires a value`);
        }
        port = Number(argv[i]);
        if (!Number.isInteger(port) || port <= 0) {
          throw new Error(`Invalid port: ${argv[i]}`);
        }
        break;
      case '-d':
      case '--dir':
        i += 1;
        if (i >= argv.length) {
          throw new Error(`${arg} option requires a value`);
        }
        dir = argv[i];
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { port, dir };
}

function resolveFile(rootDir, requestPath) {
  const safePath = decodeURIComponent(requestPath.split('?')[0] ?? '/').replace(/\\/g, '/');
  const normalized = path.posix.normalize(`/${safePath}`);
  const relativePath = normalized === '/' ? '' : normalized.slice(1);
  const candidate = path.resolve(rootDir, relativePath);

  if (!candidate.startsWith(rootDir)) {
    return path.join(rootDir, 'index.html');
  }

  return candidate;
}

async function findExistingFile(filePath, fallbackDir) {
  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      return findExistingFile(path.join(filePath, 'index.html'), fallbackDir);
    }
    return { filePath, statusCode: 200 };
  } catch {
    const fallback404 = path.join(fallbackDir, '404.html');
    try {
      await access(fallback404);
      return { filePath: fallback404, statusCode: 404 };
    } catch {
      const fallbackIndex = path.join(fallbackDir, 'index.html');
      await access(fallbackIndex);
      return { filePath: fallbackIndex, statusCode: 200 };
    }
  }
}

async function start() {
  let options;
  try {
    options = normalizeOptions(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
  } catch (error) {
    console.error(error.message);
    printHelp();
    process.exitCode = 1;
    return;
  }

  const rootDir = path.resolve(process.cwd(), options.dir ?? DEFAULT_DIR);
  try {
    await access(rootDir);
  } catch {
    console.error(`Directory not found: ${rootDir}`);
    console.error('Run "npm run build" before starting the static server.');
    process.exitCode = 1;
    return;
  }

  const server = createServer(async (req, res) => {
    try {
      const requestUrl = req.url ?? '/';
      const pathname = url.parse(requestUrl).pathname ?? '/';
      const resolvedPath = resolveFile(rootDir, pathname);
      const { filePath, statusCode } = await findExistingFile(resolvedPath, rootDir);

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES.get(ext) ?? 'application/octet-stream';
      res.statusCode = statusCode;
      res.setHeader('Content-Type', contentType);
      const stream = createReadStream(filePath);
      stream.on('error', (error) => {
        console.error('Error streaming file', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
      stream.pipe(res);
    } catch (error) {
      console.error('Error handling request', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    }
  });

  server.listen(options.port ?? DEFAULT_PORT, () => {
    console.log(`Serving ${rootDir} at http://localhost:${options.port ?? DEFAULT_PORT}`);
  });
}

start();
