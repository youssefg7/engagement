// Reapply the selected artwork manifest to both language pages.
import { readFileSync, writeFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('assets/images/enhanced/manifest.json', 'utf8'));
for (const page of ['index.html', 'ar/index.html']) {
  const prefix = page.startsWith('ar/') ? '../' : '';
  let html = readFileSync(page, 'utf8');
  html = html.replace(/<img\b[^>]*data-fallback="[^"]+"[^>]*>/g, tag => {
    const original = tag.match(/data-fallback="([^"]+)"/)[1].replace(/^\.\.\//, '');
    const art = manifest.find(item => [item.source, ...(item.aliases || [])].includes(original));
    if (!art) return tag;
    const image = `${prefix}assets/images/enhanced/web/${art.key}-alpha.webp`;
    tag = tag.replace(/ style="[^"]*"/, '').replace(/ data-mask="[^"]*"/, '').replace(/ restored-art/g, '');
    // Transparency lives in the asset; classless images need no special handling.
    tag = /class="[^"]*"/.test(tag)
      ? tag.replace(/class="([^"]*)"/, `class="$1 restored-art"`)
      : tag.replace('<img ', '<img class="restored-art" ');
    return tag.includes('data-src=') ? tag.replace(/data-src="[^"]+"/, `data-src="${image}"`) : tag.replace(/ src="[^"]+"/, ` src="${image}"`);
  });
  writeFileSync(page, html);
}
