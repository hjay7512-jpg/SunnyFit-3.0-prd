const test = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { createStore: createModelStore } = require('../server/store.cjs')
const createStore=(filename,clock)=>createModelStore(filename,clock,{legacyFixtures:true})
const fixture = t => { let date = '2026-10-12T00:00:00.000Z'; const store = createStore(':memory:', () => date); t.after(() => store.close()); return { store, c: store.commerce, advance: value => { date = value } } }
const quote = (c, userId, serviceId = 'deep_analysis') => c.quoteService({ userId, serviceId, objectKey: 'workout-01' }).quote
const start = (c, userId, q, acceptOverage = false, requestKey = randomUUID()) => c.startService({ userId, quoteId: q.id, message: 'Review my workout', acceptOverage, requestKey })
const rejects = (work, reason) => assert.throws(work, error => error.reason === reason)

test('included actions reserve and release their own quota, never Credits; completed reads are free', t => {
  const { c } = fixture(t), user = 'DEMO-1004', before = c.userDetail(user).wallet.available
  const q = quote(c, user); assert.equal(q.billingSource, 'included'); assert.equal(q.credits, 0)
  const a = start(c, user, q); assert.equal(c.userDetail(user).wallet.includedUsage.find(r => r.serviceId === 'deep_analysis').reserved, 1)
  c.finishService(a.id, 'failed'); assert.equal(c.userDetail(user).wallet.includedUsage.find(r => r.serviceId === 'deep_analysis').remaining, 2)
  const b = start(c, user, quote(c, user)); c.finishService(b.id, 'succeeded'); c.finishService(b.id, 'succeeded')
  assert.equal(c.userDetail(user).wallet.includedUsage.find(r => r.serviceId === 'deep_analysis').used, 1)
  assert.equal(c.userDetail(user).wallet.available, before)
  assert.equal(c.getAsset(user, c.userDetail(user).assets.find(a => a.reference === b.id).id).type, 'report')
})
test('the last included slot cannot silently become paid; extra spending requires consent', t => {
  const { c } = fixture(t), user = 'DEMO-1003'
  c.finishService(start(c, user, quote(c, user)).id, 'succeeded')
  const first = quote(c, user), stale = quote(c, user)
  c.finishService(start(c, user, first).id, 'succeeded')
  rejects(() => start(c, user, stale), 'QUOTE_STALE')
  const paid = quote(c, user); assert.equal(paid.billingSource, 'credits')
  rejects(() => start(c, user, paid), 'OVERAGE_CONFIRMATION_REQUIRED')
  const key = randomUUID(), before = c.userDetail(user).wallet.available, a = start(c, user, paid, true, key)
  assert.equal(start(c, user, paid, true, key).id, a.id)
  rejects(() => start(c, user, paid, false, key), 'REQUEST_KEY_REUSED')
  c.finishService(a.id, 'succeeded'); c.finishService(a.id, 'succeeded')
  assert.equal(c.userDetail(user).wallet.available, before - paid.credits)
})
test('weekly included reports do not spend wallet balance and wait for the next weekly period', t => {
  const { c, advance } = fixture(t), user = 'DEMO-1003', before = c.userDetail(user).wallet.available
  const a = start(c, user, quote(c, user, 'weekly_insight')); c.finishService(a.id, 'succeeded')
  assert.equal(c.access({ userId: user, serviceId: 'weekly_insight' }).reason, 'INCLUDED_USAGE_EXHAUSTED')
  assert.equal(c.userDetail(user).wallet.available, before)
  advance('2026-10-18T00:00:00.000Z'); assert.equal(quote(c, user, 'weekly_insight').billingSource, 'included')
})
test('release after a period boundary does not release the new period quota', t => {
  const { c, advance } = fixture(t), user = 'DEMO-1003'
  advance('2026-10-17T23:55:00.000Z')
  const a = start(c, user, quote(c, user, 'weekly_insight'))
  advance('2026-10-18T00:00:00.000Z')
  const b = start(c, user, quote(c, user, 'weekly_insight'))
  c.finishService(a.id, 'failed')
  assert.equal(c.userDetail(user).wallet.includedUsage.find(r => r.serviceId === 'weekly_insight').reserved, 1)
  c.finishService(b.id, 'succeeded')
})
test('published included service changes preserve old grants and new purchases use new snapshots', t => {
  const { store, c } = fixture(t), config = structuredClone(store.detail('premium').published)
  config.includedServices.find(r => r.serviceId === 'deep_analysis').amount = 7
  const draft = store.save('premium', config, store.detail('premium').revision); store.publish('premium', draft.revision)
  assert.equal(c.userDetail('DEMO-1003').wallet.includedUsage.find(r => r.serviceId === 'deep_analysis').amount, 2)
  const q = c.quotePurchase({ userId: 'DEMO-1001', productId: 'premium_monthly', skuId: 'premium_monthly_web' })
  c.purchase({ userId: 'DEMO-1001', quoteId: q.id, requestKey: randomUUID() })
  assert.equal(c.userDetail('DEMO-1001').wallet.includedUsage.find(r => r.serviceId === 'deep_analysis').amount, 7)
})
test('new purchased balance does not expire and old paid order snapshots keep their validity', t => {
  const { c, advance } = fixture(t)
  const q = c.quotePurchase({ userId: 'DEMO-1001', productId: 'credits_starter', skuId: 'credits_starter_web' })
  const order = c.purchase({ userId: 'DEMO-1001', quoteId: q.id, requestKey: randomUUID() }); assert.equal(order.batch.expiresAt, null)
  rejects(()=>c.expireDemo({userId:'DEMO-1001',batchId:order.batch.id}),'NON_EXPIRING_BATCH')
  advance('2035-10-12T00:00:00.000Z'); assert.equal(c.userDetail('DEMO-1001').wallet.available, 40)
  const row = c.configDetail('products', 'credits_starter'), legacy = structuredClone(row.published); legacy.credits.validityDays = 30
  const draft = c.configSave('products', row.id, legacy, row.revision); c.configPublish('products', row.id, draft.revision)
  const old = c.quotePurchase({ userId: 'DEMO-1002', productId: row.id, skuId: 'credits_starter_web' })
  const pending = c.purchase({ userId: 'DEMO-1002', quoteId: old.id, outcome: 'fulfillment_failed', requestKey: randomUUID() })
  const changed = c.configDetail('products', row.id), next = structuredClone(changed.published); next.credits.validityDays = null
  const saved = c.configSave('products', row.id, next, changed.revision); c.configPublish('products', row.id, saved.revision)
  assert.notEqual(c.retryFulfillment(pending.id).batch.expiresAt, null)
})
test('a Program authorizes its included workout only through verified parent context', t => {
  const { c } = fixture(t), userId = 'DEMO-1001'
  assert.equal(c.access({ userId, contentId: 'course_premium', programId: 'program_starter' }).allowed, true)
  assert.equal(c.access({ userId, contentId: 'course_premium' }).allowed, false)
  assert.equal(c.access({ userId, contentId: 'course_featured', programId: 'program_starter' }).allowed, false)
})
test('scheduled plan changes retain one subscription; cancel removes pending and restore adds nothing', t => {
  const { c } = fixture(t), userId = 'DEMO-1003'
  const before = c.userDetail(userId), subscription = before.subscriptions[0]
  const q = c.quotePurchase({ userId, productId: 'premium_annual', skuId: 'premium_annual_web' })
  assert.equal(q.action, 'change_plan'); const order = c.purchase({ userId, quoteId: q.id, requestKey: randomUUID() }); assert.equal(order.status, 'scheduled')
  assert.equal(c.userDetail(userId).grants.length, before.grants.length)
  c.setRenewal(subscription.id, false, 'Cancel in demo'); assert.equal(c.userDetail(userId).subscriptions[0].pendingChange, null)
  const current = c.userDetail(userId); c.restorePurchases({ userId }); c.restorePurchases({ userId })
  assert.equal(c.userDetail(userId).grants.length, current.grants.length); assert.equal(c.userDetail(userId).wallet.available, current.wallet.available)
})
test('renewal event applies a pending plan once and keeps the subscription identity', t => {
  const { c, advance } = fixture(t), userId = 'DEMO-1003', subscription = c.userDetail(userId).subscriptions[0]
  const q = c.quotePurchase({ userId, productId: 'premium_annual', skuId: 'premium_annual_web' }); c.purchase({ userId, quoteId: q.id, requestKey: randomUUID() })
  advance(subscription.grant.expiresAt)
  const input = { periodEnd: subscription.grant.expiresAt, requestKey: randomUUID() }, result = c.renewDemo(subscription.id, input)
  assert.equal(c.renewDemo(subscription.id, input).id, result.id)
  const renewed = c.userDetail(userId); assert.equal(renewed.subscriptions.length, 1); assert.equal(renewed.subscriptions[0].id, subscription.id); assert.equal(renewed.subscriptions[0].productId, 'premium_annual')
  assert.equal(renewed.subscriptions[0].pendingChange, null)
})
test('failed renewal preserves assets and cannot later overlap a new paid subscription', t => {
  const {c,advance}=fixture(t),userId='DEMO-1003',sub=c.userDetail(userId).subscriptions[0]
  advance(sub.grant.expiresAt)
  c.renewDemo(sub.id,{periodEnd:sub.grant.expiresAt,outcome:'failed',requestKey:randomUUID()})
  assert.equal(c.userDetail(userId).subscriptions[0].status,'renewal_failed')
  const q=c.quotePurchase({userId,productId:'premium_monthly',skuId:'premium_monthly_web'})
  c.purchase({userId,quoteId:q.id,requestKey:randomUUID()})
  rejects(()=>c.renewDemo(sub.id,{periodEnd:sub.grant.expiresAt,requestKey:randomUUID()}),'RENEWAL_CONFLICT')
})
