// Rebuild browser delivery copies; original artwork is always retained.
// Requires ImageMagick. Run: node scripts/optimize-assets.mjs
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/css/site.css'), 'utf8');
const sources = new Set([...html.matchAll(/(?:src|data-fallback)="(assets\/images\/[^" ]+\.png)"/g)].map(match => match[1]));
sources.add('assets/images/rsvp/rsvp-lace-frame-8f2dca09.png');
sources.add('assets/images/rsvp/rsvp-card-background-eefcd42d.png');
for (const match of css.matchAll(/\.\.\/images\/([^" )]+\.png)/g)) sources.add(`assets/images/${match[1]}`);
mkdirSync(resolve(root, 'assets/images/optimized'), { recursive: true });
let before = 0;
let after = 0;
for (const source of sources) {
  const input = resolve(root, source);
  const output = resolve(root, 'assets/images/optimized', basename(source).replace(/\.png$/, '.webp'));
  const resize = source.includes('wax-seal-') ? ['-resize', '384x384>']
    : source.includes('closed-envelope-paper-') ? ['-resize', '1728x1728>'] : [];
  execFileSync('magick', [input, ...resize, '-define', 'webp:lossless=true', output]);
  before += statSync(input).size;
  after += statSync(output).size;
}
console.log(`${sources.size} PNG delivery copies: ${before} → ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`);
