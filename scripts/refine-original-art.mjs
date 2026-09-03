// Deterministic processing of ORIGINAL PNGs only. No AI models or redrawing.
// Run from any directory. Requires ImageMagick; originals are never overwritten.
import { readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const outputDir = resolve(root, 'assets/images/refined');
mkdirSync(outputDir, { recursive: true });
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const sources = [...new Set([...html.matchAll(/data-fallback="(assets\/images\/[^" ]+\.png)"/g)].map(m => m[1]))];
const settings = { scale: 2, filter: 'Mitchell', unsharp: '0x0.65+0.4+0.025', maxByteRatio: 1.8 };
const assets = [];
for (const source of sources) {
  // Leave photos, paper, seals, typography-like line art, and animated GIFs alone.
  if (!/floral|nile-watercolor|sailboat|sleeping-child|pink-car|dress-examples|suit-examples|bouquet|calla-lilies|amaranthus/.test(basename(source))) continue;
  const input = resolve(root, source);
  const [width, height] = execFileSync('magick', ['identify', '-format', '%w %h', input], { encoding: 'utf8' }).split(' ').map(Number);
  if (Math.max(width, height) > 800) continue;
  const filename = basename(source).replace(/\.png$/, `-${settings.scale}x.webp`);
  const output = resolve(outputDir, filename);
  const originalBytes = statSync(resolve(root, 'assets/images/optimized', basename(source).replace(/\.png$/, '.webp'))).size;
  const budget = Math.max(16000, originalBytes * settings.maxByteRatio);
  let quality = 94;
  for (quality of [94, 90, 86]) {
    execFileSync('magick', [input, '-filter', settings.filter, '-resize', `${settings.scale * 100}%`,
      '-channel', 'RGB', '-unsharp', settings.unsharp, '+channel',
      '-quality', String(quality), '-define', 'webp:alpha-quality=100', output]);
    if (statSync(output).size <= budget) break;
  }
  const bytes = statSync(output).size;
  // Skip an oversized result rather than undoing the site's loading improvements.
  if (bytes > budget) { unlinkSync(output); continue; }
  const opaque = path => execFileSync('magick', ['identify', '-format', '%[opaque]', path], {encoding:'utf8'}).trim();
  if (opaque(input) === 'False' && opaque(output) !== 'False') throw new Error(`Transparency was lost: ${source}`);
  assets.push({ source, output: `assets/images/refined/${filename}`, width: width * settings.scale, height: height * settings.scale, quality, originalBytes, bytes });
}
writeFileSync(resolve(outputDir, 'manifest.json'), JSON.stringify({ settings, assets }, null, 2) + '\n');
console.log(`${assets.length} original-art 2x variants: ${assets.reduce((n,a)=>n+a.originalBytes,0)} → ${assets.reduce((n,a)=>n+a.bytes,0)} bytes. Native-size originals remain available.`);
