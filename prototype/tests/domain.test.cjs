const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { createStore: createModelStore } = require('../server/store.cjs')
const createStore=(filename,clock)=>createModelStore(filename,clock,{legacyFixtures:true})
const clone = value => JSON.parse(JSON.stringify(value))
const fixture = () => createStore(':memory:', () => '2026-10-09T00:00:00.000Z')
const newConfig = store => ({ ...clone(store.detail('device').published), name: 'Trial Benefits', code: 'trial_benefits' })
const rejects = (action, reason) => assert.throws(action, error => error.reason === reason)

test('catalog contains the supported items and separates Credits from turn quotas', t => {
  const store = fixture(); t.after(() => store.close())
  assert.equal(store.catalog().length, 10)
  assert.equal(store.catalogItem('weekly_report_ai_insight').type, 'feature_access')
  assert.equal(store.catalogItem('weekly_report_ai_insight').quotaDefinition, undefined)
  rejects(() => store.catalogItem('ai_coach_chat'), 'NOT_FOUND')
  rejects(() => store.catalogItem('invented_capability'), 'NOT_FOUND')
})
test('new suits are drafts until explicitly published; code is unique and immutable', t => {
  const store = fixture(); t.after(() => store.close())
  const created = store.create(newConfig(store))
  assert.equal(created.published, null)
  assert.equal(created.status, 'draft')
  rejects(() => store.create(newConfig(store)), 'CODE_EXISTS')
  const changed = { ...created.draft, code: 'other_code' }
  rejects(() => store.save(created.id, changed, created.revision), 'INVALID_CONFIG')
  assert.equal(store.publish(created.id, created.revision).publishedVersion, 1)
})
test('ALL mixed with specific scopes is rejected by the API', t => {
  const store = fixture(); t.after(() => store.close())
  const config = clone(store.detail('free').published)
  config.items.find(item => item.code === 'ai_coach_chat').scopes = ['all','text']
  rejects(() => store.save('free', config, 1), 'INVALID_CONFIG')
  assert.equal(store.detail('free').revision, 1)
})
test('empty or unsupported scope and duplicate item configurations are rejected', t => {
  const store = fixture(); t.after(() => store.close())
  for (const scopes of [[],['invented'],['all','all']]) {
    const config = newConfig(store); config.items[0].scopes = scopes
    rejects(() => store.create(config), 'INVALID_CONFIG')
  }
  const duplicate = newConfig(store); duplicate.items.push(clone(duplicate.items[0]))
  rejects(() => store.create(duplicate), 'INVALID_CONFIG')
})
test('per-feature quota cannot be used as a Credits wallet', t => {
  const store = fixture(); t.after(() => store.close())
  const config = newConfig(store)
  config.items[0].quota = { type: 'credits', amount: 100 }
  rejects(() => store.create(config), 'INVALID_CONFIG')
})
test('system Free suit cannot be disabled or deleted, but valid configuration changes are allowed', t => {
  const store = fixture(); t.after(() => store.close())
  const config = clone(store.detail('free').published)
  rejects(() => store.save('free', { ...config, status: 'disabled' }, 1), 'INVALID_CONFIG')
  rejects(() => store.remove('free', 1), 'SUIT_IN_USE')
  config.description = 'Updated free access description.'
  assert.ok(store.save('free', config, 1).draft)
})
test('saving a draft does not change the published configuration or any granted snapshot', t => {
  const store = fixture(); t.after(() => store.close())
  const config = clone(store.detail('premium').published)
  config.creditBenefit.amount = 240
  const saved = store.save('premium', config, 1)
  assert.equal(saved.draft.creditBenefit.amount, 240)
  assert.equal(saved.published.creditBenefit.amount, 150)
  assert.equal(store.grantSnapshot('grant_premium_1').config.creditBenefit.amount, 150)
})
test('publishing creates a new immutable version and leaves existing grants on v1', t => {
  const store = fixture(); t.after(() => store.close())
  const original = clone(store.grantSnapshot('grant_premium_1'))
  const config = clone(store.detail('premium').published)
  config.creditBenefit.amount = 240
  config.items = config.items.filter(item => item.code !== 'dynamic_plan')
  const saved = store.save('premium', config, 1)
  const live = store.publish('premium', saved.revision)
  assert.equal(live.publishedVersion, 2)
  assert.equal(live.published.creditBenefit.amount, 240)
  assert.deepEqual(store.grantSnapshot('grant_premium_1'), original)
  assert.equal(store.history('premium').find(entry => entry.version === 1).config.creditBenefit.amount, 150)
  assert.deepEqual(store.impact('premium').existingGrants.map(entry => entry.version), [1,1])
})
test('optimistic revision checks prevent stale writes and repeated publishing', t => {
  const store = fixture(); t.after(() => store.close())
  const config = clone(store.detail('premium').published)
  config.description = 'New version.'
  const saved = store.save('premium', config, 1)
  rejects(() => store.save('premium', config, 1), 'CONFIG_CHANGED')
  store.publish('premium', saved.revision)
  rejects(() => store.publish('premium', saved.revision), 'CONFIG_CHANGED')
  assert.equal(store.history('premium').length, 2)
})
test('preview validates changes without saving them; discarding a saved draft keeps publication', t => {
  const store = fixture(); t.after(() => store.close())
  const config = clone(store.detail('premium').published)
  config.creditBenefit.validityDays = 60
  const preview = store.preview('premium', config)
  assert.equal(preview.changes[0].field, 'creditBenefit')
  assert.equal(store.detail('premium').draft, null)
  const saved = store.save('premium', config, 1)
  const discarded = store.discard('premium', saved.revision)
  assert.equal(discarded.draft, null)
  assert.equal(discarded.published.creditBenefit.validityDays, 30)
})
test('only unreferenced suits can be deleted, including draft-only suits', t => {
  const store = fixture(); t.after(() => store.close())
  rejects(() => store.remove('premium', 1), 'SUIT_IN_USE')
  rejects(() => store.remove('device', 1), 'SUIT_IN_USE')
  const created = store.create(newConfig(store))
  store.remove(created.id, created.revision)
  rejects(() => store.detail(created.id), 'NOT_FOUND')
})
test('Credits benefits reject invalid amount, validity and issuance cadence', t => {
  const store = fixture(); t.after(() => store.close())
  for (const benefit of [{ amount:-1,validityDays:30,cadence:'monthly' },{ amount:1.5,validityDays:30,cadence:'monthly' },{ amount:10,validityDays:0,cadence:'monthly' },{ amount:10,validityDays:30,cadence:'invented' }]) {
    const config = newConfig(store); config.creditBenefit = benefit
    rejects(() => store.create(config), 'INVALID_CONFIG')
  }
})
test('published versions and drafts survive a database restart', t => {
  const filename = path.join(os.tmpdir(), `sunnyfit-admin-test-${randomUUID()}.sqlite`)
  let store = createStore(filename, () => '2026-10-09T00:00:00.000Z')
  t.after(() => { store.close(); for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(filename + suffix)) fs.unlinkSync(filename + suffix) })
  const created = store.create(newConfig(store))
  store.publish(created.id, created.revision)
  store.close()
  store = createStore(filename, () => '2026-10-09T00:00:00.000Z')
  assert.equal(store.detail(created.id).publishedVersion, 1)
  assert.equal(store.list().length, 4)
})
