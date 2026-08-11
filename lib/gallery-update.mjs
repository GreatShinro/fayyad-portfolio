import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const INDEX = path.join(ROOT, 'index.html');

export function readHtml(p = INDEX) { return readFileSync(p, 'utf8'); }
export function writeHtml(p = INDEX, html) { writeFileSync(p, html, 'utf8'); }

export function parseData(html) {
  const m = html.match(/<script id="fayyad-behance" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('fayyad-behance script not found');
  return JSON.parse(m[1]);
}

export function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function naturalSort(list) {
  return list.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

export function entryDir(entry) {
  return entry.dir || ('assets/behance/' + entry.slug);
}

export function buildCard(entry, idx) {
  const dir = entryDir(entry);
  const cover = (entry.images && entry.images.length) ? entry.images[0] : (entry.cover || '01.png');
  const nameHtml = escapeHtml(entry.name);
  const catHtml = escapeHtml(entry.category);
  return '<div class="fy-card" data-cat="' + catHtml + '" data-idx="' + idx + '" tabindex="0" role="button" aria-label="Open project: ' + nameHtml + '">' +
    '<div class="fy-card-media"><img loading="lazy" src="' + dir + '/' + cover + '" alt="' + nameHtml + '"></div>' +
    '<div class="fy-card-info"><span class="fy-card-num">' + String(idx + 1).padStart(2, '0') + '</span><h3 class="fy-card-title">' + nameHtml + '</h3><span class="fy-card-cat">' + catHtml + '</span></div></div>';
}

const FILTER_RE = /<button class="(fy-filter[^"]*)" type="button" data-filter="([^"]+)">([^<]*)<span>(\d+)<\/span><\/button>/g;

export function applyEntry(html, entry) {
  if (!entry || !entry.id || !entry.name || !entry.category) {
    throw new Error('entry requires id, name, category');
  }

  const gridCount = (html.match(/class="fy-grid fy-collapsed">/g) || []).length;
  if (gridCount !== 3) throw new Error('expected 3 grid copies, got ' + gridCount);

  const filters = [...html.matchAll(FILTER_RE)];
  if (!filters.length) throw new Error('no filter buttons found');
  const allCopies = filters.filter((f) => f[2] === 'All').length;
  if (allCopies !== 3) throw new Error('expected 3 All buttons, got ' + allCopies);
  const catCopies = filters.filter((f) => f[2] === entry.category).length;
  if (catCopies !== 0 && catCopies !== 3) {
    throw new Error('expected 0 or 3 category buttons for "' + entry.category + '", got ' + catCopies);
  }

  const before = parseData(html);
  if (before.some((d) => d.id === entry.id)) throw new Error('project already present: ' + entry.id);
  const beforeIdx = (html.match(/data-idx="\d+"/g) || []).length;
  const beforeNum = (html.match(/fy-card-num">\d+</g) || []).length;
  if (beforeIdx !== beforeNum) throw new Error('data-idx / fy-card-num mismatch before transform');

  html = html.replace(/data-idx="(\d+)"/g, (m, n) => 'data-idx="' + (+n + 1) + '"');
  html = html.replace(/fy-card-num">(\d+)</g, (m, n) => 'fy-card-num">' + String(+n + 1).padStart(2, '0') + '<');
  html = html.replace(/class="fy-grid fy-collapsed">/g, 'class="fy-grid fy-collapsed">' + buildCard(entry, 0));
  html = html.replace(
    /<script id="fayyad-behance" type="application\/json">\[/,
    '<script id="fayyad-behance" type="application/json">[' + safeJson(entry) + ','
  );
  html = html.replace(FILTER_RE, (m, cls, cat, label, n) => {
    if (cat === 'All' || cat === entry.category) {
      return '<button class="' + cls + '" type="button" data-filter="' + cat + '">' + label + '<span>' + (+n + 1) + '</span></button>';
    }
    return m;
  });
  if (catCopies === 0) {
    const catHtml = escapeHtml(entry.category);
    const btn = '<button class="fy-filter" type="button" data-filter="' + catHtml + '">' + catHtml + '<span>1</span></button>';
    html = html.replace(/(data-filter="All">All<span>\d+<\/span><\/button>)/g, '$1' + btn);
  }

  const after = parseData(html);
  const afterIdx = (html.match(/data-idx="\d+"/g) || []).length;
  const afterNum = (html.match(/fy-card-num">\d+</g) || []).length;
  if (after.length !== before.length + 1) throw new Error('json length mismatch after transform');
  if (after[0].id !== entry.id) throw new Error('new entry is not first');
  if (afterIdx !== beforeIdx + 3) throw new Error('data-idx count mismatch after transform');
  if (afterNum !== beforeNum + 3) throw new Error('fy-card-num count mismatch after transform');
  const labelRe = new RegExp('aria-label="Open project: ' + escapeHtml(entry.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
  if ((html.match(labelRe) || []).length !== 3) throw new Error('new card not inserted in all 3 grids');
  return html;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function replaceBlob(html, mutator) {
  const open = '<script id="fayyad-behance" type="application/json">';
  const start = html.indexOf(open);
  if (start === -1) throw new Error('fayyad-behance script not found');
  const contentStart = start + open.length;
  const close = html.indexOf('</script>', contentStart);
  if (close === -1) throw new Error('fayyad-behance blob close not found');
  const raw = html.slice(contentStart, close);
  const data = JSON.parse(raw);
  mutator(data);
  const next = '[' + data.map(safeJson).join(',') + ']';
  return html.slice(0, contentStart) + next + html.slice(close);
}

function changeFilterCount(html, cat, delta) {
  const safe = escapeHtml(cat);
  const re = new RegExp(
    '(<button class="fy-filter[^"]*" type="button" data-filter="' + escapeRegExp(safe) + '">)' +
    '([^<]*)' + '(<span>)(\\d+)(</span></button>)',
    'g'
  );
  return html.replace(re, (m, pre, label, spanOpen, n, spanClose) => {
    const v = +n + delta;
    if (v <= 0) return '';
    return pre + label + spanOpen + v + spanClose;
  });
}

function removeCardBlockAt(html, idxOcc) {
  const start = html.lastIndexOf('<div class="fy-card"', idxOcc);
  if (start === -1) return null;
  let depth = 1;
  let i = start + '<div class="fy-card"'.length;
  while (i < html.length && depth > 0) {
    const open = html.indexOf('<div', i);
    const close = html.indexOf('</div>', i);
    if (close === -1) return null;
    if (open !== -1 && open < close) { depth++; i = open + 4; }
    else { depth--; i = close + 6; }
  }
  if (depth !== 0) return null;
  return html.slice(0, start) + html.slice(i - 6);
}

export function removeEntry(html, id) {
  if (!id) throw new Error('removeEntry requires an id');
  const before = parseData(html);
  const idx = before.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('project not found: ' + id);
  const entry = before[idx];

  let removed = 0;
  let occ;
  while ((occ = html.indexOf('data-idx="' + idx + '"')) !== -1) {
    const next = removeCardBlockAt(html, occ);
    if (next === null) throw new Error('failed to balance-remove card for ' + id);
    html = next;
    removed++;
  }
  if (removed !== 3) throw new Error('expected 3 cards removed for ' + id + ', got ' + removed);

  html = html.replace(/data-idx="(\d+)"/g, (m, n) => (+n > idx ? 'data-idx="' + (+n - 1) + '"' : m));
  html = html.replace(/fy-card-num">(\d+)</g, (m, n) => (+n > idx + 1 ? 'fy-card-num">' + String(+n - 1).padStart(2, '0') + '<' : m));

  html = changeFilterCount(html, 'All', -1);
  html = changeFilterCount(html, entry.category, -1);

  html = replaceBlob(html, (data) => {
    const i = data.findIndex((d) => d.id === id);
    if (i === -1) throw new Error('blob entry not found: ' + id);
    data.splice(i, 1);
  });

  const after = parseData(html);
  if (after.length !== before.length - 1) throw new Error('json length mismatch after removal');
  const idxCount = (html.match(/data-idx="\d+"/g) || []).length;
  const numCount = (html.match(/fy-card-num">\d+</g) || []).length;
  if (idxCount !== after.length * 3) throw new Error('data-idx count mismatch after removal: ' + idxCount + ' != ' + after.length * 3);
  if (numCount !== after.length * 3) throw new Error('fy-card-num count mismatch after removal: ' + numCount + ' != ' + after.length * 3);
  const labelRe = new RegExp('aria-label="Open project: ' + escapeRegExp(escapeHtml(entry.name)) + '"', 'g');
  if ((html.match(labelRe) || []).length !== 0) throw new Error('card markup still present for ' + id);
  return html;
}
