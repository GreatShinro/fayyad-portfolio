import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INDEX, readHtml, writeHtml, parseData, applyEntry, slugify, naturalSort } from './lib/gallery-update.mjs';

function getArg(name) {
  const a = process.argv.find((x) => x.startsWith('--' + name + '='));
  return a ? a.slice(('--' + name + '=').length) : null;
}

const name = getArg('name');
const category = getArg('category');
if (!name || !category) {
  console.error('Usage: node add-nonbehance.mjs --name="My Project" --category="Logo Design" [--slug=my-project] [--url=https://...] [--description="text"] [--dry-run]');
  console.error('Images must already exist in assets/projects/<slug>/ as 01.png, 02.jpg, ...');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const slug = getArg('slug') || slugify(name);
const url = getArg('url') || '';
const description = getArg('description') || '';
const dir = path.join('assets', 'projects', slug);
const absDir = path.join(ROOT, dir);

if (!fs.existsSync(absDir)) {
  console.error('Images dir not found: ' + absDir);
  console.error('Create it and drop the project images in as 01.<ext>, 02.<ext>, ...');
  process.exit(1);
}
const files = naturalSort(fs.readdirSync(absDir)).filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f));
if (!files.length) {
  console.error('No image files found in ' + absDir);
  process.exit(1);
}

const html0 = readHtml();
const data = parseData(html0);
const id = 'nb-' + slug;
if (data.some((d) => d.id === id)) {
  console.error('Project already present: ' + id);
  process.exit(1);
}

const entry = { id, slug, url, name, category, description, cover: files[0], images: files, dir };

if (DRY) {
  console.log('DRY RUN — would add:');
  console.log('  id:', id);
  console.log('  name:', name);
  console.log('  category:', category);
  console.log('  dir:', dir, '(' + files.length + ' image(s))');
  process.exit(0);
}

writeHtml(INDEX, applyEntry(html0, entry));
console.log('Added non-Behance project: ' + name + ' | ' + category + ' | ' + dir + ' | ' + files.length + ' image(s)');
