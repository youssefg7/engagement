// Export selected generated art with transparency embedded in the WebP itself.
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
  const scale = Math.min(art.deliveryScale || 3, (art.maxEdge || 2048) / Math.max(width, height));
  const size = `${Math.round(width * scale)}x${Math.round(height * scale)}!`;
  const trim = art.trim ? ['-fuzz', '8%', '-trim', '+repage'] : [];
  const generated = resolve(directory, art.generated);
  let args = [generated, ...trim];
  if (art.alpha === 'extract') {
    // Remove only white connected to the canvas exterior, preserving white
    // shirts/petals inside the artwork. Work before resizing for clean edges.
    args.push('-bordercolor', 'white', '-border', '1', '-alpha', 'set', '-fuzz', `${art.fuzz || 7}%`, '-fill', 'none', '-draw', 'color 0,0 floodfill', '-shave', '1x1');
    // Optional interior background gaps, in selected source PNG pixel coordinates.
    for (const [x, y] of art.backgroundSeeds || []) args.push('-draw', `color ${x},${y} floodfill`);
  }
  args.push('-resize', size);
  if (!art.alpha || art.alpha === 'source') {
    args.push('(', original, '-alpha', 'extract', '-resize', size, ')', '-alpha', 'off', '-compose', 'CopyOpacity', '-composite');
  }
  execFileSync('magick', [...args, '-quality', '90', resolve(directory, `web/${art.key}-alpha.webp`)]);
  const opaque = execFileSync('magick', ['identify', '-format', '%[opaque]', resolve(directory, `web/${art.key}-alpha.webp`)], {encoding:'utf8'}).trim();
  if (opaque === 'True') throw new Error(`${art.key} must have real transparency`);
}
console.log(`Built and checked ${manifest.length} transparent WebP exports.`);
