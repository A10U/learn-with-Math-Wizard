import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
// Only application runtime files are allowed into the publication artifact.
const files = ['index.html', 'styles.css', 'app.js', 'lib', 'assets'];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(path.join(root, file), path.join(output, file), { recursive: true, dereference: false });
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Built dist/: web app only. No planning documents or original resource directory.');
