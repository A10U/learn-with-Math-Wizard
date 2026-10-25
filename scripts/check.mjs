import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['index.html', 'styles.css', 'app.js', 'lib/analytics.js', 'lib/seo.js', 'lib/font-size.js', 'lib/content.js', 'lib/questions.js', 'lib/grade-content.js', 'lib/question-visuals.js', 'lib/question-visuals.css', 'lib/upper-primary.js', 'lib/adventure.js', 'lib/moon-maze.js', 'lib/star-expanse.js', 'lib/adventure-campaigns.js', 'lib/adventure-storage.js', 'lib/adventure-ui.js', 'lib/adventure.css', 'lib/arcade.js', 'lib/arcade-ui.js', 'lib/arcade-i18n.js', 'lib/i18n.js', 'lib/ui-translations.js', 'lib/writing-tables.js', 'lib/writing-table-ui.js', 'lib/math-simulator.js', 'lib/math-simulator-ui.js', 'lib/math-simulator-visuals.js', 'lib/math-simulator.css', 'lib/gem-shop.js', 'lib/gem-shop-ui.js', 'lib/gem-shop-art.js', 'lib/gem-shop.css', 'lib/magic-shop.js', 'lib/magic-shop-storage.js', 'lib/magic-shop-ui.js', 'lib/magic-shop-art.js', 'lib/magic-shop.css', 'lib/fraction-quest.js', 'lib/fraction-quest-ui.js', 'lib/fraction-quest.css', 'lib/fraction-world-3d.js', 'lib/crystal-quest.js', 'lib/crystal-quest-ui.js', 'lib/crystal-quest.css', 'lib/crystal-world-3d.js', 'lib/vendor/three/three.module.min.js', 'lib/vendor/three/three.core.min.js', 'lib/vendor/three/LICENSE', 'lib/handwriting.js', 'lib/handwriting-content.js', 'lib/geometry.js', 'lib/drawing.js', 'lib/engine.js', 'lib/storage.js', 'lib/audio.js', 'lib/background-music.js', 'lib/celebration.js', 'lib/celebration.css', 'assets/logo.jpg', 'assets/og-image.png', 'assets/favicon-48.png', 'assets/icon-192.png', 'assets/apple-touch-icon.png', 'sitemap.xml'];
for (const file of required) if (!statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(path.join(folder, item.name)) : [path.join(folder, item.name)]);
for (const file of [path.join(root, 'app.js'), ...walk(path.join(root, 'lib'))].filter(file => file.endsWith('.js'))) {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) throw new Error(checked.stderr);
  if (/(?:core concept|planing step|doing step|research_notes|\.\.\/resource)\//i.test(readFileSync(file, 'utf8'))) throw new Error(`Private folder reference: ${file}`);
}
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const indexURL = pathToFileURL(path.join(root, 'index.html'));
const siteURL = 'https://a10u.github.io/learn-with-Math-Wizard/';
function checkLocalAsset(target) {
  const resolved = new URL(target, indexURL);
  if (resolved.protocol !== 'file:') throw new Error(`Broken application asset: ${target}`);
  let file = fileURLToPath(resolved);
  if (file.endsWith(path.sep)) file = path.join(file, 'index.html');
  const relative = path.relative(root, file);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error(`Broken application asset: ${target}`);
  let exists = false;
  try { exists = statSync(file).isFile(); } catch { /* Report the original reference below. */ }
  if (!exists) throw new Error(`Broken application asset: ${target}`);
}
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const target = match[1];
  if (target.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(target)) continue;
  checkLocalAsset(target);
}
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), match[2]]));
const canonicalLinks = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(tag => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'));
if (canonicalLinks.length !== 1 || canonicalLinks[0].href !== siteURL) throw new Error('The homepage must have one canonical URL matching its deployed address.');
const locations = [...readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1]);
if (locations.length !== 1 || locations[0] !== siteURL) throw new Error('The sitemap must list only the canonical homepage URL.');
const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
for (const name of ['og:image', 'twitter:image']) {
  const images = metaTags.filter(tag => (tag.property || tag.name)?.toLowerCase() === name);
  if (images.length !== 1 || !images[0].content?.startsWith(siteURL)) throw new Error(`Missing local deployed social image: ${name}`);
  checkLocalAsset('./' + images[0].content.slice(siteURL.length));
}
console.log('Application files, script syntax, local assets and SEO publication metadata: PASS');
