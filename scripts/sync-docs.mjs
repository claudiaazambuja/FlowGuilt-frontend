#!/usr/bin/env node
import { rm, cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = 'out';
const DOCS_DIR = 'docs';

async function copyIndexTo404() {
  const indexPath = path.join(DOCS_DIR, 'index.html');
  const notFoundPath = path.join(DOCS_DIR, '404.html');

  try {
    const indexHtml = await readFile(indexPath);
    await writeFile(notFoundPath, indexHtml);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.warn('No index.html found in docs; skipping 404.html copy.');
      return;
    }

    throw error;
  }
}

async function run() {
  await rm(DOCS_DIR, { recursive: true, force: true });
  await cp(OUT_DIR, DOCS_DIR, { recursive: true });
  await writeFile(path.join(DOCS_DIR, '.nojekyll'), '');
  await copyIndexTo404();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
