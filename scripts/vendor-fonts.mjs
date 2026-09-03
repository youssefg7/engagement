// Cache the existing Google Fonts stylesheet and its exact WOFF2 files locally.
// Re-run only when changing the site's font families or weights. Requires network.
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { basename } from 'node:path';
const html = readFileSync('index.html', 'utf8');
const previous = existsSync('assets/css/fonts.css') ? readFileSync('assets/css/fonts.css', 'utf8') : '';
const remote = html.match(/href="(https:\/\/fonts.googleapis.com\/css2[^"]+)"/)?.[1]?.replaceAll('&amp;', '&') || previous.match(/Original request: (https:[^ ]+)/)?.[1];
if (!remote) throw new Error('Restore the original Google Fonts stylesheet link before refreshing the cache.');
const response = await fetch(remote, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
let css = await response.text();
if (!css.includes("format('woff2')")) throw new Error('Expected compressed WOFF2 delivery.');
const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(match => match[1]))];
mkdirSync('assets/fonts', { recursive: true });
for (const url of urls) {
  const font = await fetch(url);
  if (!font.ok) throw new Error(`Font download: ${font.status}`);
  writeFileSync(`assets/fonts/${basename(url)}`, Buffer.from(await font.arrayBuffer()));
  css = css.replaceAll(url, `../fonts/${basename(url)}`);
}
writeFileSync('assets/css/fonts.css', `/* Exact Google Fonts delivery copies. Original request: ${remote} */\n${css}`);
for (const match of previous.matchAll(/url\(\.\.\/fonts\/([\w.-]+\.ttf)\)/g)) {
  const old = `assets/fonts/${match[1]}`;
  if (existsSync(old)) unlinkSync(old);
}
const families = ['anton', 'arefruqaaink', 'ballet', 'caveat', 'cormorantgaramond', 'greatvibes', 'italiana', 'italianno', 'montserrat', 'mrssaintdelafield', 'notokufiarabic', 'notonaskharabic', 'qwigley'];
for (const family of families) {
  const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if (!license.ok) throw new Error(`License for ${family}: ${license.status}`);
  writeFileSync(`assets/fonts/${family}-OFL.txt`, (await license.text()).replaceAll('\r\n', '\n').replace(/[ \t]+$/gm, ''));
}
for (const page of ['index.html', 'ar/index.html']) {
  const prefix = page.startsWith('ar/') ? '../' : '';
  let content = readFileSync(page, 'utf8');
  content = content.replace(/    <link rel="preconnect" href="https:\/\/fonts\.[^\n]+\n/g, '');
  content = content.replace(/href="https:\/\/fonts.googleapis.com\/css2[^"]+"/, `href="${prefix}assets/css/fonts.css"`);
  writeFileSync(page, content);
}
console.log(`Saved ${urls.length} font subsets and all 13 licenses; font families and weights unchanged.`);
