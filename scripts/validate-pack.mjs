import fs from 'node:fs';
import path from 'node:path';

const files = [
  'sources/behaviors/manifest.json',
  'sources/resources/manifest.json'
];
const manifests = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
for (const [idx,m] of manifests.entries()) {
  if (!m.header?.name || !m.header?.uuid || !m.header?.version) throw new Error(`Invalid manifest header: ${files[idx]}`);
  if (!Array.isArray(m.modules) || m.modules.length === 0) throw new Error(`Missing modules: ${files[idx]}`);
}
if (manifests[0].header.name.replace(/Behavior|BP/gi,'').trim() !== manifests[1].header.name.replace(/Resource|RP/gi,'').trim()) {
  throw new Error('Behavior/resource pack names are inconsistent');
}
for (const root of ['sources/behaviors','sources/resources']) {
  for (const file of walk(root)) {
    if (!file.endsWith('.json')) continue;
    JSON.parse(fs.readFileSync(file, 'utf8'));
  }
}
const refs = ['sources/behaviors/scripts/main.js','sources/resources/textures/item_texture.json'];
for (const ref of refs) if (!fs.existsSync(ref)) throw new Error(`Missing expected reference: ${ref}`);
console.log('Pack validation passed');

function* walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}
