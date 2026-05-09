import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function* walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()) yield* walk(p); else if(p.endsWith('.js')) yield p;}}
const files=[...walk('sources/behaviors/scripts')];
for(const f of files){execFileSync(process.execPath,['--check',f],{stdio:'pipe'});} 
console.log(`JS syntax checks passed for ${files.length} files.`);
