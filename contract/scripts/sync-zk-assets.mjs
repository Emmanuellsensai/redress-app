import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const contractRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(contractRoot, '..');
const CONTRACT = 'redress';

const src = path.join(contractRoot, 'managed', CONTRACT);
const dest = path.join(workspaceRoot, 'frontend', 'public', 'zk', CONTRACT);

if (!fs.existsSync(src)) {
  console.error(`\n  ${path.relative(contractRoot, src)} not found. Run: npm run compile (in contract/)\n`);
  process.exit(1);
}

let copied = 0;
for (const dir of ['keys', 'zkir']) {
  const from = path.join(src, dir);
  if (!fs.existsSync(from)) {
    console.error(`\n  Missing ${path.relative(contractRoot, from)}. Run: npm run compile (in contract/)\n`);
    process.exit(1);
  }
  const to = path.join(dest, dir);
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  for (const file of fs.readdirSync(from)) {
    fs.copyFileSync(path.join(from, file), path.join(to, file));
    copied += 1;
  }
}

console.log(`Synced ${copied} ZK artifact(s) to ${path.relative(workspaceRoot, dest)}`);
