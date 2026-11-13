import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileDir = path.resolve(__dirname, '..', 'mobile');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const child = spawn(npmCmd, ['start'], {
  cwd: mobileDir,
  stdio: 'inherit',
  shell: isWindows,
});

child.on('exit', code => {
  process.exit(code ?? 0);
});
