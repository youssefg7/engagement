// Export selected generated art at useful Retina dimensions, retaining source masks.
// Run after editing assets/images/enhanced/manifest.json. Requires ImageMagick.
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const directory = resolve(root, 'assets/images/enhanced');
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
for (const name of ['web', 'masks']) mkdirSync(resolve(directory, name), { recursive: true });
for (const art of manifest) {
  const original = resolve(root, art.source);
  const [width, height] = execFileSync('magick', ['identify', '-format', '%w %h', original], { encoding: 'utf8' }).split(' ').map(Number);
  const scale = Math.min(3, 2048 / Math.max(width, height));
  const size = `${Math.round(width * scale)}x${Math.round(height * scale)}!`;
  const trim = art.trim ? ['-fuzz', '8%', '-trim', '+repage'] : [];
  execFileSync('magick', [resolve(directory, art.generated), ...trim, '-resize', size, '-quality', '88', resolve(directory, `web/${art.key}.webp`)]);
  // A compact black RGBA mask keeps the exact original cutout, including holes.
  execFileSync('magick', [original, '-channel', 'RGB', '-evaluate', 'set', '0', '+channel', '-define', 'webp:lossless=true', resolve(directory, `masks/${art.key}.webp`)]);
}
console.log(`Built ${manifest.length} enhanced artwork exports and original-silhouette masks.`);
