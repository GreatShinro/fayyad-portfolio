import fs from 'fs';
import path from 'path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const ROOT = 'C:\\fayyad-portfolio';
const IMGDIR = path.join(ROOT, 'assets', 'behance');
const cats = JSON.parse(fs.readFileSync(path.join(ROOT, 'behance-categories.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'behance-raw.json'), 'utf8'));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const VARIANTS = ['source', '1400', 'fs_webp', '1400_webp', 'max_1300', 'max_1200', 'hd', 'hd_webp', 'max_1200_webp', 'max_1400_webp'];

async function timed(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchHtml(url) {
  const r = await timed(url, { headers: { 'User-Agent': UA } }, 20000);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

async function tryDownload(url) {
  try {
    const r = await timed(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.behance.net/' },
      redirect: 'follow',
    }, 20000);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 100) return null;
    return buf;
  } catch (e) { return null; }
}

function collectHashes(html) {
  const map = new Map(); // key "hash.ext" -> ordered index
  const order = [];
  for (const m of html.matchAll(/project_modules\/(?:[^/"'\\\s]+)\/([A-Za-z0-9]+\.[A-Za-z0-9]+\.(?:png|jpe?g|gif))/g)) {
    const key = m[1];
    if (!map.has(key)) { map.set(key, order.length); order.push(key); }
  }
  return order;
}

function variantUrl(key, variant) {
  return 'https://mir-s3-cdn-cf.behance.net/project_modules/' + variant + '/' + key;
}

async function main() {
  fs.mkdirSync(IMGDIR, { recursive: true });
  const projects = [];

  for (const p of raw) {
    const slug = p.slug;
    const dir = path.join(IMGDIR, slug);
    fs.mkdirSync(dir, { recursive: true });

    let html;
    try { html = await fetchHtml(p.url); } catch (e) { console.log('ERR fetch', slug, e.message); continue; }

    const hashes = collectHashes(html);
    const downloaded = [];
    const existing = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
    let failed = 0;

    for (let i = 0; i < hashes.length; i++) {
      const key = hashes[i];
      const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
      const num = String(downloaded.length + 1).padStart(2, '0');
      const fname = num + '.' + ext;
      if (existing.has(fname)) { downloaded.push(fname); continue; }
      let buf = null, usedVariant = null;
      for (const v of VARIANTS) {
        buf = await tryDownload(variantUrl(key, v));
        if (buf) { usedVariant = v; break; }
        await sleep(60);
      }
      if (!buf) { failed++; console.log(`  MISS ${slug} ${key}`); continue; }
      const out = path.join(dir, fname);
      fs.writeFileSync(out, buf);
      downloaded.push(fname);
      console.log(`  ${slug} ${fname} (${usedVariant}) ${(buf.length/1024).toFixed(0)}KB`);
      await sleep(120);
    }

    projects.push({
      id: p.id, slug, url: p.url,
      name: (p.name || p.title || slug).replace(/\.\s*$/, '').trim(),
      category: cats[p.id] || 'Other',
      description: (p.description || '').trim(),
      cover: downloaded[0] || null,
      images: downloaded,
    });
    console.log(`[done] ${slug} images=${downloaded.length} failed=${failed}`);
    await sleep(200);
  }

  fs.writeFileSync(path.join(ROOT, 'behance-data.json'), JSON.stringify(projects, null, 2), 'utf8');
  console.log('WROTE behance-data.json', projects.length, 'projects');
}

main().catch(e => { console.error(e); process.exit(1); });
