const fs = require('node:fs'); const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync('runtime/design-context/assets.json','utf8'));
const entries = Object.values(manifest).flatMap(Object.values);
let cursor = 0; const failures = [];
async function worker() { while(cursor < entries.length) { const entry = entries[cursor++]; const file = path.join('public',entry.path); fs.mkdirSync(path.dirname(file),{recursive:true}); if(fs.existsSync(file) && fs.statSync(file).size) continue; try { const r = await fetch(entry.url); if(!r.ok) throw new Error(String(r.status)); const buffer = Buffer.from(await r.arrayBuffer()); if(!buffer.length) throw new Error('empty asset'); fs.writeFileSync(file, buffer); } catch(e) { failures.push({path:entry.path,error:e.message}); } } }
Promise.all(Array.from({length:6},worker)).then(()=>{ console.log(JSON.stringify({assets:entries.length,failures})); if(failures.length) process.exitCode=1; });
