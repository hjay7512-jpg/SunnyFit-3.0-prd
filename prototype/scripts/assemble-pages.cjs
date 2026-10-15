// Keep the repository's existing HTML pages byte-for-byte in the Pages artifact.
const fs = require('node:fs'), path = require('node:path')
const prototype = path.resolve(__dirname, '..'), repository = path.resolve(prototype, '..')
const output = path.join(repository, '_site')
if (!fs.existsSync(path.join(prototype, 'pages-dist/index.html'))) throw new Error('Build the Pages prototype first.')
if (fs.existsSync(output)) throw new Error('_site already exists; use a fresh staging directory.')
fs.mkdirSync(output)
for (const entry of fs.readdirSync(repository, { withFileTypes: true })) {
  if (entry.name.startsWith('.') || ['prototype', '_site', 'node_modules'].includes(entry.name)) continue
  fs.cpSync(path.join(repository, entry.name), path.join(output, entry.name), { recursive: true })
}
for (const file of ['CNAME', '.well-known']) if (fs.existsSync(path.join(repository, file))) fs.cpSync(path.join(repository, file), path.join(output, file), { recursive: true })
fs.cpSync(path.join(prototype, 'pages-dist'), path.join(output, 'prototype'), { recursive: true })
fs.writeFileSync(path.join(output, '.nojekyll'), '')
console.log('Existing pages and /prototype/ assembled at ' + output)
