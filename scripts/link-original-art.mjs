// Reapply original artwork delivery copies to both routes, preserving lazy loading.
// Optional deterministic 2x variants; --original-only restores native originals.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const manifest = resolve(root, 'assets/images/refined/manifest.json');
const refined = !process.argv.includes('--original-only') && existsSync(manifest)
  ? JSON.parse(readFileSync(manifest, 'utf8')).assets : [];
for (const page of ['index.html', 'ar/index.html']) {
  const prefix = page.startsWith('ar/') ? '../' : '';
  const file = resolve(root, page);
  let count = 0;
  const html = readFileSync(file, 'utf8').replace(/<img\b[^>]*data-fallback="[^"]+"[^>]*>/g, tag => {
    const original = tag.match(/data-fallback="([^"]+)"/)[1].replace(/^\.\.\//, '');
    const delivery = `assets/images/optimized/${basename(original).replace(/\.png$/, '.webp')}`;
    if (!existsSync(resolve(root, original)) || !existsSync(resolve(root, delivery))) {
      throw new Error(`Missing original or delivery copy: ${original}`);
    }
    tag = tag.replace(/\s*restored-art\b/g, '').replace(/ class=""/g, '')
      .replace(/ data-mask="[^"]*"/g, '').replace(/ (?:data-)?srcset="[^"]*"/g, '');
    const variant = refined.find(asset => asset.source === original);
    if (variant) {
      if (!existsSync(resolve(root, variant.output))) throw new Error(`Missing 2x variant: ${variant.output}`);
      const attribute = tag.includes('data-src=') ? 'data-srcset' : 'srcset';
      tag = tag.replace('<img ', `<img ${attribute}="${prefix}${delivery} 1x, ${prefix}${variant.output} 2x" `);
    }
    if (tag.includes('data-src=')) tag = tag.replace(/data-src="[^"]+"/, `data-src="${prefix}${delivery}"`);
    else tag = tag.replace(/ src="[^"]+"/, ` src="${prefix}${delivery}"`);
    count++;
    return tag;
  });
  if (html.includes('images/enhanced/')) throw new Error(`Generated artwork remains in ${page}`);
  writeFileSync(file, html);
  console.log(`${page}: ${count} original artwork placements linked.`);
}
