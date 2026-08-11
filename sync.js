import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INDEX, readHtml, writeHtml, parseData, applyEntry, removeEntry, replaceBlob, slugify } from './lib/gallery-update.mjs';
import { MAX_PROJECTS, selectEvicted, deleteProjectFolder } from './lib/cap.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const PROFILE = 'https://www.behance.net/blaysemusic';
const RSS_URL = PROFILE + '.rss';
const VARIANTS = ['source', '1400', 'fs_webp', '1400_webp', 'max_1300', 'max_1200', 'hd', 'hd_webp', 'max_1200_webp', 'max_1400_webp'];
const CATS_FILE = path.join(ROOT, 'behance-categories.json');
const DATA_FILE = path.join(ROOT, 'behance-data.json');
const EXCLUDE = new Set(['155453777', '155453927', '153462413', '146352223', '149423377']);

const HINTS = [
  [/logo|emblem|monogram|wordmark|\bmark\b/i, 'Logo Design'],
  [/brand|identity|guideline/i, 'Brand Identity'],
  [/social|carousel|instagram|thread|\bpost\b|flyer|feed|thumbnail/i, 'Social Media'],
  [/packaging|pitch.?deck|label|\bbox\b/i, 'Packaging'],
];

const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] ?? true;
}
const FORCE_CATEGORY = typeof args.category === 'string' ? args.category : null;
const DRY = !!args['dry-run'];

function readDataIds() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).map((d) => String(d.id));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanRssDesc(raw) {
  if (!raw) return '';
  const t = raw.replace(/<img[^>]*\/?\s*>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/\*\*/g, '');
  return decodeEntities(t).trim();
}

async function fetchRss() {
  const r = await fetch(RSS_URL, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('RSS HTTP ' + r.status);
  const xml = await r.text();
  const items = [];
  for (const block of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = block[1];
    const cdata = (s) => {
      const m = it.match(new RegExp('<' + s + '><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></' + s + '>'));
      return m ? m[1] : null;
    };
    const title = cdata('title');
    const link = cdata('link');
    const descRaw = cdata('description');
    const pubDate = cdata('pubDate');
    if (!link) continue;
    const m = link.match(/behance\.net\/gallery\/(\d+)(?:\/([^?#]+))?/i);
    if (!m) continue;
    const cover = (descRaw ? descRaw.match(/<img[^>]*src=['"]([^'"]+)/i) : null)?.[1] || null;
    items.push({
      id: m[1],
      slug: m[2] || slugify(title || m[1]),
      link,
      title: decodeEntities(title || '').replace(/\.\s*$/, '').trim(),
      desc: cleanRssDesc(descRaw),
      cover,
      pubDate,
    });
  }
  return items;
}

function guessCategory(name, desc) {
  const hay = (name + ' ' + desc).slice(0, 3000);
  for (const [re, cat] of HINTS) if (re.test(hay)) return cat;
  return 'Experimental';
}

async function scrapeProject(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  const html = await r.text();
  let name = null, desc = null;
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const b = JSON.parse(m[1].trim().replace(/[\u0000-\u001f]/g, ' '));
      const art = (Array.isArray(b) ? b : [b]).find((x) => x && (x['@type'] === 'VisualArtwork' || (Array.isArray(x['@type']) && x['@type'].includes('VisualArtwork'))));
      if (art) {
        name = art.name || name;
        desc = art.description || desc;
      }
    } catch (e) { /* ignore malformed ld+json */ }
  }
  if (!name) {
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    name = t ? t[1].replace(/\s+/g, ' ').trim() : '';
  }
  return { name: decodeEntities(name.replace(/\.\s*$/, '').trim()), description: decodeEntities(desc || '').trim() };
}

async function timed(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function collectHashes(html) {
  const map = new Map();
  const order = [];
  for (const m of html.matchAll(/project_modules\/(?:[^/"'\\\s]+)\/([A-Za-z0-9]+\.[A-Za-z0-9]+\.(?:png|jpe?g|gif))/g)) {
    if (!map.has(m[1])) { map.set(m[1], order.length); order.push(m[1]); }
  }
  return order;
}

async function tryDownload(url) {
  try {
    const r = await timed(url, { headers: { 'User-Agent': UA, Referer: 'https://www.behance.net/' }, redirect: 'follow' }, 20000);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length >= 100 ? buf : null;
  } catch (e) { return null; }
}

function variantUrl(key, v) {
  return 'https://mir-s3-cdn-cf.behance.net/project_modules/' + v + '/' + key;
}

async function downloadProjectImages(slug, url) {
  const dir = path.join(ROOT, 'assets', 'behance', slug);
  fs.mkdirSync(dir, { recursive: true });
  const r = await timed(url, { headers: { 'User-Agent': UA } }, 20000);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  const html = await r.text();
  const hashes = collectHashes(html);
  const existing = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  const images = [];
  let failed = 0;
  for (const key of hashes) {
    const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    const fname = String(images.length + 1).padStart(2, '0') + '.' + ext;
    if (existing.has(fname)) { images.push(fname); continue; }
    let buf = null, used = null;
    for (const v of VARIANTS) {
      buf = await tryDownload(variantUrl(key, v));
      if (buf) { used = v; break; }
      await sleep(60);
    }
    if (!buf) { failed++; console.log('  MISS ' + slug + ' ' + key); continue; }
    fs.writeFileSync(path.join(dir, fname), buf);
    images.push(fname);
    console.log('  ' + slug + ' ' + fname + ' (' + used + ') ' + Math.round(buf.length / 1024) + 'KB');
    await sleep(120);
  }
  return images;
}

async function main() {
  let html0 = readHtml();
  const cats = JSON.parse(fs.readFileSync(CATS_FILE, 'utf8'));

  console.log('Fetching RSS:', RSS_URL);
  const rss = await fetchRss();
  console.log('RSS items:', rss.length);

  const rssById = new Map(rss.map((i) => [i.id, i]));
  let backfilled = 0;
  html0 = replaceBlob(html0, (data) => {
    for (const d of data) {
      const it = rssById.get(d.id);
      if (it && !d.pubDate) { d.pubDate = it.pubDate; backfilled++; }
    }
  });
  if (backfilled) console.log('Backfilled pubDate for', backfilled, 'existing project(s).');

  const data = parseData(html0);
  const existing = new Set(data.map((d) => d.id));
  const fresh = rss.filter((i) => !existing.has(i.id) && !EXCLUDE.has(i.id));
  console.log('New projects found:', fresh.length);

  if (DRY) {
    console.log('DRY RUN — would add:');
    for (const i of fresh) console.log('  +', i.id, i.title || i.slug);
    const order = readDataIds();
    const evict = selectEvicted([...data, ...fresh.map((f) => ({ id: f.id, slug: f.slug, pubDate: f.pubDate }))], order);
    console.log('DRY RUN — would evict (undated by data-file order, then by upload date; pinned never; cap ' + MAX_PROJECTS + '):');
    for (const e of evict) console.log('  -', e.id, e.slug, '(' + (e.pubDate || 'undated') + ')');
    if (!fresh.length && !evict.length) console.log('Gallery within cap; nothing to do.');
    return;
  }

  const entries = [];
  for (const item of fresh) {
    console.log('Processing', item.id, item.slug);
    let name = item.title, description = item.desc;
    try {
      const s = await scrapeProject(item.link);
      name = s.name || name;
      description = s.description || description;
    } catch (e) {
      console.log('  scrape failed (' + e.message + ') — using RSS data');
    }
    const category = FORCE_CATEGORY || cats[item.id] || guessCategory(name, description);
    console.log('  ->', name, '|', category);
    const images = await downloadProjectImages(item.slug, item.link);
    if (!images.length) {
      console.log('  SKIP: no images downloaded for', item.id);
      continue;
    }
    cats[item.id] = category;
    entries.push({ id: item.id, slug: item.slug, url: item.link, name, category, description, cover: images[0], images, pubDate: item.pubDate, addedAt: new Date().toISOString() });
    await sleep(200);
  }

  if (!entries.length && !backfilled && data.length <= MAX_PROJECTS) {
    console.log('Nothing to sync — gallery is up to date within cap (' + data.length + '/' + MAX_PROJECTS + ').');
    return;
  }

  let html = html0;
  if (entries.length) {
    for (let i = entries.length - 1; i >= 0; i--) html = applyEntry(html, entries[i]);
    console.log('Added ' + entries.length + ' project(s).');
  }

  const evicted = selectEvicted(parseData(html), readDataIds());
  for (const e of evicted) {
    console.log('Evicting:', e.id, e.slug, '(' + (e.pubDate || 'undated') + ')');
    html = removeEntry(html, e.id);
    const freed = deleteProjectFolder(e);
    console.log('  removed folder, freed ' + Math.round(freed / 1024) + 'KB');
    delete cats[e.id];
  }
  if (evicted.length) console.log('Cap enforced: now ' + parseData(html).length + '/' + MAX_PROJECTS);

  writeHtml(INDEX, html);

  const catsSorted = Object.fromEntries(Object.entries(cats).sort((a, b) => a[0] < b[0] ? -1 : 1));
  fs.writeFileSync(CATS_FILE, JSON.stringify(catsSorted, null, 2), 'utf8');
  if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const evictIds = new Set(evicted.map((e) => e.id));
    const known = new Set(data.map((d) => d.id));
    let keep = saved.filter((e) => !evictIds.has(e.id) && known.has(e.id));
    keep.unshift(...entries);
    for (const d of keep) {
      if (!d.pubDate) {
        const it = rssById.get(d.id);
        if (it) d.pubDate = it.pubDate;
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(keep, null, 2), 'utf8');
    console.log('Data file updated:', keep.length, 'entries.');
  }

  console.log('DONE. Added ' + entries.length + ' project(s), evicted ' + evicted.length + '.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
