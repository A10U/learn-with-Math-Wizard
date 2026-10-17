import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['index.html', 'styles.css', 'app.js', 'lib/content.js', 'lib/questions.js', 'lib/engine.js', 'lib/storage.js', 'lib/audio.js', 'assets/logo.jpg'];
for (const file of required) if (!statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(path.join(folder, item.name)) : [path.join(folder, item.name)]);
for (const file of [path.join(root, 'app.js'), ...walk(path.join(root, 'lib'))].filter(file => file.endsWith('.js'))) {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) throw new Error(checked.stderr);
  if (/(?:core concept|planing step|doing step|research_notes|\.\.\/resource)\//i.test(readFileSync(file, 'utf8'))) throw new Error(`Private folder reference: ${file}`);
}
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const target = match[1];
  if (target.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
  const file = path.resolve(root, target.split(/[?#]/)[0]);
  if (!file.startsWith(root) || !statSync(file).isFile()) throw new Error(`Broken application asset: ${target}`);
}
console.log('Application files, script syntax and local assets: PASS');
