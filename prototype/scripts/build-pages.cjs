const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { build } = require('esbuild')
const { createHash } = require('node:crypto')
const root = path.resolve(__dirname, '..')
const base = process.env.DEMO_PUBLIC_PATH || '/SunnyFit-3.0-prd/prototype/'
if (!/^\/[a-zA-Z0-9/_.-]*\/$/.test(base) || base.split('/').includes('..')) throw new Error('DEMO_PUBLIC_PATH must be an absolute directory URL ending in /.')
const output = path.join(root, 'pages-dist')
const runtime = path.join(root, 'public/demo-runtime')
async function main() {
  fs.mkdirSync(runtime, { recursive: true })
  for (const name of ['sql-wasm.js', 'sql-wasm.wasm']) fs.copyFileSync(path.join(root, 'node_modules/sql.js/dist', name), path.join(runtime, name))
  fs.copyFileSync(path.join(root, 'node_modules/sql.js/LICENSE'), path.join(runtime, 'sql.js-LICENSE'))
  await build({
    entryPoints: [path.join(__dirname, 'pages/runtime.cjs')],
    outfile: path.join(runtime, 'engine.js'), bundle: true, platform: 'browser', target: 'es2020', minify: true,
    plugins: [{ name: 'browser-node-adapters', setup(builder) {
      builder.onResolve({ filter: /^node:sqlite$/ }, () => ({ path: path.join(__dirname, 'pages/sqlite.cjs') }))
      builder.onResolve({ filter: /^node:crypto$/ }, () => ({ path: path.join(__dirname, 'pages/crypto.cjs') }))
    } }]
  })
  const engineFile = 'engine.' + createHash('sha256').update(fs.readFileSync(path.join(runtime, 'engine.js'))).digest('hex').slice(0, 16) + '.js'
  fs.renameSync(path.join(runtime, 'engine.js'), path.join(runtime, engineFile))
  const result = spawnSync(process.execPath, ['--openssl-legacy-provider', path.join(root, 'node_modules/@vue/cli-service/bin/vue-cli-service.js'), 'build', '--dest', output], {
    cwd: root, stdio: 'inherit', env: { ...process.env, DEMO_PUBLIC_PATH: base, VUE_APP_DEMO_RUNTIME: 'browser', VUE_APP_DEMO_ENGINE: engineFile }
  })
  if (result.status !== 0) process.exit(result.status || 1)
  function rewrite(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) rewrite(file)
      else if (/\.(js|css|html|json|svg)$/.test(entry.name)) {
        const original = fs.readFileSync(file, 'utf8')
        // Legacy source assets use root URLs. Change compiled output only so the
        // local API build and its Figma comparisons keep their original paths.
        const updated = original.replace(/\/assets\//g, (match, offset) => original.slice(Math.max(0, offset - base.length + 1), offset) === base.slice(0, -1) ? match : base + 'assets/')
        if (original !== updated) fs.writeFileSync(file, updated)
      }
    }
  }
  rewrite(output)
  fs.writeFileSync(path.join(output, '.nojekyll'), '')
  fs.writeFileSync(path.join(output, 'deployment.json'), JSON.stringify({ name: 'SunnyFit 3.0 prototype', runtime: 'browser-sqlite', base, sourceCommit: process.env.GITHUB_SHA || null }, null, 2))
  console.log('Pages prototype ready: ' + output + ' at ' + base)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
