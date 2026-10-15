const sqlite = require('./sqlite.cjs')
const { createStore, DomainError } = require('../../server/store.cjs')
const { ensureMvpDemo } = require('../../server/mvp-demo.cjs')
const { dispatch } = require('../../server/dispatch.cjs')
const namespace = 'sunnyfit-review-v1:' + location.pathname.replace(/index\.html$/, '')
const filename = namespace + ':sqlite'
let storage, store, revision = null
let sequence = Promise.resolve()

function storageOperation(mode, work) {
  return new Promise((resolve, reject) => {
    const transaction = storage.transaction('snapshots', mode)
    const request = work(transaction.objectStore('snapshots'))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error || request.error)
    transaction.onabort = () => reject(transaction.error || new Error('Review storage transaction aborted.'))
  })
}
async function initialize() {
  const sql = await globalThis.initSqlJs({ locateFile: name => new URL(name, new URL('demo-runtime/', document.baseURI)).href })
  sqlite.initialize(sql)
  storage = await new Promise((resolve, reject) => {
    const request = indexedDB.open(namespace, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('snapshots')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
const ready = initialize()
async function refresh() {
  const record = await storageOperation('readonly', objectStore => objectStore.get('current'))
  if (store && revision === (record && record.revision)) return
  if (store) store.close()
  sqlite.restore(filename, record && record.bytes)
  store = createStore(filename)
  ensureMvpDemo(store, filename)
  revision = record && record.revision
}
async function persist() {
  const next = { revision: crypto.randomUUID(), bytes: sqlite.snapshot(filename) }
  await storageOperation('readwrite', objectStore => objectStore.put(next, 'current'))
  revision = next.revision
}
async function locked(work) {
  await ready
  if (!navigator.locks) throw new Error('This review requires a current browser with Web Locks support.')
  return navigator.locks.request(namespace, work)
}
function request(input) {
  const operation = sequence.then(() => locked(async () => {
    await refresh()
    try {
      const url = new URL(input.url, location.origin)
      const data = dispatch(store, input.method.toUpperCase(), url.pathname, input.body || {}, Object.fromEntries(url.searchParams))
      await persist()
      return { status: 200, data: { code: 20000, data } }
    } catch (error) {
      // GET maintenance and a failed delivery can also commit useful state.
      await persist()
      const known = error instanceof DomainError
      if (!known) console.error(error)
      const status = known ? error.status : 500
      return { status, data: { code: status * 100, reason: known ? error.reason : 'BROWSER_RUNTIME_ERROR', message: error.message, fields: error.fields || [] } }
    }
  }))
  sequence = operation.catch(() => {})
  return operation
}
function reset() {
  const operation = sequence.then(() => locked(async () => {
    await storageOperation('readwrite', objectStore => objectStore.delete('current'))
    if (store) store.close()
    store = null
    revision = null
  }))
  sequence = operation.catch(() => {})
  return operation
}
globalThis.SunnyFitPagesRuntime = { request, reset, ready }
