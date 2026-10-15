const { spawn } = require('node:child_process')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const children = [
  spawn(process.execPath, [path.join(root, 'server/index.cjs')], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, ['--openssl-legacy-provider', path.join(root, 'node_modules/@vue/cli-service/bin/vue-cli-service.js'), 'serve', '--host', '127.0.0.1', '--port', '8080'], { cwd: root, stdio: 'inherit' })
]
let stopping = false
function stop(code) {
  if (stopping) return
  stopping = true
  children.forEach(child => { if (!child.killed) child.kill() })
  process.exitCode = code
}
children.forEach(child => {
  child.on('error', error => { console.error(error.message); stop(1) })
  child.on('exit', code => { if (!stopping) stop(code || 0) })
})
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
