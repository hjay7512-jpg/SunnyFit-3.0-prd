const { DatabaseSync } = require('node:sqlite')
const { randomUUID } = require('node:crypto')
const catalog = require('./catalog.cjs')
const { createCommerce, addMonths } = require('./commerce.cjs')
const { createEntitlementModel } = require('./entitlement-model.cjs')

class DomainError extends Error {
  constructor(status, reason, message, fields) { super(message); this.status = status; this.reason = reason; this.fields = fields }
}
const fail = (status, reason, message, fields) => { throw new DomainError(status, reason, message, fields) }
const parse = value => JSON.parse(value)
const emptyBenefit = () => ({ amount: 0, validityDays: 30, cadence: 'billing_cycle' })
const cloneServices = rules => rules.map(({ serviceId, amount, period, allowOverage }) => ({ serviceId, amount, period, allowOverage }))
const { POLICY_VERSION } = require('./entitlement-model.cjs')

function createStore(filename, clock = () => new Date().toISOString(), options = {}) {
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS catalog(code TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS suits(id TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL,type TEXT NOT NULL,system_default INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL,draft TEXT,published_version INTEGER,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS suit_versions(suit_id TEXT NOT NULL REFERENCES suits(id) ON DELETE CASCADE,version INTEGER NOT NULL,payload TEXT NOT NULL,published_at TEXT NOT NULL,PRIMARY KEY(suit_id,version));
    CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT NOT NULL,suit_id TEXT NOT NULL REFERENCES suits(id));
    CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,user_name TEXT NOT NULL,suit_id TEXT NOT NULL,version INTEGER NOT NULL,source TEXT NOT NULL,starts_at TEXT NOT NULL,expires_at TEXT,FOREIGN KEY(suit_id,version) REFERENCES suit_versions(suit_id,version));
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,action TEXT NOT NULL,target_id TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
  `)
  const now = () => clock()
  const row = id => db.prepare('SELECT * FROM suits WHERE id=?').get(id) || fail(404, 'NOT_FOUND', 'Entitlement suit was not found.')
  const published = suit => suit.published_version ? parse(db.prepare('SELECT payload FROM suit_versions WHERE suit_id=? AND version=?').get(suit.id, suit.published_version).payload) : null
  const activeGrants = id => db.prepare('SELECT * FROM grants WHERE suit_id=? AND starts_at<=? AND (expires_at IS NULL OR expires_at>?) ORDER BY user_id').all(id, now(), now())
  const productRefs = id => db.prepare('SELECT id,name FROM products WHERE suit_id=? ORDER BY name').all(id)
  const audit = (action, id, payload) => db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomUUID(), action, id, JSON.stringify(payload), now())
  function transaction(work) {
    db.exec('BEGIN IMMEDIATE')
    try { const result = work(); db.exec('COMMIT'); return result } catch (error) { db.exec('ROLLBACK'); throw error }
  }
  function checkRevision(suit, expected) {
    if (!Number.isInteger(expected) || expected !== suit.revision) fail(409, 'CONFIG_CHANGED', 'This suit changed in another session. Reload before saving or publishing.')
  }
  const entitlementModel = createEntitlementModel({ db, now, fail, transaction, audit })
  let seeding = true
  function validate(input, original) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'INVALID_CONFIG', 'A valid suit configuration is required.')
    if (!seeding && !options.legacyFixtures && input.modelVersion!==2) fail(400,'LEGACY_MODEL_READ_ONLY','New configurations must use the typed entitlement model. Historical snapshots remain readable.')
    const fields = []
    const policyVersion=input.modelVersion===2?(input.policyVersion||POLICY_VERSION):null
    if(!seeding&&!options.legacyFixtures&&input.modelVersion===2&&policyVersion!==POLICY_VERSION)fields.push('New drafts must use the current MVP policy. Historical published versions remain unchanged.')
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const code = typeof input.code === 'string' ? input.code.trim() : ''
    if (!name || name.length > 80) fields.push('Name must contain 1–80 characters.')
    if (!/^[a-z][a-z0-9_]{2,63}$/.test(code)) fields.push('Code must use 3–64 lowercase letters, numbers or underscores, starting with a letter.')
    if (!['base', 'additional'].includes(input.type)) fields.push('Type must be Base or Additional.')
    if (!['active', 'disabled'].includes(input.status)) fields.push('Status must be Active or Disabled.')
    if (original && (code !== original.code || input.type !== original.type)) fields.push('Code and type cannot be changed after creation.')
    if (original && original.system_default && input.status !== 'active') fields.push('The system Free suit must stay Active.')
    if (typeof input.description !== 'string' || input.description.length > 1000) fields.push('Description must be text with at most 1,000 characters.')
    if (!Array.isArray(input.items) || (input.items.length < 1 && !(input.modelVersion===2 && input.creditGrants && input.creditGrants.length))) fields.push('Add at least one entitlement item or credit grant.')
    const seen = new Set()
    const items = []
    for (const spec of Array.isArray(input.items) ? input.items : []) {
      if (!spec || typeof spec !== 'object') { fields.push('Each entitlement item must be a valid specification.'); continue }
      const definition = (input.modelVersion===2?entitlementModel.catalog():catalog).find(entry => entry.code === spec.code)
      if (!definition) { fields.push('An item is not supported by the catalog.'); continue }
      if (seen.has(spec.code)) fields.push(`${definition.name} can only be added once.`)
      seen.add(spec.code)
      if (input.modelVersion===2) {
        if (entitlementModel.isContent(spec.code)) {
          const scopes=Array.isArray(spec.scopes)?spec.scopes:[]
          const supported=entitlementModel.scopes(spec.code,true)
          if (!scopes.length||new Set(scopes).size!==scopes.length||scopes.some(code=>!supported.some(scope=>scope.code===code))) fields.push(`${definition.name}: select unique content scopes; ALL is not supported.`)
          items.push({code:spec.code,scopes:[...scopes].sort()})
        } else {
          if(definition.type!=='feature_access'){fields.push(`${definition.name}: Consumable Credits must be configured as a credit grant.`);continue}
          if (spec.scopes!==undefined||spec.quota!==undefined) fields.push(`${definition.name}: Feature Access has no Scope or Quota.`)
          items.push({code:spec.code})
        }
        if (spec.quota!==undefined) fields.push(`${definition.name}: Quota is not part of the new access model.`)
        continue
      }
      const scopes = Array.isArray(spec.scopes) ? spec.scopes : []
      if (!scopes.length || new Set(scopes).size !== scopes.length || scopes.some(scope => !definition.scopes.some(allowed => allowed.code === scope))) fields.push(`${definition.name}: choose at least one supported, unique scope.`)
      // ALL and concrete scopes are mutually exclusive on both the UI and API.
      if (scopes.includes('all') && scopes.length > 1) fields.push(`${definition.name}: ALL cannot be combined with other scopes.`)
      if (!spec.quota || spec.quota.type !== 'unlimited' || Object.keys(spec.quota).length !== 1) fields.push(`${definition.name}: this catalog supports Unlimited only. Credits are configured separately.`)
      items.push({ code: spec.code, scopes: [...scopes].sort(), quota: { type: 'unlimited' } })
    }
    const benefit = input.modelVersion===2?emptyBenefit():input.creditBenefit
    if (!benefit || !Number.isSafeInteger(benefit.amount) || benefit.amount < 0 || benefit.amount > 1000000) fields.push('Credits benefit must be an integer between 0 and 1,000,000.')
    if (!benefit || !Number.isSafeInteger(benefit.validityDays) || benefit.validityDays < 1 || benefit.validityDays > 3650) fields.push('Credits validity must be 1–3,650 days.')
    if (!benefit || !['billing_cycle', 'monthly', 'one_time'].includes(benefit.cadence)) fields.push('Select a supported Credits issuance cadence.')
    const creditGrants=[]
    if (input.modelVersion===2) {
      if (!Array.isArray(input.creditGrants)) fields.push('Credit grants must be a list.')
      const types=new Set()
      for (const grant of Array.isArray(input.creditGrants)?input.creditGrants:[]) {
        if(policyVersion===POLICY_VERSION&&grant&&!entitlementModel.activeCreditType(grant.creditType))fields.push('MVP grants use AI Coach Credits or Content Credits. Historical and future types cannot be added.')
        if(policyVersion===POLICY_VERSION&&input.type==='base'&&grant&&(grant.cadence!=='monthly'||grant.expiration!=='grant_period'))fields.push('Membership credits refresh monthly from the subscription start in its recorded time zone and do not roll over. Choose Monthly / Grant period end.')
        if (!grant||!entitlementModel.validCreditType(grant.creditType)||types.has(grant.creditType)||!Number.isSafeInteger(grant.amount)||grant.amount<1||grant.amount>1000000||!['monthly','billing_cycle','one_time'].includes(grant.cadence)||!['days','membership_cycle','grant_period','never'].includes(grant.expiration)||(grant.expiration==='days'&&(!Number.isSafeInteger(grant.validityDays)||grant.validityDays<1||grant.validityDays>3650))) fields.push('Each credit type needs one valid amount, grant rule and expiration rule.')
        else { types.add(grant.creditType);creditGrants.push({creditType:grant.creditType,amount:grant.amount,cadence:grant.cadence,expiration:grant.expiration,...(grant.expiration==='days'?{validityDays:grant.validityDays}:{})}) }
      }
    }
    if (fields.length) fail(400, 'INVALID_CONFIG', 'Correct the configuration before saving.', fields)
    const includedServices = input.includedServices || []
    if(input.modelVersion===2&&includedServices.length) fail(400,'INVALID_CONFIG','New access Items do not configure service quotas. Historical included-service rules remain on their purchased versions.')
    const serviceIds = new Set()
    if (!Array.isArray(includedServices)) fail(400, 'INVALID_CONFIG', 'Included services must be a list.')
    for (const rule of includedServices) {
      if (!rule || !/^[a-z][a-z0-9_]{2,63}$/.test(rule.serviceId || '') || serviceIds.has(rule.serviceId) || !Number.isSafeInteger(rule.amount) || rule.amount < 1 || rule.amount > 1000000 || !['monthly','weekly'].includes(rule.period) || typeof rule.allowOverage !== 'boolean') fail(400, 'INVALID_CONFIG', 'Each included service needs a unique service ID, positive quantity, weekly/monthly period and overage policy.')
      serviceIds.add(rule.serviceId)
    }
    return { name, code, type: input.type, status: input.status, description: input.description.trim(), items: items.sort((a,b) => a.code.localeCompare(b.code)), ...(input.modelVersion===2?{modelVersion:2,policyVersion,creditGrants}:{creditBenefit:{amount:benefit.amount,validityDays:benefit.validityDays,cadence:benefit.cadence}}), includedServices: cloneServices(includedServices) }
  }
  function summary(suit) {
    const live = published(suit)
    const draft = suit.draft ? parse(suit.draft) : null
    const display = live || draft
    const products = productRefs(suit.id)
    const grants = activeGrants(suit.id)
    return { id: suit.id, code: suit.code, type: suit.type, systemDefault: !!suit.system_default, name: display.name, status: live ? live.status : 'draft', itemCount: display.items.length+(display.creditGrants||[]).length, revision: suit.revision, publishedVersion: suit.published_version, hasDraft: !!draft, updatedAt: suit.updated_at, usedBy: products.map(product => product.name), activeGrantCount: grants.length, deletable: !suit.system_default && !products.length && !db.prepare('SELECT COUNT(*) AS count FROM grants WHERE suit_id=?').get(suit.id).count && !db.prepare('SELECT COUNT(*) AS count FROM commerce_suit_refs WHERE suit_id=?').get(suit.id).count }
  }
  function detail(id) {
    const suit = row(id)
    return { ...summary(suit), published: published(suit), draft: suit.draft ? parse(suit.draft) : null }
  }
  function impact(id) {
    const suit = row(id)
    return { publishedVersion: suit.published_version, products: productRefs(id), existingGrants: activeGrants(id).map(grant => ({ id: grant.id, userId: grant.user_id, userName: grant.user_name, version: grant.version, source: grant.source, expiresAt: grant.expires_at })), policy: 'Existing purchased periods keep their granted version. Only future grants use the newly published version.' }
  }
  function diff(before, after) {
    const changes = []
    for (const key of ['name','status','description','modelVersion','policyVersion','items','creditBenefit','creditGrants','includedServices']) {
      if (JSON.stringify(before && before[key]) !== JSON.stringify(after[key])) changes.push({ field: key, before: before && before[key]!==undefined ? before[key] : null, after: after[key]===undefined?null:after[key] })
    }
    return changes
  }
  function seed() {
    if (db.prepare('SELECT COUNT(*) AS count FROM suits').get().count) return
    transaction(() => {
      for (const entry of catalog) db.prepare('INSERT INTO catalog VALUES(?,?)').run(entry.code, JSON.stringify(entry))
      const freeItems = ['course_access','world_tour_access','training_program_access'].map(code => ({ code, scopes: ['free_content'], quota: { type: 'unlimited' } }))
      freeItems.push({ code: 'ai_coach_chat', scopes: ['text'], quota: { type: 'unlimited' } })
      const seedSuits = [
        { id: 'free', name: 'Free Account', code: 'free_account', type: 'base', status: 'active', description: 'System default. Basic training and text chat access; new LLM requests consume Credits.', items: freeItems, creditBenefit: emptyBenefit(), system: true },
        { id: 'premium', name: 'Premium Membership', code: 'premium_membership', type: 'base', status: 'active', description: 'Sample included services. Purchased periods retain this snapshot.', items: catalog.map(entry => ({ code: entry.code, scopes: ['all'], quota: { type: 'unlimited' } })), creditBenefit: { amount: 150, validityDays: 30, cadence: 'billing_cycle' }, includedServices: require('../config/demo-policy.cjs').includedServices },
        { id: 'device', name: 'Device Benefits', code: 'device_benefits', type: 'additional', status: 'active', description: 'Demo device grant. Additional rights and separately expiring Credits.', items: [{ code: 'world_tour_access', scopes: ['all'], quota: { type: 'unlimited' } }], creditBenefit: { amount: 50, validityDays: 60, cadence: 'one_time' } }
      ]
      for (const suit of seedSuits) {
        const payload = validate(suit)
        db.prepare('INSERT INTO suits VALUES(?,?,?,?,?,?,?,?)').run(suit.id, suit.code, suit.type, suit.system ? 1 : 0, 1, null, 1, now())
        db.prepare('INSERT INTO suit_versions VALUES(?,?,?,?)').run(suit.id, 1, JSON.stringify(payload), now())
      }
      db.prepare('INSERT INTO products VALUES(?,?,?)').run('premium_monthly', 'Premium · Monthly', 'premium')
      db.prepare('INSERT INTO products VALUES(?,?,?)').run('premium_annual', 'Premium · Annual', 'premium')
      const starts = new Date(Date.parse(now()) - 86400000).toISOString()
      const future = addMonths(starts,1), annualEnd=addMonths(starts,12)
      const grants = [
        ['grant_free_1','DEMO-1001','Jamie Taylor','free',1,'Free Account',starts,null],
        ['grant_free_2','DEMO-1002','Morgan Reed','free',1,'Free Account',starts,null],
        ['grant_premium_1','DEMO-1003','Alex Chen','premium',1,'Premium · Monthly',starts,future],
        ['grant_premium_2','DEMO-1004','Casey Brooks','premium',1,'Premium · Annual',starts,annualEnd],
        ['grant_device_1','DEMO-1002','Morgan Reed','device',1,'Device Activation',starts,future]
      ]
      for (const grant of grants) db.prepare('INSERT INTO grants VALUES(?,?,?,?,?,?,?,?)').run(...grant)
    })
  }
  seed()
  seeding = false
  const commerce = createCommerce({ db, now, transaction, audit, fail, suitDetail: detail, catalog, entitlementModel, legacyFixtures:!!options.legacyFixtures })
  return {
    commerce,
    entitlementModel,
    catalog: entitlementModel.catalog,
    catalogItem(code) { return this.catalog().find(entry => entry.code === code) || fail(404, 'NOT_FOUND', 'Entitlement item was not found.') },
    list(query = {}) {
      let entries = db.prepare('SELECT * FROM suits ORDER BY system_default DESC,updated_at DESC,code').all().map(summary)
      if (query.search) { const term = String(query.search).toLowerCase(); entries = entries.filter(entry => `${entry.name} ${entry.code}`.toLowerCase().includes(term)) }
      if (query.type) entries = entries.filter(entry => entry.type === query.type)
      if (query.status) entries = entries.filter(entry => entry.status === query.status)
      return entries
    },
    detail, impact,
    create(input) {
      const config = validate(input)
      if (db.prepare('SELECT id FROM suits WHERE code=?').get(config.code)) fail(409, 'CODE_EXISTS', 'This suit code is already in use.')
      return transaction(() => {
        const id = randomUUID()
        db.prepare('INSERT INTO suits VALUES(?,?,?,?,?,?,?,?)').run(id, config.code, config.type, 0, 1, JSON.stringify(config), null, now())
        audit('CREATE_DRAFT', id, config)
        return detail(id)
      })
    },
    save(id, input, revision) {
      return transaction(() => {
        const suit = row(id)
        checkRevision(suit, revision)
        const config = validate(input, suit)
        db.prepare('UPDATE suits SET draft=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(config), now(), id)
        audit('SAVE_DRAFT', id, config)
        return detail(id)
      })
    },
    preview(id, input) {
      const suit = row(id)
      const config = validate(input, suit)
      return { ...impact(id), nextVersion: (suit.published_version || 0) + 1, changes: diff(published(suit), config) }
    },
    publish(id, revision) {
      return transaction(() => {
        const suit = row(id)
        checkRevision(suit, revision)
        if (!suit.draft) fail(409, 'NO_DRAFT', 'There is no saved draft to publish.')
        const config = validate(parse(suit.draft), suit)
        const version = (suit.published_version || 0) + 1
        if (!diff(published(suit), config).length) fail(409, 'NO_CHANGES', 'The draft matches the published version.')
        // Published snapshots and existing grants are never overwritten.
        db.prepare('INSERT INTO suit_versions VALUES(?,?,?,?)').run(id, version, JSON.stringify(config), now())
        db.prepare('UPDATE suits SET published_version=?,draft=NULL,revision=revision+1,updated_at=? WHERE id=?').run(version, now(), id)
        audit('PUBLISH', id, { version, config })
        return detail(id)
      })
    },
    discard(id, revision) {
      return transaction(() => {
        const suit = row(id)
        checkRevision(suit, revision)
        if (!suit.published_version) fail(409, 'UNPUBLISHED_SUIT', 'An unpublished suit must keep its draft. Delete it if it is no longer needed.')
        db.prepare('UPDATE suits SET draft=NULL,revision=revision+1,updated_at=? WHERE id=?').run(now(), id)
        audit('DISCARD_DRAFT', id, {})
        return detail(id)
      })
    },
    remove(id, revision) {
      return transaction(() => {
        const suit = row(id)
        checkRevision(suit, revision)
        if (!summary(suit).deletable) fail(409, 'SUIT_IN_USE', 'A system default or referenced suit cannot be deleted. Disable new use through a published version instead.')
        audit('DELETE', id, { code: suit.code })
        db.prepare('DELETE FROM suits WHERE id=?').run(id)
        return { id }
      })
    },
    history(id) { row(id); return db.prepare('SELECT version,payload,published_at FROM suit_versions WHERE suit_id=? ORDER BY version DESC').all(id).map(entry => ({ version: entry.version, publishedAt: entry.published_at, config: parse(entry.payload) })) },
    grantSnapshot(id) {
      const grant = db.prepare('SELECT * FROM grants WHERE id=?').get(id) || fail(404, 'NOT_FOUND', 'Grant was not found.')
      return { ...grant, config: parse(db.prepare('SELECT payload FROM suit_versions WHERE suit_id=? AND version=?').get(grant.suit_id, grant.version).payload) }
    },
    close() { db.close() }
  }
}
module.exports = { createStore, DomainError }
