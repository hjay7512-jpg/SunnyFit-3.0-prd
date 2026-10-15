// Cache only the asset URLs supplied by an authenticated Figma design context.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = path.resolve(root, process.argv[2]);
const destination = path.resolve(root, process.argv[3]);
if (!destination.startsWith(root + path.sep)) throw Error('Asset directory must stay inside the Demo workspace');
const entries = [...fs.readFileSync(context, 'utf8').matchAll(/^const (\w+) = "(https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"\s]+)";/gm)];
if (!entries.length) throw Error('No Figma-provided asset constants found');
fs.mkdirSync(destination, {recursive: true});
const manifest = {};
let next = 0;
async function download() {
  while (next < entries.length) {
    const [, name, url] = entries[next++];
    const extension = path.extname(new URL(url).pathname);
    if (!['.svg', '.png', '.webp', '.jpg', '.jpeg'].includes(extension)) throw Error('Unsupported asset format');
    const filename = name + extension;
    const target = path.join(destination, filename);
    const response = await fetch(url, {signal: AbortSignal.timeout(45000)});
    if (!response.ok) throw Error(name + ': HTTP ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || /text\/html/.test(response.headers.get('content-type') || '')) throw Error(name + ': invalid asset');
    fs.writeFileSync(target, bytes);
    manifest[name] = {file: filename, bytes: bytes.length};
  }
}
Promise.all(Array.from({length: 4}, download)).then(() => {
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({assets: entries.length, destination, totalBytes: Object.values(manifest).reduce((sum, item) => sum + item.bytes, 0)}));
}).catch(error => {console.error(error.message); process.exitCode = 1;});
