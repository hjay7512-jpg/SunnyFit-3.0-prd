const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { createStore, DomainError } = require('./store.cjs')
const { dispatch } = require('./dispatch.cjs')
const databasePath = path.resolve(process.env.DEMO_DB_PATH || path.join(__dirname, '../runtime/sunnyfit-admin.sqlite'))
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const store = createStore(databasePath)
if(process.env.MVP_REVIEW_FIXTURES!=='0')require('./mvp-demo.cjs').ensureMvpDemo(store,databasePath)
const apiPrefix = '/api/commercialization'
const dist = path.resolve(__dirname, '../dist')
const collaboration=require('./collaboration.cjs').createLocalCollaboration()
function json(response, status, data) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)) }
async function readBody(request) {
  let text = ''
  for await (const chunk of request) { text += chunk; if (text.length > 128000) throw new DomainError(413, 'BODY_TOO_LARGE', 'Request is too large.') }
  try { return text ? JSON.parse(text) : {} } catch (_) { throw new DomainError(400, 'INVALID_JSON', 'Request body must be valid JSON.') }
}
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1')
    const route = url.pathname
    if(route.startsWith('/api/collaboration/')){
      const service=await collaboration,headers=new Headers();for(const [name,value] of Object.entries(request.headers))if(value)headers.set(name,String(value));
      const body=['POST','PUT','DELETE'].includes(request.method)?JSON.stringify(await readBody(request)):undefined;
      const result=await service.handler(new Request('http://127.0.0.1'+request.url,{method:request.method,headers,body}));
      response.writeHead(result.status,Object.fromEntries(result.headers));return response.end(Buffer.from(await result.arrayBuffer()))
    }
    if(route==='/api/prototype-copy')return json(response,410,{message:'旧文案写入入口已停用，请使用授权协作服务。'})
    if (route === '/api/health') return json(response, 200, { code: 20000, data: { status: 'ok', demo: { workspace: path.resolve(__dirname,'..'), database: databasePath }, modules: ['catalog', 'suits', 'products', 'users', 'wallet', 'content', 'pricing', 'orders', 'subscriptions', 'campaigns', 'audit', 'app'] } })
    if (route.startsWith(apiPrefix)) {
      const body = ['POST','PUT','DELETE'].includes(request.method) ? await readBody(request) : {}
      const data = dispatch(store, request.method, route, body, Object.fromEntries(url.searchParams))
      return json(response, 200, { code: 20000, data })
    }
    if (route.startsWith('/api/')) throw new DomainError(404, 'NOT_FOUND', 'API endpoint was not found.')
    if (request.method !== 'GET') throw new DomainError(405, 'METHOD_NOT_ALLOWED', 'Only GET is supported for static files.')
    const file = path.resolve(dist, '.' + decodeURIComponent(route === '/' ? '/index.html' : route))
    if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(response, 404, { code: 40400, message: 'Run npm run dev, or npm run build before starting the production preview.' })
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.webp':'image/webp', '.svg': 'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm', '.wasm':'application/wasm' }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(response)
  } catch (error) {
    const known = error instanceof DomainError
    if (!known) console.error(error)
    json(response, known ? error.status : 500, { code: known ? error.status * 100 : 50000, reason: known ? error.reason : 'INTERNAL_ERROR', message: known ? error.message : 'The server could not complete this operation.', fields: error.fields || [] })
  }
})
const port = Number(process.env.API_PORT || 3011)
server.listen(port, '127.0.0.1', () => console.log(`SunnyFit prototype API: http://127.0.0.1:${port}`))
server.on('error', error => { console.error(error.message); store.close(); process.exit(1) })
process.on('SIGINT', () => server.close(() => { store.close(); process.exit(0) }))
process.on('SIGTERM', () => server.close(() => { store.close(); process.exit(0) }))
