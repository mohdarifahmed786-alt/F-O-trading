import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServer = path.resolve(__dirname, 'dist', 'server.js');

if (fs.existsSync(distServer)) {
  // In production (after npm run build), run the pre-bundled native Node server
  await import('./dist/server.js');
} else {
  // In development, run via tsx loader
  const isTsx =
    process.execArgv.some((a) => a === 'tsx' || a.includes('/tsx') || a.includes('tsx/dist')) ||
    process.env.__TSX_BOOTSTRAP__ === '1';

  if (!isTsx) {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
      {
        stdio: 'inherit',
        env: { ...process.env, __TSX_BOOTSTRAP__: '1' },
      }
    );
    child.on('exit', (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      process.exit(code ?? 0);
    });
  } else {
    await import('./src/server.ts');
  }
}
