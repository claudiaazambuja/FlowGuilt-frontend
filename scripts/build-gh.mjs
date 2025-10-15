#!/usr/bin/env node
import { spawn } from 'node:child_process';

async function run() {
  const child = spawn('next', ['build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true'
    }
  });

  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`next build exited with code ${code}`));
      }
    });
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
