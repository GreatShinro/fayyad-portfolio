import fs from 'fs';
import path from 'path';
import { MAX_PROJECTS, selectEvicted, deleteProjectFolder } from './lib/cap.mjs';

const SRC = 'C:\\Users\\user pc\\.local\\share\\opencode\\tool-output\\tool_fddce4428001Tsh676bHY1fOok';
const OUT = path.join('C:\\fayyad-portfolio', 'index.html');
const ASSET_DIR = 'C:\\Users\\user pc\\AppData\\Local\\Temp\\opencode\\fayyad\\assets';
const IMAGES_TXT = 'C:\\Users\\user pc\\AppData\\Local\\Temp\\opencode\\fayyad\\images.txt';

const GALLERY_CSS = `<style id="fayyad-gallery-css">
#fy-gallery{width:100%;display:flex;flex-direction:column;gap:28px}
.fy-filters{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.fy-filter{font-family:"Inter","Inter Placeholder",sans-serif;font-size:13.5px;font-weight:500;letter-spacing:-.15px;color:#090909;background:#fff;border:1px solid rgba(9,9,9,.12);border-radius:999px;padding:8px 15px;cursor:pointer;transition:background .2s,border-color .2s,color .2s;line-height:1}
.fy-filter span{opacity:.5;font-size:11px;margin-left:5px;font-weight:600}
.fy-filter:hover{border-color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9)}
.fy-filter.is-active{background:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);border-color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);color:#fff}
.fy-filter.is-active span{opacity:.75}
.fy-grid{display:grid;grid-template-columns:repeat(3,minmax(50px,1fr));grid-auto-rows:minmax(0,1fr);justify-content:center;gap:20px;width:100%}
.fy-collapsed .fy-card:nth-child(n+4){display:none}
.fy-card{position:relative;flex-flow:column;align-items:center;gap:20px;background:#f5f4f3;border:1px solid rgba(234,234,234,.65);border-radius:20px;padding:10px 10px 20px;cursor:pointer;overflow:hidden;transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .3s ease,box-shadow .3s ease;outline:none}
.fy-card:hover,.fy-card:focus-visible{transform:translateY(-6px);border-color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);box-shadow:0 24px 48px -28px rgba(95,29,233,.45)}
.fy-card-media{position:relative;flex:none;width:100%;aspect-ratio:4/3;overflow:hidden;background:#eae9e7;border-radius:10px}
.fy-card-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.fy-card:hover .fy-card-media img,.fy-card:focus-visible .fy-card-media img{transform:scale(1.05)}
.fy-card-info{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;padding:0 6px;text-align:center}
.fy-card-num{font-family:"Bebas Neue","Inter Display",sans-serif;font-size:15px;letter-spacing:1px;color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);line-height:1}
.fy-card-title{font-family:"Inter Display","Inter Placeholder",sans-serif;font-size:18px;font-weight:600;letter-spacing:-.4px;line-height:1.22;color:#090909;margin:0}
.fy-card-cat{font-family:"Inter","Inter Placeholder",sans-serif;font-size:12.5px;font-weight:500;color:rgba(9,9,9,.6);letter-spacing:.2px}
.fy-more-wrap{display:flex;justify-content:center;padding-top:2px}
.fy-more{font-family:"Inter","Inter Placeholder",sans-serif;font-size:14.5px;font-weight:600;letter-spacing:-.15px;color:#090909;background:#f5f4f3;border:1px solid rgba(9,9,9,.12);border-radius:50px;padding:14px 34px;cursor:pointer;transition:background .25s,color .25s,border-color .25s;line-height:1}
.fy-more:hover{background:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);border-color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);color:#fff}
.fy-lightbox{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:4vh 4vw}
.fy-lightbox[aria-hidden="true"]{display:none}
.fy-lb-backdrop{position:absolute;inset:0;background:rgba(9,9,9,.66);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.fy-lb-panel{position:relative;z-index:2;display:flex;flex-direction:column;width:min(1180px,94vw);max-height:92vh;background:#fff;border:1px solid rgba(9,9,9,.1);border-radius:22px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(9,9,9,.5)}
.fy-lb-main{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 340px;overflow:hidden}
.fy-lb-left{display:flex;flex-direction:column;min-width:0;min-height:0;background:#f5f4f3;position:relative}
.fy-lb-stage{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;padding:18px;background:#f5f4f3;position:relative}
.fy-lb-img{max-width:100%;max-height:100%;object-fit:contain;display:block;border-radius:8px;box-shadow:0 10px 34px -16px rgba(9,9,9,.35)}
.fy-lb-thumbs{display:flex;gap:8px;overflow-x:auto;padding:0 16px 16px;scrollbar-width:thin;background:#f5f4f3}
.fy-lb-thumb{flex:none;width:62px;height:62px;border-radius:10px;overflow:hidden;border:2px solid transparent;cursor:pointer;padding:0;background:#fff;opacity:.75;transition:opacity .2s,border-color .2s}
.fy-lb-thumb img{width:100%;height:100%;object-fit:cover;display:block;border-radius:8px}
.fy-lb-thumb:hover{opacity:1}
.fy-lb-thumb.is-active{border-color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);opacity:1}
.fy-lb-info{display:flex;flex-direction:column;gap:12px;padding:26px 24px 24px;min-width:0;min-height:0;overflow-y:auto;background:#fff;border-left:1px solid rgba(9,9,9,.08)}
.fy-lb-title{font-family:"Inter Display","Inter Placeholder",sans-serif;font-size:23px;font-weight:600;letter-spacing:-.5px;color:#090909;line-height:1.22}
.fy-lb-cat{font-family:"Inter","Inter Placeholder",sans-serif;font-size:12.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9)}
.fy-lb-desc{font-family:"Inter","Inter Placeholder",sans-serif;font-size:14.5px;line-height:1.65;color:rgba(9,9,9,.72);white-space:pre-line;padding-right:4px}
.fy-lb-close{position:absolute;top:14px;right:14px;z-index:6;width:44px;height:44px;border-radius:12px;border:none;background:rgba(9,9,9,.08);color:#090909;font-size:25px;line-height:1;cursor:pointer;transition:background .2s,color .2s;display:flex;align-items:center;justify-content:center;padding-bottom:2px}
.fy-lb-close:hover{background:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);color:#fff}
.fy-lb-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:6;width:46px;height:46px;border-radius:50%;border:none;background:#fff;color:#090909;font-size:30px;line-height:1;cursor:pointer;transition:background .2s,color .2s;display:flex;align-items:center;justify-content:center;padding:0 0 4px;box-shadow:0 8px 24px -10px rgba(9,9,9,.4)}
.fy-lb-prev{left:14px}.fy-lb-next{right:14px}
.fy-lb-nav:hover{background:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);color:#fff}
.fy-lb-counter{position:absolute;left:16px;top:16px;z-index:6;font-family:"Inter",sans-serif;font-size:12.5px;font-weight:600;color:rgba(9,9,9,.55)}
@media(max-width:1439.98px){
  .fy-grid{grid-template-columns:repeat(2,minmax(50px,1fr))}
  .fy-lb-main{grid-template-columns:minmax(0,1fr) 300px}
}
@media(max-width:809.98px){
  .fy-filters{justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .fy-filters::-webkit-scrollbar{display:none}
  .fy-grid{grid-template-columns:1fr;gap:18px}
  .fy-card-title{font-size:17px}
  .fy-lb-panel{width:96vw;max-height:94vh}
  .fy-lb-main{grid-template-columns:1fr;grid-template-rows:auto auto;overflow-y:auto}
  .fy-lb-left{min-height:42vh}
  .fy-lb-info{border-left:none;border-top:1px solid rgba(9,9,9,.08);overflow:visible;padding:18px 16px}
  .fy-lb-stage{padding:12px}
  .fy-lb-nav{width:40px;height:40px;font-size:26px}
  .fy-lb-prev{left:6px}.fy-lb-next{right:6px}
}
.fy-lb-views{display:flex;gap:6px;align-items:center;padding:14px 16px 0;background:#f5f4f3;flex:none}
.fy-lb-view{font-family:"Inter","Inter Placeholder",sans-serif;font-size:13px;font-weight:600;letter-spacing:-.1px;color:rgba(9,9,9,.55);background:#fff;border:1px solid rgba(9,9,9,.12);border-radius:999px;padding:7px 14px;cursor:pointer;transition:background .2s,color .2s,border-color .2s;line-height:1}
.fy-lb-view:hover{color:#090909;border-color:rgba(9,9,9,.3)}
.fy-lb-view.is-active{background:#090909;border-color:#090909;color:#fff}
.fy-lb-view[hidden]{display:none}
.fy-lb-live{flex:1 1 auto;min-height:0;display:none;flex-direction:column;gap:10px;padding:14px 16px 16px;background:#f5f4f3}
.fy-lb-live.is-active{display:flex}
.fy-lb-live-frame{position:relative;flex:1 1 auto;min-height:0;border-radius:12px;overflow:hidden;background:#fff;border:1px solid rgba(9,9,9,.08);box-shadow:0 10px 34px -16px rgba(9,9,9,.35)}
.fy-lb-iframe{position:relative;z-index:2;width:100%;height:100%;border:0;display:block;background:#fff}
.fy-lb-live-note{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"Inter","Inter Placeholder",sans-serif;font-size:13.5px;color:rgba(9,9,9,.45);background:#fff;z-index:1}
.fy-lb-open{align-self:flex-end;font-family:"Inter","Inter Placeholder",sans-serif;font-size:12.5px;font-weight:600;letter-spacing:.1px;color:var(--token-7ec95c0f-b04a-42ae-a158-91566b52197d,#5f1de9);text-decoration:none;padding:6px 2px}
.fy-lb-open:hover{text-decoration:underline}
</style>`;


let html = fs.readFileSync(SRC, 'utf8');

// ---------- 1. Build image id -> local asset map ----------
const urlLines = fs.readFileSync(IMAGES_TXT, 'utf8').split(/\r?\n/).filter(Boolean);
const assetFiles = fs.readdirSync(ASSET_DIR).filter(f => !/^favicon/.test(f)).sort();
const idMap = {};
urlLines.forEach((url, i) => {
  const id = (url.match(/images\/([A-Za-z0-9]+)\./) || [])[1];
  if (id && assetFiles[i]) idMap[id] = 'assets/' + assetFiles[i];
});
idMap['C312U4sG9ePyeH05l6IQrKVKPg'] = 'assets/favicon.png';
idMap['EMG5Nxxeb8k3yESDFLRSUzQ570'] = 'assets/favicon-dark.png';

// ---------- 2. Localize all framerusercontent image URLs ----------
html = html.replace(
  /https:\/\/framerusercontent\.com\/images\/([A-Za-z0-9]+)(\.[A-Za-z0-9]+)?([^"'\s)]*)/g,
  (m, id) => idMap[id] ? idMap[id] : m
);

// ---------- 2b. Localize framerusercontent @font-face fonts ----------
const FONT_DIR = path.join(path.dirname(OUT), 'assets', 'fonts');
fs.mkdirSync(FONT_DIR, { recursive: true });
const fontUrls = [...new Set([...html.matchAll(/https:\/\/framerusercontent\.com\/assets\/([A-Za-z0-9_-]+\.(?:woff2|woff|ttf|otf))/g)].map(m => m[1]))];
let fontOk = 0;
for (const name of fontUrls) {
  const dest = path.join(FONT_DIR, name);
  if (!fs.existsSync(dest)) {
    try {
      const res = await fetch('https://framerusercontent.com/assets/' + name);
      if (res.ok) {
        fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      } else {
        console.error('FONT FAIL (status ' + res.status + '):', name);
        continue;
      }
    } catch (e) {
      console.error('FONT FAIL:', name, e.message);
      continue;
    }
  }
  fontOk++;
}
html = html.replace(/https:\/\/framerusercontent\.com\/assets\/([A-Za-z0-9_-]+\.(?:woff2|woff|ttf|otf))/g, 'assets/fonts/$1');
console.log('Fonts localized:', fontOk, 'of', fontUrls.length);

// ---------- 3. Head cleanup ----------
html = html.replace(/<meta name="framer-search-index[^>]*>\n?/g, '');
html = html.replace(/<meta name="framer-search-index-fallback[^>]*>\n?/g, '');
html = html.replace(/<script>try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)[\s\S]*?<\/script>\s*/, '');

// ---------- 4. Body cleanup ----------
html = html.replace(/<script async src="https:\/\/events\.framer\.com[\s\S]*?<\/script>\s*/, '');
html = html.replace(/ data-framer-hydrate-v2="[^"]*"/, '');
html = html.replace(/<!--\$-->/g, '').replace(/<!--\/\$-->/g, '');

const badgeStart = html.indexOf('<div id="__framer-badge-container">');
const animatorStart = html.indexOf('<script>var animator=');
if (badgeStart > -1 && animatorStart > badgeStart) {
  html = html.slice(0, badgeStart) + html.slice(animatorStart);
} else {
  console.error('WARN: badge/animator boundaries not found', badgeStart, animatorStart);
}

html = html.replace(/\s*<link rel="modulepreload"[^>]*>\n?/g, '');
html = html.replace(/\s*<script type="module" async data-framer-bundle="main"[^>]*><\/script>\n?/, '');
html = html.replace(/\s*<script type="framer\/handover"[^>]*>[\s\S]*?<\/script>\n?/, '');

// ---------- 5. Internal link rewriting ----------
const linkMap = {
  './work/bethub-central': '#work',
  './work/mayanna': '#work',
  './about': '#about',
  './work': '#work',
  './contact': '#contact',
  './#top': '#top',
  './': '#top',
};
for (const [k, v] of Object.entries(linkMap)) {
  html = html.split('href="' + k + '"').join('href="' + v + '"');
}
html = html.replaceAll('https://x.com/Mandrohttps://x.com/MusaFayyadDesign', 'https://x.com/MusaFayyad');

// ---------- 5b. CV-driven content updates ----------
const CONTENT_UPDATES = [
  ['href="mailto:fayyadmusaadc@gmail.com', 'href="mailto:fayyadmusadc@gmail.com'],
  [
    'I\u2019m Fayyad Musa, a graphic designer specializing in branding and visual identity. I create structured, scalable design systems that help brands communicate clearly and consistently.',
    'I\u2019m Fayyad Musa \u2014 a graphic designer focused on brand identity, visual systems, and social media & digital design. I create structured, scalable design systems that help brands communicate clearly and consistently.'
  ],
  [
    'I specialize in transforming concepts into captivating 3D visuals. Whether it\u2019s product renderings, or immersive environments, my portfolio is designed to tell a story.',
    'I turn strategy into visual systems that work across every touchpoint \u2014 from logos and brand guidelines to social campaigns and digital assets, each built for clarity, consistency, and purpose.'
  ],
  [
    'Let\u2019s create something extraordinary together! Whether you\u2019re looking to visualize a product, animate a concept, or build an interactive experience.',
    'Let\u2019s create something memorable together! Whether you need a full brand identity, a social media campaign, or a complete rebrand, I\u2019ll help your brand communicate clearly and stand out with intent.'
  ],
  ['Business Development', 'Social Media & Campaign Design'],
  ['Also work with these reputable partners:', 'A curated selection of recent work across branding, identity, social media, and more.'],
];
for (const [from, to] of CONTENT_UPDATES) {
  html = html.split(from).join(to);
}

// ---------- 5c. Behance gallery (replace Work Cards) ----------
const BDATA_PATH = path.join(path.dirname(OUT), 'behance-data.json');
if (fs.existsSync(BDATA_PATH)) {
  let behance = JSON.parse(fs.readFileSync(BDATA_PATH, 'utf8'));
  if (behance.length > MAX_PROJECTS) {
    const evicted = selectEvicted(behance, behance.map((p) => String(p.id)));
    console.log('Cap ' + MAX_PROJECTS + ' exceeded (' + behance.length + ') — evicting ' + evicted.length + ':');
    const evictIds = new Set(evicted.map((e) => String(e.id)));
    for (const e of evicted) {
      const freed = deleteProjectFolder(e);
      console.log('  evict', e.id, e.slug, '(freed ' + Math.round(freed / 1024) + 'KB)');
    }
    behance = behance.filter((p) => !evictIds.has(String(p.id)));
    fs.writeFileSync(BDATA_PATH, JSON.stringify(behance, null, 2), 'utf8');
  }
  const CAT_ORDER = ['Logo Design', 'Brand Identity', 'Social Media', 'Packaging', 'Experimental', 'Web Design'];
  const counts = { All: behance.length };
  for (const c of CAT_ORDER) counts[c] = behance.filter(p => p.category === c).length;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const filters = ['All', ...CAT_ORDER].filter(c => c === 'All' || counts[c] > 0).map(c =>
    `<button class="fy-filter${c === 'All' ? ' is-active' : ''}" type="button" data-filter="${c}">${c}<span>${counts[c]}</span></button>`
  ).join('');

  const cards = behance.map((p, i) => {
    const cover = p.cover ? `assets/behance/${p.slug}/${p.cover}` : (p.images && p.images[0] ? `assets/behance/${p.slug}/${p.images[0]}` : '');
    return `<div class="fy-card" data-cat="${esc(p.category)}" data-idx="${i}" tabindex="0" role="button" aria-label="Open project: ${esc(p.name)}"><div class="fy-card-media"><img loading="lazy" src="${cover}" alt="${esc(p.name)}"></div><div class="fy-card-info"><span class="fy-card-num">${String(i + 1).padStart(2, '0')}</span><h3 class="fy-card-title">${esc(p.name)}</h3><span class="fy-card-cat">${esc(p.category)}</span></div></div>`;
  }).join('');

  const gallery = `<div class="fy-gallery" id="fy-gallery"><div class="fy-filters">${filters}</div><div class="fy-grid fy-collapsed">${cards}</div><div class="fy-more-wrap"><button class="fy-more" type="button" aria-expanded="false">View more <span class="fy-more-arrow">\u2193</span></button></div></div>`;

  const WC_START = '<div class="framer-1p1zopo" data-framer-name="Work Cards">';
  let out = '';
  let pos = 0;
  let replaced = 0;
  while (true) {
    const s = html.indexOf(WC_START, pos);
    if (s === -1) break;
    const innerStart = s + WC_START.length;
    let depth = 1;
    let i = innerStart;
    while (i < html.length && depth > 0) {
      const open = html.indexOf('<div', i);
      const close = html.indexOf('</div>', i);
      if (close === -1) break;
      if (open !== -1 && open < close) { depth++; i = open + 4; }
      else { depth--; i = close + 6; }
    }
    if (depth !== 0) { console.error('Work Cards container not closed'); break; }
    const innerEnd = i - 6;
    out += html.slice(pos, innerStart) + gallery + html.slice(innerEnd);
    pos = innerEnd;
    replaced++;
  }
  html = out;
  console.log('Behance gallery injected into', replaced, 'Work Cards variants');

  // Lightbox markup + data blob
  const dataJson = JSON.stringify(behance).replace(/</g, '\\u003c');
  const lightbox =
    '<div class="fy-lightbox" id="fy-lightbox" aria-hidden="true" role="dialog" aria-modal="true">' +
    '<div class="fy-lb-backdrop" data-fy-close></div>' +
    '<div class="fy-lb-panel">' +
    '<button class="fy-lb-close" type="button" data-fy-close aria-label="Close">\u00d7</button>' +
    '<div class="fy-lb-main">' +
    '<div class="fy-lb-left">' +
    '<button class="fy-lb-nav fy-lb-prev" type="button" aria-label="Previous project">\u2039</button>' +
    '<button class="fy-lb-nav fy-lb-next" type="button" aria-label="Next project">\u203a</button>' +
    '<div class="fy-lb-stage"><img class="fy-lb-img" src="" alt=""></div>' +
    '<div class="fy-lb-thumbs"></div>' +
    '<div class="fy-lb-views">' +
    '<button class="fy-lb-view is-active" type="button" data-fy-view="project">Project</button>' +
    '<button class="fy-lb-view" type="button" data-fy-view="live">Live Preview</button>' +
    '</div>' +
    '<div class="fy-lb-live" aria-hidden="true">' +
    '<div class="fy-lb-live-frame"><iframe class="fy-lb-iframe" src="" title="Live preview of the site home page" loading="lazy" allow="fullscreen"></iframe><div class="fy-lb-live-note">Loading live site…</div></div>' +
    '<a class="fy-lb-open" href="#" target="_blank" rel="noopener">Open live site in new tab ↗</a>' +
    '</div>' +
    '</div>' +
    '<div class="fy-lb-info"><div class="fy-lb-title"></div><div class="fy-lb-cat"></div><div class="fy-lb-desc"></div></div>' +
    '</div>' +
    '</div></div>';
  const blob = '<script id="fayyad-behance" type="application/json">' + dataJson + '<\/script>';
  html = html.replace('</body>', lightbox + '\n' + blob + '\n</body>');

  html = html.replace('</head>', GALLERY_CSS + '\n</head>');
} else {
  console.warn('behance-data.json not found; skipping gallery');
}

// ---------- 6. Inject helper script + marker ----------
html = html.replace('</head>', '\t<meta name="generator" content="Static replica of fayyadmusa.framer.website">\n</head>');
html = html.replace('</body>', '\t<script src="script.js"></script>\n</body>');

fs.writeFileSync(OUT, html, 'utf8');
console.log('Wrote', OUT, fs.statSync(OUT).size, 'bytes');
console.log('Image IDs mapped:', Object.keys(idMap).length);
