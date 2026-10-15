const { DomainError } = require('./store.cjs')
const apiPrefix = '/api/commercialization'

// Shared by the Node HTTP service and the isolated GitHub Pages runtime.
function dispatch(store, method, route, body = {}, params = {}) {
  const request = { method }
  const url = { searchParams: new URLSearchParams(params) }
  let data
  if (request.method === 'GET' && route === `${apiPrefix}/catalog`) data = store.catalog()
  else if (request.method === 'GET' && route.startsWith(`${apiPrefix}/catalog/`)) data = store.catalogItem(decodeURIComponent(route.slice(`${apiPrefix}/catalog/`.length)))
  else if (request.method === 'GET' && route === `${apiPrefix}/suits`) data = store.list(Object.fromEntries(url.searchParams))
  else if (request.method === 'POST' && route === `${apiPrefix}/suits`) data = store.create(body)
  else if (route.startsWith(`${apiPrefix}/suits/`)) {
    const match = route.match(/^\/api\/commercialization\/suits\/([^/]+)(?:\/(impact|history|preview|publish|discard))?$/)
    if (!match) throw new DomainError(404, 'NOT_FOUND', 'API endpoint was not found.')
    const id = decodeURIComponent(match[1])
    const action = match[2]
    if (request.method === 'GET' && !action) data = store.detail(id)
    else if (request.method === 'GET' && action === 'impact') data = store.impact(id)
    else if (request.method === 'GET' && action === 'history') data = store.history(id)
    else if (request.method === 'PUT' && !action) data = store.save(id, body.config, body.revision)
    else if (request.method === 'POST' && action === 'preview') data = store.preview(id, body.config)
    else if (request.method === 'POST' && action === 'publish') data = store.publish(id, body.revision)
    else if (request.method === 'POST' && action === 'discard') data = store.discard(id, body.revision)
    else if (request.method === 'DELETE' && !action) data = store.remove(id, body.revision)
    else throw new DomainError(405, 'METHOD_NOT_ALLOWED', 'This operation is not supported.')
  } else {
    const path = route.slice(apiPrefix.length)
    const query = Object.fromEntries(url.searchParams)
    const method = request.method
    const commerce = store.commerce
    const config = path.match(/^\/(products|content|pricing|campaigns)(?:\/([^/]+)(?:\/(history|preview|publish|discard))?)?$/)
    if (path==='/credit-types' && method==='GET') data=store.entitlementModel.creditTypes()
    else if (path==='/content-scopes' && method==='GET') data=store.entitlementModel.scopes(query.entitlementCode)
    else if (path==='/content-scopes' && method==='POST') data=store.entitlementModel.saveScope(body)
    else if (path==='/content-scopes' && method==='PUT') data=store.entitlementModel.saveScope(body.config,body.revision)
    else if (config) {
      const [, entity, id, action] = config
      if (!id && method === 'GET') data = commerce.configList(entity, query)
      else if (!id && method === 'POST') data = commerce.configCreate(entity, body)
      else if (id && !action && method === 'GET') data = commerce.configDetail(entity, id)
      else if (id && !action && method === 'PUT') data = commerce.configSave(entity, id, body.config, body.revision)
      else if (id && !action && method === 'DELETE') data = commerce.configDelete(entity, id, body.revision)
      else if (action === 'history' && method === 'GET') data = commerce.configHistory(entity, id)
      else if (action === 'preview' && method === 'POST') data = commerce.configPreview(entity, id, body.config)
      else if (action === 'publish' && method === 'POST') data = commerce.configPublish(entity, id, body.revision)
      else if (action === 'discard' && method === 'POST') data = commerce.configDiscard(entity, id, body.revision)
      else throw new DomainError(405, 'METHOD_NOT_ALLOWED', 'Unsupported configuration action.')
    } else if (method === 'POST' && path === '/content-bulk') data = commerce.bulkContent(body)
    else if (method === 'GET' && path === '/overview') data = commerce.overview()
    else if (method === 'GET' && path === '/users') data = commerce.users(query)
    else if (method === 'GET' && /^\/users\/[^/]+$/.test(path)) data = commerce.userDetail(path.split('/')[2])
    else if (method === 'GET' && path === '/ledger') data = commerce.ledger(query)
    else if (method === 'GET' && path === '/orders') data = commerce.orders(query)
    else if (method === 'GET' && /^\/orders\/[^/]+$/.test(path)) data = commerce.order(path.split('/')[2])
    else if (method === 'GET' && path === '/subscriptions') data = commerce.subscriptions(query)
    else if (method === 'GET' && path === '/redemptions') data = commerce.redemptions(query)
    else if (method === 'GET' && path === '/usage') data = commerce.usage(query)
    else if (method === 'GET' && path === '/campaign-runs') data = commerce.campaignRuns(query)
    else if (method === 'GET' && path === '/audit') data = commerce.audit(query)
    else if (method === 'GET' && /^\/storefront\/[^/]+$/.test(path)) data = commerce.storefront(path.split('/')[2])
    else if (method === 'GET' && /^\/weekly-report\/[^/]+$/.test(path)) data = commerce.weeklyReport(path.split('/')[2])
    else if (method === 'POST' && path === '/weekly-report/read') data = commerce.readWeeklyReport(body)
    else if (method === 'POST' && path === '/challenge-join') data = commerce.joinChallenge(body)
    else if (method === 'GET' && /^\/users\/[^/]+\/assets\/[^/]+$/.test(path)) data = commerce.getAsset(path.split('/')[2], path.split('/')[4])
    else if (method === 'POST' && path === '/access') data = commerce.access(body)
    else if (method === 'POST' && path === '/purchase-quote') data = commerce.quotePurchase(body)
    else if (method === 'POST' && path === '/purchase') data = commerce.purchase(body)
    else if (method === 'POST' && /^\/orders\/[^/]+\/retry$/.test(path)) data = commerce.retryFulfillment(path.split('/')[2])
    else if (method === 'POST' && /^\/subscriptions\/[^/]+\/renewal$/.test(path)) data = commerce.setRenewal(path.split('/')[2], body.enabled, body.reason)
    else if (method === 'POST' && /^\/subscriptions\/[^/]+\/demo-renew$/.test(path)) data = commerce.renewDemo(path.split('/')[2], body)
    else if (method === 'POST' && path === '/restore-purchases') data = commerce.restorePurchases(body)
    else if (method === 'POST' && path === '/service-quote') data = commerce.quoteService(body)
    else if (method === 'POST' && path === '/service-start') data = commerce.startService(body)
    else if (method === 'POST' && /^\/usage\/[^/]+\/finish$/.test(path)) data = commerce.finishService(path.split('/')[2], body.outcome)
    else if (method === 'POST' && path === '/redemption-quote') data = commerce.quoteRedemption(body)
    else if (method === 'POST' && path === '/redeem') data = commerce.redeem(body)
    else if (method === 'POST' && path === '/compensate') data = commerce.issueCredits(body)
    else if (method === 'POST' && path === '/campaign-run') data = commerce.runCampaign(body)
    else if (method === 'POST' && path === '/demo-expire') data = commerce.expireDemo(body)
    else throw new DomainError(404, 'NOT_FOUND', 'API endpoint was not found.')
  }
  return data
}
module.exports = { dispatch }
