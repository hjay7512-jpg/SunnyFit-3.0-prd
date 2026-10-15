let runtimePromise
function script(url) {
  return new Promise((resolve, reject) => {
    const element = document.createElement('script')
    element.src = url
    element.onload = resolve
    element.onerror = () => { element.remove(); reject(new Error('Unable to load the review runtime. Reload and retry.')) }
    document.head.appendChild(element)
  })
}
export function runtime() {
  if (!runtimePromise) {
    const base = process.env.BASE_URL
    runtimePromise = script(base + 'demo-runtime/sql-wasm.js')
      .then(() => script(base + 'demo-runtime/engine.js'))
      .then(() => window.SunnyFitPagesRuntime.ready)
      .then(() => window.SunnyFitPagesRuntime)
      .catch(error => { runtimePromise = null; throw error })
  }
  return runtimePromise
}
export default async function adapter(config) {
  if (config.cancelToken) config.cancelToken.throwIfRequested()
  const url = new URL((config.baseURL || '/api').replace(/\/$/, '') + '/' + config.url.replace(/^\//, ''), location.origin)
  for (const [key, value] of Object.entries(config.params || {})) if (value !== undefined && value !== null) url.searchParams.set(key, value)
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  const engine = await runtime()
  const result = await engine.request({ url: url.href, method: config.method || 'get', body })
  const response = { ...result, config, headers: { 'content-type': 'application/json' }, statusText: String(result.status) }
  if (config.cancelToken) config.cancelToken.throwIfRequested()
  if (config.validateStatus && !config.validateStatus(result.status)) {
    const error = new Error(result.data.message)
    error.config = config
    error.response = response
    error.isAxiosError = true
    throw error
  }
  return response
}
