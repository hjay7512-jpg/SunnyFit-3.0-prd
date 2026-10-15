// Read-only browser preview for this workspace's documents and evidence images.
// No external dependencies, uploads, database access or source-file writes.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const docs = fs.realpathSync(path.join(root, 'docs'))
const port = Number(process.env.REVIEW_PORT || 3110)
const latest = '/docs/SunnyFit_V3_Demo_Validation_And_Update_Plan.md'
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fileUrl = relative => '/' + relative.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
function linkUrl(value, current) {
  if (/^https?:\/\//i.test(value)) return value
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return '#'
  try { const url = new URL(value, 'http://local-preview' + current); return url.pathname + url.search + url.hash } catch (_) { return '#' }
}
function inline(value, current) {
  const parts = []
  const token = html => { const id = parts.push(html) - 1; return `\u0000${id}\u0000` }
  let text = value.replace(/`([^`]+)`/g, (_, code) => token('<code>' + escape(code) + '</code>'))
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => token(`<img loading="lazy" alt="${escape(alt)}" src="${escape(linkUrl(url, current))}">`))
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => token(`<a href="${escape(linkUrl(url, current))}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)}</a>`))
  text = escape(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return text.replace(/\u0000(\d+)\u0000/g, (_, id) => parts[Number(id)])
}
// Supports the repository's headings, paragraphs, tables, lists, links and fenced code.
// Raw HTML remains text rather than executable markup.
function markdown(source, current) {
  const lines = source.replace(/\r/g, '').split('\n')
  const html = []
  const cells = line => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'))
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (/^```/.test(line)) {
      const code = []; i++
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++])
      html.push('<pre><code>' + escape(code.join('\n')) + '</code></pre>'); i++; continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) { const n = heading[1].length; html.push(`<h${n}>${inline(heading[2], current)}</h${n}>`); i++; continue }
    if (i + 1 < lines.length && line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      html.push('<div class="table-scroll"><table><thead><tr>' + cells(line).map(c => '<th>' + inline(c, current) + '</th>').join('') + '</tr></thead><tbody>'); i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { html.push('<tr>' + cells(lines[i++]).map(c => '<td>' + inline(c, current) + '</td>').join('') + '</tr>') }
      html.push('</tbody></table></div>'); continue
    }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line), tag = ordered ? 'ol' : 'ul'
      html.push('<' + tag + '>')
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) html.push('<li>' + inline(lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''), current) + '</li>')
      html.push('</' + tag + '>'); continue
    }
    if (/^\s*---+\s*$/.test(line)) { html.push('<hr>'); i++; continue }
    const paragraph = [line]; i++
    while (i < lines.length && lines[i].trim() && !/^(?:#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i]) && !(i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]))) paragraph.push(lines[i++])
    html.push('<p>' + inline(paragraph.join('\n'), current).replace(/\n/g, '<br>') + '</p>')
  }
  return html.join('\n')
}
const css = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f4f6f9;color:#182236;font:16px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}header{background:white;border-bottom:1px solid #dce3ed;padding:14px 24px;position:sticky;top:0;z-index:1}header nav{max-width:1120px;margin:auto;display:flex;gap:22px;flex-wrap:wrap}a{color:#1557b0;text-underline-offset:3px}main{max-width:1120px;margin:30px auto;padding:32px 40px;background:white;border:1px solid #e0e6ef;border-radius:12px}h1{font-size:30px;line-height:1.4}h2{margin-top:42px;font-size:23px;border-bottom:1px solid #e2e7ef;padding-bottom:10px}h3{margin-top:30px;font-size:19px}p{margin:16px 0}code{font:14px/1.7 Consolas,monospace;background:#eef2f7;border-radius:4px;padding:2px 5px}pre{overflow:auto;padding:18px;background:#182236;color:#edf3ff;border-radius:8px}pre code{background:none;padding:0;color:inherit}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.7}th,td{padding:12px;border:1px solid #dce3ed;text-align:left;vertical-align:top}th{background:#f0f4fa}tr:nth-child(even){background:#fafbfd}.table-scroll{overflow:auto}img{max-width:100%;height:auto}.meta{font-size:13px;color:#627086}li{margin:8px 0}.doc-list{padding-left:22px}.document-card{padding:18px;background:#f0f5fd;border-radius:8px}input{font:inherit;width:min(100%,500px);padding:9px 12px;border:1px solid #bac7d9;border-radius:6px}button{font:inherit;padding:9px 18px;border:0;background:#1557b0;color:white;border-radius:6px;cursor:pointer}@media(max-width:700px){main{margin:12px 8px;padding:20px 16px}h1{font-size:25px}header{padding:10px 16px}}@media print{header{display:none}body{background:white}main{border:0;margin:0;padding:0;max-width:none}a{color:inherit}pre{white-space:pre-wrap}}`
function page(title, body, sourceUrl) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · SunnyFit 交付预览</title><style>${css}</style></head><body><header><nav><strong>SunnyFit 交付预览</strong><a href="/">文档目录</a><a href="/latest">最新验证与更新方案</a>${sourceUrl ? `<a href="${escape(sourceUrl)}">查看源文件</a>` : ''}</nav></header><main>${body}</main></body></html>`
}
function allowedFile(route) {
  const candidate = path.resolve(root, '.' + route)
  const resolved = fs.realpathSync(candidate)
  const relative = path.relative(docs, resolved)
  if (resolved !== path.join(root, 'README.md') && (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative))) throw Object.assign(new Error('Only docs and README are available.'), { status: 403 })
  if (!fs.statSync(resolved).isFile()) throw Object.assign(new Error('Not a file.'), { status: 404 })
  return resolved
}
function listMarkdown(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) listMarkdown(item, found)
    else if (entry.isFile() && entry.name.endsWith('.md')) found.push(item)
  }
  return found
}
function send(response, status, type, body) { response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' https:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" }); response.end(body) }
const server = http.createServer((request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) return send(response, 405, 'text/plain; charset=utf-8', 'Read-only preview.')
    if (!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(request.headers.host || '')) return send(response, 403, 'text/plain', 'Local host only.')
    const url = new URL(request.url, `http://127.0.0.1:${port}`)
    const route = decodeURIComponent(url.pathname)
    if (route === '/health') return send(response, 200, 'application/json', JSON.stringify({ service: 'sunnyfit-review-viewer', workspace: root }))
    if (route === '/latest') { response.writeHead(302, { Location: latest }); return response.end() }
    if (route === '/') {
      const query = url.searchParams.get('q') || ''
      const files = [path.join(root, 'README.md'), ...listMarkdown(docs)].filter(file => file.toLowerCase().includes(query.toLowerCase()))
      const items = files.map(file => { const content = fs.readFileSync(file, 'utf8'), title = (content.match(/^#\s+(.+)$/m) || [null, path.basename(file)])[1]; return `<li><a href="${fileUrl(path.relative(root, file))}">${escape(title)}</a><div class="meta">${escape(path.relative(root, file))}</div></li>` }).join('')
      return send(response, 200, 'text/html; charset=utf-8', page('文档目录', `<h1>文档与验证证据</h1><p class="document-card"><a href="/latest">打开三轮验证结果与前后台更新方案 →</a></p><form><input name="q" value="${escape(query)}" aria-label="搜索文件名" placeholder="搜索文件名"><button>查找</button></form><ul class="doc-list">${items}</ul><p class="meta">文档从本地文件实时读取；截图和结果可通过文档内链接打开。</p>`))
    }
    const raw = route.startsWith('/source/')
    const contentRoute = raw ? route.slice('/source'.length) : route
    const file = allowedFile(contentRoute)
    const ext = path.extname(file).toLowerCase()
    if (ext === '.md') {
      const source = fs.readFileSync(file, 'utf8')
      if (raw) return send(response, 200, 'text/plain; charset=utf-8', source)
      const title = (source.match(/^#\s+(.+)$/m) || [null, path.basename(file)])[1]
      return send(response, 200, 'text/html; charset=utf-8', page(title, markdown(source, contentRoute), '/source' + fileUrl(path.relative(root, file))))
    }
    if (ext === '.json' || ext === '.txt') {
      let text = fs.readFileSync(file, 'utf8')
      if (ext === '.json') { try { text = JSON.stringify(JSON.parse(text), null, 2) } catch (_) {} }
      return send(response, 200, 'text/html; charset=utf-8', page(path.basename(file), '<h1>' + escape(path.basename(file)) + '</h1><pre><code>' + escape(text) + '</code></pre>'))
    }
    const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
    if (types[ext]) return send(response, 200, types[ext], fs.readFileSync(file))
    return send(response, 403, 'text/plain; charset=utf-8', 'This file type is not available in the document preview.')
  } catch (error) { send(response, error.status || (error.code === 'ENOENT' ? 404 : 400), 'text/plain; charset=utf-8', 'Unable to open this document.') }
})
if (require.main === module) {
  server.listen(port, '127.0.0.1', () => console.log(`SunnyFit review viewer: http://127.0.0.1:${port}/latest`))
  server.on('error', error => { console.error(error.message); process.exitCode = 1 })
}
module.exports = { server, markdown, linkUrl }
