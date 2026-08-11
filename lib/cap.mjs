import fs from 'node:fs';
import path from 'node:path';
import { ROOT, entryDir } from './gallery-update.mjs';

export const MAX_PROJECTS = 36;
export const PIN_PREFIX = 'web-';

export function isPinned(entry) {
  return String(entry.id).startsWith(PIN_PREFIX);
}

export function pubDateMs(entry) {
  const t = entry.pubDate ? Date.parse(entry.pubDate) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

export function selectEvicted(entries, order) {
  const position = new Map((order || []).map((id, i) => [String(id), i]));
  const evictable = entries.filter((e) => !isPinned(e));
  const overflow = entries.length - MAX_PROJECTS;
  if (overflow <= 0) return [];
  const isDated = (e) => Number.isFinite(pubDateMs(e));
  evictable.sort((a, b) => {
    const ad = isDated(a), bd = isDated(b);
    if (ad !== bd) return ad ? 1 : -1;
    const pa = position.get(String(a.id)), pb = position.get(String(b.id));
    if (pa !== undefined && pb !== undefined && pa !== pb) return pa - pb;
    if (pa === undefined && pb === undefined) return pubDateMs(a) - pubDateMs(b);
    return pa === undefined ? 1 : -1;
  });
  return evictable.slice(0, overflow);
}

export function folderSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    total += st.isDirectory() ? folderSize(p) : st.size;
  }
  return total;
}

export function deleteProjectFolder(entry) {
  const dir = path.join(ROOT, entryDir(entry));
  if (!fs.existsSync(dir)) return 0;
  const size = folderSize(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  return size;
}
