import fs from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT = 'C:\\fayyad-portfolio\\behance-raw.json';

const EXCLUDE = new Set([
  '155453777', '155453927', '153462413', '146352223', '149423377',
]);

const ALL = [
  ['242095197','Knowledge-Chain-Visual-Identity-Guideline'],
  ['231781213','YouNick-Studio-Brand-Identity-Guideline'],
  ['242752305','Gurasa-Dotcom-Pitch-Deck'],
  ['197336259','Apex-Bit-(Crypto)'],
  ['224046353','Carousel-Post-for-Construction-Company'],
  ['224044749','Paradise-Wave-Logo'],
  ['215535431','Twitter-Thread-Design-001'],
  ['203353683','Knots-Klips-(Hair-Accessories-Brand)'],
  ['203047231','Instagram-Carousel-for-Social-Server'],
  ['203047065','Pastries-Brand'],
  ['199626739','Beauty-Organic-Brand-Logo'],
  ['199626419','Barbershop-Logo-Design'],
  ['199626025','Fashion-House-Logo'],
  ['197335965','Three-Dreams-(3D-Modelling-Brand)'],
  ['192572493','BetHub-Central'],
  ['188458733','OMG-Logo-Design'],
  ['186892257','SPOTIFY-LOGO-REDESIGN'],
  ['186890421','Dynamic-Youtube-Thumbnail-Designs'],
  ['182483145','Outlaws-VII'],
  ['159954143','Clothing-Brand-Logo-Design'],
  ['158958957','Blue-Giants-Promotions-Logo'],
  ['158285937','Emperor-Music-Company'],
  ['157831631','Construction-Service-Logo'],
  ['158063723','Tunnel-The-Brand'],
  ['157831821','Oyizami-Enterprise-Table-Water-Logo'],
  ['156118083','DKV-Travels'],
  ['155628447','Coffee-Shop-Logo'],
  ['155473965','The-Mask-Man'],
  ['153462579','AWR-Solutions-Logo-Design'],
  ['153461365','Video-Gaming-Brand-Logo-Design'],
  ['149214395','Brand-Guideline-Design'],
  ['153462223','Fortunata-Boat-Logo'],
];

const list = ALL.filter(([id]) => !EXCLUDE.has(id));
const results = [];

for (const [id, slug] of list) {
  const url = `https://www.behance.net/gallery/${id}/${slug}`;
  let r;
  try {
    r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) { console.log('HTTP', r.status, url); results.push({ id, slug, url, error: 'HTTP ' + r.status }); continue; }
  } catch (e) { console.log('ERR', e.message, url); results.push({ id, slug, url, error: e.message }); continue; }
  const html = await r.text();

  const ldBlocks = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { ldBlocks.push(JSON.parse(m[1])); } catch (e) { try { ldBlocks.push(JSON.parse(m[1].trim().replace(/[\u0000-\u001f]/g, ''))); } catch (e2) {} }
  }
  const art = ldBlocks.map(b => Array.isArray(b) ? b : [b]).flat().find(b => b && (b['@type'] === 'VisualArtwork' || (Array.isArray(b['@type']) && b['@type'].includes('VisualArtwork')))) || null;

  const og = html.match(/property=["']og:image["']\s+content=["']([^"']+)/i);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const cover = art?.image || (Array.isArray(art) ? null : null) || og?.[1] || null;

  results.push({
    id, slug, url,
    name: art?.name || null,
    description: art?.description || null,
    cover: (typeof cover === 'string' ? cover : null),
    images: (Array.isArray(cover) ? cover : null),
    dateCreated: art?.dateCreated || null,
    author: art?.author || null,
    title: title ? title[1].replace(/\s+/g, ' ').trim() : null,
    ldCount: ldBlocks.length,
  });
  console.log(`[${results.length}/${list.length}] ${id} ${slug}`);
}

fs.writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf8');
console.log('WROTE', OUT, results.length, 'projects');
