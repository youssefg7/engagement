// Reapply original artwork delivery copies to both routes, preserving lazy loading.
// No image generation, upscaling, recoloring, or changes to the original alpha.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
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
      .replace(/ data-mask="[^"]*"/g, '');
    if (tag.includes('data-src=')) tag = tag.replace(/data-src="[^"]+"/, `data-src="${prefix}${delivery}"`);
    else tag = tag.replace(/ src="[^"]+"/, ` src="${prefix}${delivery}"`);
    count++;
    return tag;
  });
  if (html.includes('images/enhanced/')) throw new Error(`Generated artwork remains in ${page}`);
  writeFileSync(file, html);
  console.log(`${page}: ${count} original artwork placements linked.`);
}
