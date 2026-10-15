const { randomUUID, createHash } = require('node:crypto')
const policy = require('../config/demo-policy.cjs')
const { POLICY_VERSION } = require('./entitlement-model.cjs')
const { monthBoundary, validateTimeZone } = require('./subscription-period.cjs')
const FEATURE_SERVICES={deep_analysis:'workout_result_ai_insight',weekly_insight:'weekly_report_ai_insight',plan_activate:'dynamic_plan'}
const clone = value => JSON.parse(JSON.stringify(value))
const DAY = 86400000
const NEVER = '9999-12-31T23:59:59.999Z'
const addDays = (date, days) => new Date(Date.parse(date) + days * DAY).toISOString()
const addMonths = (date, months) => {
  const original = new Date(date)
  const result = new Date(date)
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(original.getUTCDate(), last))
  return result.toISOString()
}

function createCommerce({ db, now, transaction, audit, fail, suitDetail, catalog, entitlementModel, legacyFixtures=false }) {
  let initializing=true
  db.exec(`
    CREATE TABLE IF NOT EXISTS commerce_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_configs(id TEXT PRIMARY KEY,entity TEXT NOT NULL,code TEXT NOT NULL,revision INTEGER NOT NULL,draft TEXT,published_version INTEGER,updated_at TEXT NOT NULL,UNIQUE(entity,code));
    CREATE TABLE IF NOT EXISTS commerce_versions(config_id TEXT NOT NULL REFERENCES commerce_configs(id),version INTEGER NOT NULL,payload TEXT NOT NULL,published_at TEXT NOT NULL,PRIMARY KEY(config_id,version));
    CREATE TABLE IF NOT EXISTS commerce_suit_refs(suit_id TEXT NOT NULL REFERENCES suits(id),config_id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(suit_id,config_id,version));
    CREATE TABLE IF NOT EXISTS commerce_users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,scenario TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_batches(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES commerce_users(id),source TEXT NOT NULL,source_id TEXT NOT NULL,original INTEGER NOT NULL,remaining INTEGER NOT NULL,reserved INTEGER NOT NULL DEFAULT 0,issued_at TEXT NOT NULL,expires_at TEXT NOT NULL,CHECK(remaining>=0 AND reserved>=0 AND remaining>=reserved));
    CREATE TABLE IF NOT EXISTS commerce_ledger(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,type TEXT NOT NULL,amount INTEGER NOT NULL,reference TEXT NOT NULL,reason TEXT NOT NULL,allocations TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_quotes(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_requests(key TEXT PRIMARY KEY,kind TEXT NOT NULL,hash TEXT NOT NULL,result_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,status TEXT NOT NULL,fulfillment TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_subscriptions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,product_id TEXT NOT NULL,grant_id TEXT NOT NULL REFERENCES grants(id),auto_renew INTEGER NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_schedules(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,grant_id TEXT NOT NULL REFERENCES grants(id),source TEXT NOT NULL,payload TEXT NOT NULL,due_at TEXT NOT NULL,status TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_usage(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL,allocations TEXT NOT NULL,asset_id TEXT,lease_expires_at TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_redemptions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,content_id TEXT NOT NULL,source TEXT NOT NULL,payload TEXT NOT NULL,expires_at TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_assets(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,type TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,reference TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_campaign_runs(id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL,version INTEGER NOT NULL,case_ref TEXT NOT NULL,reason TEXT NOT NULL,results TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commerce_campaign_receipts(campaign_id TEXT NOT NULL,user_id TEXT NOT NULL,case_ref TEXT NOT NULL,run_id TEXT NOT NULL,PRIMARY KEY(campaign_id,user_id,case_ref));
  `)
  if (!db.prepare('PRAGMA table_info(commerce_batches)').all().some(row => row.name === 'never_expires')) db.exec('ALTER TABLE commerce_batches ADD COLUMN never_expires INTEGER NOT NULL DEFAULT 0')
  for (const table of ['commerce_batches','commerce_ledger']) if (!db.prepare(`PRAGMA table_info(${table})`).all().some(row=>row.name==='credit_type')) db.exec(`ALTER TABLE ${table} ADD COLUMN credit_type TEXT NOT NULL DEFAULT 'LEGACY_CREDIT'`)
  db.exec('CREATE TABLE IF NOT EXISTS commerce_subscription_state(subscription_id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS commerce_allowance_buckets(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,grant_id TEXT NOT NULL,service_id TEXT NOT NULL,period_start TEXT NOT NULL,period_end TEXT NOT NULL,quota INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,CHECK(used>=0 AND reserved>=0 AND used+reserved<=quota),UNIQUE(grant_id,service_id,period_start));')
  db.exec('CREATE TABLE IF NOT EXISTS commerce_challenge_participation(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,content_id TEXT NOT NULL,payload TEXT NOT NULL,joined_at TEXT NOT NULL,UNIQUE(user_id,content_id)); CREATE TABLE IF NOT EXISTS commerce_report_state(user_id TEXT NOT NULL,report_id TEXT NOT NULL,read_at TEXT NOT NULL,PRIMARY KEY(user_id,report_id));')
  db.exec('CREATE TABLE IF NOT EXISTS commerce_workout_fixtures(user_id TEXT PRIMARY KEY,payload TEXT NOT NULL);')
  const one = (sql, ...args) => db.prepare(sql).get(...args)
  const all = (sql, ...args) => db.prepare(sql).all(...args)
  const exec = (sql, ...args) => db.prepare(sql).run(...args)
  const decode = value => JSON.parse(value)
  const getUser = id => one('SELECT * FROM commerce_users WHERE id=?', id) || fail(404, 'USER_NOT_FOUND', 'User was not found.')
  const configRow = (entity, id) => one('SELECT * FROM commerce_configs WHERE entity=? AND id=?', entity, id) || fail(404, 'NOT_FOUND', 'Configuration was not found.')
  const liveConfig = row => row.published_version ? decode(one('SELECT payload FROM commerce_versions WHERE config_id=? AND version=?', row.id, row.published_version).payload) : null
  const configDetail = (entity, id) => {
    const row = configRow(entity, id)
    const published = liveConfig(row)
    const draft = row.draft ? decode(row.draft) : null
    return { id, entity, revision: row.revision, publishedVersion: row.published_version, hasDraft: !!draft, updatedAt: row.updated_at, status: published ? published.status : 'draft', name: (published || draft).name, code: row.code, published, draft }
  }
  const publishedConfigs = entity => all('SELECT * FROM commerce_configs WHERE entity=? AND published_version IS NOT NULL ORDER BY updated_at DESC,code', entity).map(row => ({ id: row.id, version: row.published_version, ...liveConfig(row) }))
  const revisionCheck = (row, revision) => { if (!Number.isInteger(revision) || revision !== row.revision) fail(409, 'CONFIG_CHANGED', 'Configuration changed. Reload before saving or publishing.') }
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max
  const activeSuit = (id, type) => {
    const suit = suitDetail(id)
    if (!suit.published || suit.published.status !== 'active' || (type && suit.type !== type)) fail(400, 'SUIT_UNAVAILABLE', `Choose a published Active ${type || ''} suit.`)
    return suit
  }
  function validate(entity, input, original) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'INVALID_CONFIG', 'Configuration is required.')
    const fields = []
    const config = clone(input)
    delete config.id
    delete config.version
    config.name = typeof config.name === 'string' ? config.name.trim() : ''
    config.code = typeof config.code === 'string' ? config.code.trim() : ''
    config.description = typeof config.description === 'string' ? config.description.trim() : ''
    if (!config.name || config.name.length > 80) fields.push('Name: use 1–80 characters.')
    if (!/^[a-z][a-z0-9_]{2,63}$/.test(config.code)) fields.push('Code: use 3–64 lowercase letters, numbers or underscores.')
    if (original && config.code !== original.code) fields.push('Code is fixed after creation.')
    if (!['active', 'disabled'].includes(config.status)) fields.push('Choose Active or Disabled.')
    if (config.description.length > 1000) fields.push('Description: maximum 1,000 characters.')
    if (entity === 'products') {
      if (!['membership', 'credits'].includes(config.kind)) fields.push('Choose Membership or Credits.')
      if (original && original.published_version && config.kind !== liveConfig(original).kind) fields.push('Product kind is fixed after first publication.')
      if (!['next_cycle', 'not_allowed','immediate'].includes(config.upgradeRule)) fields.push('Choose a supported upgrade rule.')
      if (config.kind === 'membership') {
        if (!config.suitId) fields.push('Membership must reference a Base suit.')
        else {
          const suit = config.status === 'active' ? activeSuit(config.suitId, 'base') : suitDetail(config.suitId)
          if (suit.type !== 'base' || suit.systemDefault || !suit.published) fields.push('Paid membership must reference a published non-Free Base suit.')
        }
      }
      if (config.kind === 'credits' && (!config.credits || !integer(config.credits.amount, 1, 1000000) || (config.credits.validityDays !== null && !integer(config.credits.validityDays, 1, 3650)))) fields.push('Purchased Credits: positive quantity, with no expiry or a legacy validity period.')
      if (!initializing&&!legacyFixtures&&!original&&config.kind==='credits'&&(!config.credits||!config.credits.creditType||config.credits.creditType==='LEGACY_CREDIT')) fields.push('New credit products must select a defined credit type.')
      if (config.kind==='credits' && config.credits && config.credits.creditType && !entitlementModel.validCreditType(config.credits.creditType)) fields.push('Choose a supported credit type.')
      if(config.kind==='credits'&&config.credits&&config.credits.creditType==='HUMAN_COACH_CREDIT'&&(!original||!original.published_version))fields.push('Human Coach Credits are outside the confirmed MVP.')
      if (config.kind==='credits' && config.credits && config.credits.creditType && config.credits.creditType!=='LEGACY_CREDIT' && config.credits.validityDays!==null) fields.push('New purchased credit packs never expire.')
      if (!Array.isArray(config.skus) || !config.skus.length) fields.push('Add at least one SKU.')
      const ids = new Set(), stores = new Set()
      if (!Array.isArray(config.skus)) config.skus = []
      for (const sku of config.skus) {
        if (!sku || !/^[a-zA-Z0-9_\-]{3,80}$/.test(sku.id || '') || ids.has(sku.id)) fields.push('SKU IDs must be unique and contain 3–80 letters, numbers, underscores or hyphens.')
        else ids.add(sku.id)
        if (!sku || !['web_demo','apple','google'].includes(sku.channel) || !sku.storeCode || stores.has(`${sku.channel}:${sku.storeCode}`)) fields.push('Every SKU needs a unique channel + store code.')
        else stores.add(`${sku.channel}:${sku.storeCode}`)
        if (!sku || !integer(sku.priceCents, 1, 100000000) || !['USD','EUR','GBP','CNY'].includes(sku.currency)) fields.push('SKU price uses positive integer minor units and a supported currency.')
        if (!sku || !['active','disabled'].includes(sku.status)) fields.push('SKU status must be Active or Disabled.')
        if (config.kind === 'membership' && (!sku || !integer(sku.durationDays, 1, 3650))) fields.push('Membership SKU needs 1–3,650 duration days.')
        if (config.kind === 'membership' && sku && sku.billingPeriod && !['monthly','annual'].includes(sku.billingPeriod)) fields.push('Choose Monthly or Annual billing.')
      }
      // Store mappings are immutable after reference; disable old SKUs and add new ones.
      if (original && original.published_version) {
        const prior = liveConfig(original)
        for (const sku of prior.skus) {
          const next = (config.skus || []).find(entry => entry.id === sku.id)
          if (!next || next.channel !== sku.channel || next.storeCode !== sku.storeCode) fields.push(`Published SKU ${sku.id}: keep its mapping; disable it instead of removing it.`)
        }
      }
      if (config.kind === 'membership') config.credits = { amount: 0, validityDays: 30 }
      else { config.suitId = null; config.upgradeRule = 'not_allowed'; (config.skus || []).forEach(sku => { sku.durationDays = 0 }) }
    } else if (entity === 'pricing') {
      if(config.policyVersion===POLICY_VERSION){
        if(!['ai_chat','plan_preview',...Object.keys(FEATURE_SERVICES)].includes(config.servicePurpose))fields.push('Choose a confirmed MVP service purpose.')
        const feature=FEATURE_SERVICES[config.servicePurpose]
        if(feature){config.entitlementCode=feature;config.scope=null;config.credits=0;config.billingModel='feature';config.creditType=null;config.unit=null}
        else {config.entitlementCode=null;config.scope=null;config.billingModel='credits';config.creditType='AI_COACH_CREDIT';config.unit='user_turn';if(config.credits!==null&&!integer(config.credits,1,1000000))fields.push('Set an explicit positive demo rate per User Turn, or leave pricing undefined.')}
      }else{
      const item = catalog.find(entry => entry.code === config.entitlementCode)
      if (!item || !item.scopes.some(scope => scope.code === config.scope)) fields.push('Choose an entitlement and a supported scope.')
      if (!integer(config.credits, 0, 1000000)) fields.push('Credits price: use a non-negative integer.')
      if (config.code !== 'plan_activate' && config.credits === 0) fields.push('New LLM services need a positive Credits price.')
      if (config.code === 'plan_activate' && config.credits !== 0) fields.push('Activating a saved plan does not itself call an LLM: keep its price at 0.')
      if (config.code === 'plan_activate' && (config.entitlementCode !== 'dynamic_plan' || config.scope !== 'all')) fields.push('Saved plan activation must check Dynamic Plan / ALL access.')
      }
    } else if (entity === 'content') {
      config.recommended = !!config.recommended
      if (!['course','world_tour','training_program','movement','limited_challenge'].includes(config.contentType)) fields.push('Choose a supported MVP content type.')
      if (original && original.published_version && config.contentType !== liveConfig(original).contentType) fields.push('Content type is fixed after first publication.')
      if (!['free','premium','featured'].includes(config.tier)) fields.push('Choose Free, Premium or Featured.')
      if (!entitlementModel.isContent(config.entitlementCode)) fields.push('Choose a content access entitlement.')
      const required = { course: 'course_access', world_tour: 'world_tour_access', training_program: 'training_program_access',movement:'movement_access',limited_challenge:'challenge_access' }[config.contentType]
      if (config.entitlementCode !== required) fields.push('Content type must use its corresponding access entitlement.')
      if (!initializing&&!legacyFixtures&&config.contentScope===undefined) fields.push('Select the single content scope for this version. Legacy published mappings remain unchanged.')
      if (config.contentScope!==undefined) {
        if (typeof config.contentScope!=='string'||!entitlementModel.scopes(config.entitlementCode,true).some(scope=>scope.code===config.contentScope)) fields.push('Each content item must belong to exactly one active content scope.')
      }
      config.freeScope = config.freeScope || 'free_content'
      if (!['free_content','youtube'].includes(config.freeScope) || (config.contentType !== 'course' && config.freeScope !== 'free_content')) fields.push('YouTube scope is supported for Courses only; other content uses Free Content.')
      if (config.tier === 'featured' && !(config.policyVersion===POLICY_VERSION&&config.redemptionCredits===null) && !integer(config.redemptionCredits, 1, 1000000)) fields.push('Featured content needs an explicit positive redemption price or an undefined new-policy price.')
      if(config.policyVersion===POLICY_VERSION&&config.tier==='featured'){config.redemptionCreditType='CONTENT_CREDIT';if(config.redemptionValidityDays!==null)fields.push('New Content Unlocks are permanent. Choose no expiry.')}
      if(config.contentType==='limited_challenge'){
        if(config.tier==='featured')fields.push('Limited Challenge participation is Content Access, not a credit redemption.')
        const rules=config.challengeRules
        if(!rules||!Number.isFinite(Date.parse(rules.startsAt))||!Number.isFinite(Date.parse(rules.endsAt))||Date.parse(rules.endsAt)<=Date.parse(rules.startsAt)||typeof rules.target!=='string'||!rules.target.trim())fields.push('Challenge business rules need an opening time, closing time and target description.')
        else config.challengeRules={...rules,startsAt:new Date(rules.startsAt).toISOString(),endsAt:new Date(rules.endsAt).toISOString(),target:rules.target.trim()}
      }
      if (config.redemptionValidityDays !== null && !integer(config.redemptionValidityDays, 1, 3650)) fields.push('Redemption validity: use no expiry or 1–3,650 days.')
      if (!(config.contentType==='limited_challenge'&&config.durationMinutes===null)&&!integer(config.durationMinutes, 1, 1440)) fields.push('Duration: use 1–1,440 minutes.')
      if (!Array.isArray(config.members) || new Set(config.members).size !== config.members.length) fields.push('Included content must be a unique list.')
      if (!Array.isArray(config.members)) config.members = []
      if (config.contentType === 'training_program') {
        if (!(config.members || []).length) fields.push('A Training Program needs at least one included workout.')
        for (const id of config.members || []) {
          const member = configDetail('content', id)
          if (!member.published || !['course','world_tour','movement'].includes(member.published.contentType)) fields.push('Choose published standalone workouts; Programs and Challenges cannot be workout members.')
        }
      } else config.members = []
      if (config.tier !== 'featured') config.redemptionCredits = 0
    } else if (entity === 'campaigns') {
      if (!['campaign','compensation'].includes(config.kind)) fields.push('Choose Campaign or Compensation.')
      if (config.suitId) { const suit = config.status === 'active' ? activeSuit(config.suitId, 'additional') : suitDetail(config.suitId); if (suit.type !== 'additional' || !suit.published) fields.push('Campaigns can grant published Additional suits only.') }
      if (!integer(config.grantDurationDays, 1, 3650)) fields.push('Additional entitlement duration: use 1–3,650 days.')
      if (!integer(config.creditAmount, 0, 1000000) || !integer(config.creditValidityDays, 1, 3650)) fields.push('Credits benefit: non-negative integer amount and 1–3,650 days.')
      if (config.creditType && !entitlementModel.validCreditType(config.creditType)) fields.push('Choose a supported credit type.')
      if(config.creditType==='HUMAN_COACH_CREDIT'&&!initializing&&!legacyFixtures)fields.push('Human Coach Credits are outside the confirmed MVP.')
      if (!initializing&&!legacyFixtures&&!original&&config.creditAmount>0&&(!config.creditType||config.creditType==='LEGACY_CREDIT')) fields.push('New campaign grants must choose a defined credit type.')
      if (!config.suitId && !config.creditAmount) fields.push('Configure an Additional suit or a Credits grant.')
      if (!integer(config.maxRecipients, 1, 10000)) fields.push('Recipient limit: use 1–10,000.')
      for (const key of ['startsAt','endsAt']) { if (config[key] && Number.isNaN(Date.parse(config[key]))) fields.push('Campaign dates must be valid dates.'); else if (config[key]) config[key] = new Date(config[key]).toISOString() }
      if (config.startsAt && config.endsAt && config.startsAt >= config.endsAt) fields.push('End must be after start.')
    } else fail(404, 'NOT_FOUND', 'Unsupported configuration module.')
    if (fields.length) fail(400, 'INVALID_CONFIG', 'Correct the configuration.', fields)
    return config
  }
  const recordSuitRef = (entity, id, version, config) => {
    if (['products','campaigns'].includes(entity) && config.suitId) exec('INSERT OR IGNORE INTO commerce_suit_refs VALUES(?,?,?)', config.suitId, id, version)
    if (entity === 'products') {
      exec('DELETE FROM products WHERE id=?', id)
      if (config.suitId) exec('INSERT INTO products VALUES(?,?,?)', id, config.name, config.suitId)
    }
  }
  const ledger = (userId, type, amount, reference, reason, allocations = [], creditType = 'LEGACY_CREDIT') => {
    const id = randomUUID()
    exec('INSERT INTO commerce_ledger(id,user_id,type,amount,reference,reason,allocations,created_at,credit_type) VALUES(?,?,?,?,?,?,?,?,?)', id, userId, type, amount, reference, reason, JSON.stringify(allocations), now(), creditType)
    return id
  }
  const issue = (userId, amount, validityDays, source, sourceId, issuedAt = now(), creditType = 'LEGACY_CREDIT', expirationTime) => {
    if (!amount) return null
    if (!entitlementModel.validCreditType(creditType)) fail(400,'INVALID_CREDIT_TYPE','Choose a supported credit type.')
    const id = randomUUID()
    const expiresAt = expirationTime || (validityDays === null ? NEVER : addDays(issuedAt, validityDays))
    exec('INSERT INTO commerce_batches(id,user_id,source,source_id,original,remaining,reserved,issued_at,expires_at,never_expires,credit_type) VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, userId, source, sourceId, amount, amount, 0, issuedAt, expiresAt, expiresAt===NEVER?1:0, creditType)
    ledger(userId, 'GRANT', amount, sourceId, source, [{ batchId: id, amount, expiresAt: expiresAt===NEVER?null:expiresAt }], creditType)
    return id
  }
  const asset = (userId, type, title, body, reference) => {
    const id = randomUUID()
    exec('INSERT INTO commerce_assets VALUES(?,?,?,?,?,?,?)', id, userId, type, title, body, reference, now())
    return id
  }
  function seed() {
    if (one("SELECT value FROM commerce_settings WHERE key='initialized'")) return
    transaction(() => {
      const users = [
        ['DEMO-1001','Jamie Taylor','jamie@example.test','Free · no Credits'],
        ['DEMO-1002','Morgan Reed','morgan@example.test','Free + Device · legacy redemption'],
        ['DEMO-1003','Alex Chen','alex@example.test','Premium · multiple expiry batches'],
        ['DEMO-1004','Casey Brooks','casey@example.test','Premium · low balance'],
        ['DEMO-1005','Evelyn Park','evelyn@example.test','Expired membership · retained assets']
      ]
      users.forEach(user => exec('INSERT OR IGNORE INTO commerce_users VALUES(?,?,?,?)', ...user))
      const createPublished = (entity, input) => {
        const config = validate(entity, { ...input, status: 'active', description: input.description || 'Sample policy; review quantities and prices before production.' })
        exec('INSERT INTO commerce_configs VALUES(?,?,?,?,?,?,?)', input.id, entity, config.code, 1, null, 1, now())
        exec('INSERT INTO commerce_versions VALUES(?,?,?,?)', input.id, 1, JSON.stringify(config), now())
        recordSuitRef(entity, input.id, 1, config)
      }
      policy.products.forEach(input => createPublished('products', input))
      policy.services.forEach(input => createPublished('pricing', input))
      policy.contents.forEach(input => createPublished('content', input))
      createPublished('campaigns', { id: 'welcome_credits', name: 'Welcome Credits', code: 'welcome_credits', kind: 'campaign', suitId: null, grantDurationDays: 30, creditAmount: 20, creditValidityDays: 14, maxRecipients: 100, startsAt: null, endsAt: null })
      createPublished('campaigns', { id: 'support_compensation', name: 'Support Compensation', code: 'support_compensation', kind: 'compensation', suitId: null, grantDurationDays: 30, creditAmount: 10, creditValidityDays: 30, maxRecipients: 50, startsAt: null, endsAt: null })
      for (const grant of all('SELECT g.*,s.type FROM grants g JOIN suits s ON s.id=g.suit_id')) {
        const snapshot = decode(one('SELECT payload FROM suit_versions WHERE suit_id=? AND version=?', grant.suit_id, grant.version).payload)
        const amount = snapshot.creditBenefit.amount
        if (amount) {
          const batchId = issue(grant.user_id, amount, snapshot.creditBenefit.validityDays, grant.type === 'base' ? 'membership' : 'device', grant.id, grant.starts_at)
          const spent = grant.user_id === 'DEMO-1003' ? Math.max(0, amount - 70) : grant.user_id === 'DEMO-1004' ? Math.max(0, amount - 2) : 0
          if (spent) { exec('UPDATE commerce_batches SET remaining=remaining-? WHERE id=?', spent, batchId); ledger(grant.user_id, 'SPEND', -spent, 'demo-history', 'Earlier sample usage', [{ batchId, amount: spent }]) }
        }
        if (grant.type==='base' && grant.suit_id!=='free') {
          const productId=grant.source.includes('Annual')?'premium_annual':'premium_monthly', product=configDetail('products',productId).published
          exec('INSERT INTO commerce_subscriptions VALUES(?,?,?,?,?,?)', `sub_${grant.user_id}`, grant.user_id, productId, grant.id, 1, grant.starts_at)
          exec('INSERT INTO commerce_subscription_state VALUES(?,?)', `sub_${grant.user_id}`, JSON.stringify({product,sku:product.skus[0],suit:{id:grant.suit_id,version:grant.version,config:snapshot},pendingChange:null,billingIssue:null}))
        }
      }
      issue('DEMO-1003', 40, 30, 'purchase', 'historical-topup-40', addDays(now(), -27))
      issue('DEMO-1003', 100, 180, 'purchase', 'historical-topup-100', addDays(now(), -1))
      issue('DEMO-1005', 40, 40, 'purchase', 'historical-topup-expired-member', addDays(now(), -30))
      const expiredStart = addDays(now(), -60), expiredEnd = addDays(now(), -30)
      exec('INSERT INTO grants VALUES(?,?,?,?,?,?,?,?)', 'grant_expired_evelyn', 'DEMO-1005', 'Evelyn Park', 'premium', 1, 'Premium · Monthly', expiredStart, expiredEnd)
      exec('INSERT INTO commerce_subscriptions VALUES(?,?,?,?,?,?)', 'sub_DEMO-1005', 'DEMO-1005', 'premium_monthly', 'grant_expired_evelyn', 0, expiredStart)
      const expiredBatch = issue('DEMO-1005', 150, 30, 'membership', 'grant_expired_evelyn', expiredStart)
      exec('UPDATE commerce_batches SET remaining=0 WHERE id=?', expiredBatch)
      ledger('DEMO-1005', 'EXPIRE', -150, expiredBatch, 'Membership Credits batch expired', [{ batchId: expiredBatch, amount: 150 }])
      exec('INSERT INTO commerce_redemptions VALUES(?,?,?,?,?,?,?)', 'redemption_legacy', 'DEMO-1002', 'course_featured', 'legacy_star', JSON.stringify({ name: 'The Signature Strength Session', contentVersion: 1, credits: 0, members: [] }), null, addDays(now(), -90))
      users.forEach(([id]) => {
        asset(id, 'conversation', 'Earlier AI Coach conversation', 'Saved conversation: your previous training discussion remains available.', 'demo-import')
        asset(id, 'report', 'Last week’s AI insight', 'Your weekly workout summary is saved here for you to revisit.', 'demo-import')
        asset(id, 'plan', 'My saved training plan', 'My training plan: three sessions per week. Your saved plan is ready whenever you return.', 'demo-import')
      })
      exec("INSERT INTO commerce_settings VALUES('initialized','1')")
    })
  }
  seed()
  initializing=false

  const canonical = value => JSON.stringify(value, (_, entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? Object.keys(entry).sort().reduce((result, key) => ({ ...result, [key]: entry[key] }), {}) : entry)
  function memo(kind, key, input, work, read) {
    if (typeof key !== 'string' || key.length < 8 || key.length > 128) fail(400, 'REQUEST_KEY_REQUIRED', 'A unique request key is required.')
    const hash = createHash('sha256').update(canonical(input)).digest('hex')
    const prior = one('SELECT * FROM commerce_requests WHERE key=?', key)
    if (prior) {
      if (prior.kind !== kind || prior.hash !== hash) fail(409, 'REQUEST_KEY_REUSED', 'This request key belongs to a different operation.')
      return read(prior.result_id)
    }
    const id = work()
    exec('INSERT INTO commerce_requests VALUES(?,?,?,?)', key, kind, hash, id)
    return read(id)
  }
  const enrichAllocation = allocation => {
    const batch = one('SELECT * FROM commerce_batches WHERE id=?', allocation.batchId)
    return { ...allocation, source: batch ? batch.source : 'unknown', sourceId: batch && batch.source_id, issuedAt: batch && batch.issued_at, expiresAt: batch && !batch.never_expires ? batch.expires_at : null }
  }
  function releaseUsage(row, status) {
    const allocations = decode(row.allocations)
    for (const part of allocations) exec('UPDATE commerce_batches SET reserved=reserved-? WHERE id=?', part.amount, part.batchId)
    const payload = decode(row.payload)
    if (payload.allowance) exec('UPDATE commerce_allowance_buckets SET reserved=reserved-1 WHERE id=?', payload.allowance.bucketId)
    if (payload.credits) ledger(row.user_id, 'RELEASE', payload.credits, row.id, status === 'expired' ? 'Request reservation expired' : 'Service failed; reservation released', allocations,payload.creditType||'LEGACY_CREDIT')
    exec('UPDATE commerce_usage SET status=?,updated_at=? WHERE id=?', status, now(), row.id)
  }
  function maintenance() {
    for (const usage of all("SELECT * FROM commerce_usage WHERE status='reserved' AND lease_expires_at<=?", now())) releaseUsage(usage, 'expired')
    for (const schedule of all("SELECT * FROM commerce_schedules WHERE status='scheduled' AND due_at<=? ORDER BY due_at,id", now())) {
      const grant = one('SELECT * FROM grants WHERE id=?', schedule.grant_id)
      if (!grant || (grant.expires_at && grant.expires_at <= schedule.due_at)) { exec("UPDATE commerce_schedules SET status='canceled' WHERE id=?", schedule.id); continue }
      const benefit = decode(schedule.payload)
      issue(schedule.user_id, benefit.amount, benefit.validityDays, schedule.source, schedule.id, schedule.due_at, benefit.creditType||'LEGACY_CREDIT', benefit.expirationTime)
      exec("UPDATE commerce_schedules SET status='issued' WHERE id=?", schedule.id)
    }
    // Expiry removes only unreserved remaining Credits. In-flight work keeps its
    // reservation for the short lease; release after expiry cannot restore validity.
    for (const batch of all('SELECT * FROM commerce_batches WHERE never_expires=0 AND expires_at<=? AND remaining>reserved', now())) {
      const amount = batch.remaining - batch.reserved
      exec('UPDATE commerce_batches SET remaining=reserved WHERE id=?', batch.id)
      ledger(batch.user_id, 'EXPIRE', -amount, batch.id, 'Credits batch expired', [{ batchId: batch.id, amount }], batch.credit_type)
    }
  }
  const atomic = work => transaction(() => { maintenance(); return work() })
  function wallet(userId, creditType='LEGACY_CREDIT') {
    getUser(userId)
    const batches = all('SELECT * FROM commerce_batches WHERE user_id=? ORDER BY never_expires,CASE WHEN source=\'purchase\' AND never_expires=1 THEN 1 ELSE 0 END,expires_at,issued_at,id', userId).map(row => ({ id: row.id, creditType:row.credit_type, source: row.source, sourceId: row.source_id, original: row.original, remaining: row.remaining, reserved: row.reserved, available: row.never_expires || row.expires_at > now() ? row.remaining - row.reserved : 0, issuedAt: row.issued_at, expiresAt: row.never_expires ? null : row.expires_at, neverExpires: !!row.never_expires, status: !row.never_expires && row.expires_at <= now() ? 'expired' : row.remaining ? 'active' : 'depleted' }))
    const accounts=entitlementModel.creditTypes().map(type=>{const lots=batches.filter(batch=>batch.creditType===type.code);return {...type,available:lots.reduce((sum,row)=>sum+row.available,0),purchased:lots.filter(row=>row.source==='purchase').reduce((sum,row)=>sum+row.available,0),reserved:lots.reduce((sum,row)=>sum+row.reserved,0)}})
    const selected=accounts.find(account=>account.code===creditType)
    if (!selected) fail(400,'INVALID_CREDIT_TYPE','Choose a supported credit type.')
    return { creditType,...selected, accounts, includedUsage: includedUsage(userId), batches, scheduled: all("SELECT id,due_at AS dueAt,payload,source,status FROM commerce_schedules WHERE user_id=? AND status='scheduled' ORDER BY due_at", userId).map(row => ({ ...row, benefit: decode(row.payload), payload: undefined })) }
  }
  function grants(userId) {
    return all('SELECT g.*,s.type,s.system_default FROM grants g JOIN suits s ON s.id=g.suit_id WHERE g.user_id=? ORDER BY g.starts_at DESC,g.id', userId).map(row => {
      const config = decode(one('SELECT payload FROM suit_versions WHERE suit_id=? AND version=?', row.suit_id, row.version).payload)
      return { id: row.id, userId, suitId: row.suit_id, type: row.type, systemDefault: !!row.system_default, version: row.version, name: config.name, source: row.source, startsAt: row.starts_at, expiresAt: row.expires_at, status: row.starts_at > now() ? 'scheduled' : row.expires_at && row.expires_at <= now() ? 'expired' : 'active', config }
    })
  }
  function effective(userId) {
    getUser(userId)
    const records = grants(userId)
    const paidBases = records.filter(row => row.type === 'base' && !row.systemDefault && row.status === 'active')
    const defaultBase = records.find(row => row.type === 'base' && row.systemDefault && row.status === 'active')
    const free = suitDetail('free')
    const base = paidBases[0] || defaultBase || { id: 'derived-free', suitId: 'free', type: 'base', systemDefault: true, name: free.published.name, version: free.publishedVersion, source: 'Free default after membership expiry', startsAt: null, expiresAt: null, config: free.published, status: 'active' }
    const additional = records.filter(row => row.type === 'additional' && row.status === 'active')
    const items = {}
    const freeConfig=defaultBase?defaultBase.config:free.published
    const baseline=base.config.modelVersion===2&&!base.systemDefault?{id:'system-free-baseline',name:freeConfig.name,version:defaultBase?defaultBase.version:free.publishedVersion,type:'base',expiresAt:null,config:{...freeConfig,items:freeConfig.items.filter(item=>entitlementModel.isContent(item.code))}}:null
    for (const grant of [base, ...(baseline?[baseline]:[]), ...additional]) for (const spec of grant.config.items) {
      if (!items[spec.code]) items[spec.code] = { code: spec.code, type:entitlementModel.isContent(spec.code)?'content_access':'feature_access', name: (entitlementModel.catalog().find(item => item.code === spec.code)||catalog.find(item => item.code === spec.code) || {}).name || spec.code, scopes: [], sources: [] }
      const item = items[spec.code]
      item.scopes = [...new Set([...item.scopes, ...(spec.scopes||[])])]
      if (item.scopes.includes('all')) item.scopes = ['all']
      item.sources.push({ grantId: grant.id, name: grant.name, version: grant.version, modelVersion:grant.config.modelVersion||1,policyVersion:grant.config.policyVersion||null, type: grant.type, scopes: spec.scopes||[], expiresAt: grant.expiresAt })
    }
    return { base, additional, items: Object.values(items), membershipActive: !base.systemDefault }
  }
  const permission = (userId, code, scope) => {
    const item = effective(userId).items.find(entry => entry.code === code)
    const sources=item?item.sources.filter(source=>source.modelVersion===2?(item.type==='feature_access'||source.scopes.includes(scope)):(source.scopes.includes('all')||source.scopes.includes(scope))):[]
    return { allowed:sources.length>0, sources }
  }
  function usableRedemption(userId, contentId) {
    const row = one('SELECT * FROM commerce_redemptions WHERE user_id=? AND content_id=? AND (expires_at IS NULL OR expires_at>?) ORDER BY created_at DESC LIMIT 1', userId, contentId, now())
    return row ? { ...decode(row.payload), id: row.id, source: row.source, expiresAt: row.expires_at } : null
  }
  function contentAccess(userId, contentId, programId) {
    getUser(userId)
    const content = configDetail('content', contentId)
    const config = content.published
    if (!config || config.status !== 'active') return { allowed: false, reason: 'CONTENT_UNAVAILABLE', message: 'This content is unavailable.', contentId }
    // A durable redemption is an independent asset, including after a tier change.
    const redemption = usableRedemption(userId, contentId)
    if (redemption) return { allowed: true, reason: 'REDEEMED', message: 'Your independent redemption grants access.', contentId, redemption }
    if (programId && config.contentType !== 'training_program') {
      const parent = configDetail('content', programId), parentDecision = contentAccess(userId, programId)
      const members = parentDecision.redemption ? parentDecision.redemption.members : parent.published && parent.published.members
      if (parent.published && parent.published.contentType === 'training_program' && parentDecision.allowed && Array.isArray(members) && members.includes(contentId)) return { allowed: true, reason: 'PROGRAM_INCLUDED', message: 'Included in your Program.', contentId, programId }
      return { allowed: false, reason: 'PROGRAM_ACCESS_REQUIRED', message: 'This workout is not included in an accessible Program.', contentId }
    }
    if (config.tier === 'featured') {
      const current=config.policyVersion===POLICY_VERSION
      if(config.contentScope&&(!current||config.redemptionCredits===null))return {allowed:false,reason:'CONSUMPTION_POLICY_UNDEFINED',message:'The content unlock price has not been configured. No Credits have been charged.',contentId}
      const creditType=current?'CONTENT_CREDIT':'LEGACY_CREDIT',available=wallet(userId,creditType).available
      return {allowed:false,reason:'REDEMPTION_REQUIRED',message:'Unlock this Featured content separately.',contentId,credits:config.redemptionCredits,creditType,available,affordable:available>=config.redemptionCredits}
    }
    const scope = config.contentScope || (config.tier==='free'?(config.freeScope||'free_content'):'premium_content')
    const right = permission(userId, config.entitlementCode, scope)
    return { allowed: right.allowed, reason: right.allowed ? 'ENTITLED' : 'ENTITLEMENT_REQUIRED', message: right.allowed ? 'Your current rights grant access.' : 'This content requires an eligible membership or Additional entitlement.', contentId, sources: right.sources, scope }
  }
  function includedUsage(userId) {
    const rights = effective(userId), result = []
    for (const grant of [rights.base, ...rights.additional]) for (const rule of grant.config.includedServices || []) {
      if (grant.config.modelVersion===2) continue
      if (!grant.startsAt) continue
      let index = rule.period === 'weekly' ? Math.floor((Date.parse(now()) - Date.parse(grant.startsAt)) / (7 * DAY)) : 0
      if (rule.period === 'monthly') while (addMonths(grant.startsAt, index + 1) <= now()) index++
      const start = rule.period === 'weekly' ? addDays(grant.startsAt, index * 7) : addMonths(grant.startsAt, index)
      let end = rule.period === 'weekly' ? addDays(grant.startsAt, (index + 1) * 7) : addMonths(grant.startsAt, index + 1)
      if (grant.expiresAt && end > grant.expiresAt) end = grant.expiresAt
      const id = `${grant.id}:${rule.serviceId}:${start}`, bucket = one('SELECT * FROM commerce_allowance_buckets WHERE id=?', id)
      result.push({ ...rule, grantId: grant.id, bucketId: id, periodStart: start, resetAt: end, used: bucket ? bucket.used : 0, reserved: bucket ? bucket.reserved : 0, remaining: rule.amount - (bucket ? bucket.used + bucket.reserved : 0), version: grant.version })
    }
    return result.sort((a,b) => a.resetAt.localeCompare(b.resetAt))
  }
  const mvpUser = userId => effective(userId).base.config.policyVersion===POLICY_VERSION
  const serviceConfig = (userId,serviceId) => {
    if(mvpUser(userId)){const matching=publishedConfigs('pricing').filter(row=>row.policyVersion===POLICY_VERSION&&row.servicePurpose===serviceId),mapped=matching.find(row=>row.status==='active')||matching[0];if(mapped)return configDetail('pricing',mapped.id)}
    return configDetail('pricing',serviceId)
  }
  function serviceAccess(userId, serviceId) {
    const service = serviceConfig(userId,serviceId)
    const config = service.published
    if (!config || config.status !== 'active') return { allowed: false, reason: 'SERVICE_UNAVAILABLE', message: 'This service is unavailable.', serviceId }
    const purpose=config.servicePurpose||config.code,featureCode=FEATURE_SERVICES[purpose],featureRight=featureCode?permission(userId,featureCode,null):null
    const currentFeature=featureRight&&featureRight.sources.some(source=>source.policyVersion===POLICY_VERSION)
    if(config.policyVersion===POLICY_VERSION||mvpUser(userId)||currentFeature){
      const feature=featureCode,right=feature?featureRight:{allowed:true,sources:[]}
      const creditType=feature?null:'AI_COACH_CREDIT',amount=feature?0:config.policyVersion===POLICY_VERSION?config.credits:null,balance=creditType?wallet(userId,creditType).available:null
      const defined=amount!==null&&amount!==undefined,affordable=feature||defined&&balance>=amount
      const reason=!right.allowed?'ENTITLEMENT_REQUIRED':!defined?'CONSUMPTION_POLICY_UNDEFINED':!affordable?'CREDITS_INSUFFICIENT':'ALLOWED'
      return {allowed:right.allowed&&defined&&affordable,entitlementAllowed:right.allowed,affordable,reason,message:reason==='ENTITLEMENT_REQUIRED'?'Your plan does not include this AI insight. Your basic workout data stays available.':reason==='CONSUMPTION_POLICY_UNDEFINED'?'The price per User Turn has not been configured. No credits will be held or charged.':reason==='CREDITS_INSUFFICIENT'?'Add AI Coach Credits to continue.':'Ready',credits:amount,available:balance,creditType,unit:feature?null:'user_turn',billingSource:feature?'feature':'credits',requiresOverageConsent:!feature,allowance:null,serviceId:service.id,serviceName:config.name,priceVersion:service.publishedVersion,entitlementCode:feature||null,scope:null,sources:right.sources,policyVersion:POLICY_VERSION}
    }
    const right = permission(userId, config.entitlementCode, config.scope)
    if (config.code!=='plan_activate' && right.sources.some(source=>source.modelVersion===2)) return {allowed:false,entitlementAllowed:true,affordable:false,reason:'CONSUMPTION_POLICY_UNDEFINED',message:'Credit consumption rules for the new entitlement model are not defined yet.',serviceId,serviceName:config.name,credits:null,available:null,priceVersion:service.publishedVersion}
    const balance = wallet(userId).available
    const rules = includedUsage(userId).filter(rule => rule.serviceId === serviceId && right.sources.some(source => source.grantId === rule.grantId))
    const allowance = rules.find(rule => rule.remaining > 0) || null
    const blocked = rules.length > 0 && !allowance && !rules.some(rule => rule.allowOverage)
    const credits = allowance ? 0 : config.credits, affordable = !blocked && balance >= credits
    const reason = !right.allowed ? 'ENTITLEMENT_REQUIRED' : blocked ? 'INCLUDED_USAGE_EXHAUSTED' : !affordable ? 'CREDITS_INSUFFICIENT' : 'ALLOWED'
    return { allowed: right.allowed && affordable, entitlementAllowed: right.allowed, affordable, reason, message: reason === 'INCLUDED_USAGE_EXHAUSTED' ? 'Included service resets soon.' : !right.allowed ? 'Membership access and any extra usage charge are required separately.' : !affordable ? 'Add Credits to continue.' : 'Ready', available: balance, credits, extraPrice: config.credits, billingSource: allowance ? 'included' : config.credits ? 'credits' : 'free', requiresOverageConsent: !allowance && config.credits > 0, allowance, resetAt: rules[0] && rules[0].resetAt, serviceId, serviceName: config.name, priceVersion: service.publishedVersion, entitlementCode: config.entitlementCode, scope: config.scope, sources: right.sources }
  }
  function allocate(userId, amount, reserve, creditType='LEGACY_CREDIT') {
    const available = wallet(userId,creditType).available
    if (amount > available) fail(409, 'CREDITS_INSUFFICIENT', `This action needs ${amount} Credits; ${available} are available.`)
    let left = amount
    const allocations = []
    for (const batch of all('SELECT * FROM commerce_batches WHERE user_id=? AND credit_type=? AND (never_expires=1 OR expires_at>?) AND remaining>reserved ORDER BY never_expires,CASE WHEN source=\'purchase\' AND never_expires=1 THEN 1 ELSE 0 END,expires_at,issued_at,id', userId, creditType, now())) {
      if (!left) break
      const used = Math.min(left, batch.remaining - batch.reserved)
      if (reserve) exec('UPDATE commerce_batches SET reserved=reserved+? WHERE id=?', used, batch.id)
      else exec('UPDATE commerce_batches SET remaining=remaining-? WHERE id=?', used, batch.id)
      allocations.push({ batchId: batch.id, amount: used })
      left -= used
    }
    return allocations
  }
  const quoteRow = (id, kind, userId) => {
    const row = one('SELECT * FROM commerce_quotes WHERE id=?', id) || fail(404, 'QUOTE_NOT_FOUND', 'Quote was not found.')
    if (row.kind !== kind || row.user_id !== userId) fail(400, 'QUOTE_MISMATCH', 'Quote does not match this action or user.')
    if (row.expires_at <= now()) fail(409, 'QUOTE_EXPIRED', 'Quote expired. Review the current price again.')
    return { id: row.id, expiresAt: row.expires_at, ...decode(row.payload) }
  }
  const putQuote = (userId, kind, payload) => {
    const id = randomUUID(), expiresAt = new Date(Date.parse(now()) + policy.quoteMinutes * 60000).toISOString()
    exec('INSERT INTO commerce_quotes VALUES(?,?,?,?,?)', id, userId, kind, JSON.stringify(payload), expiresAt)
    return { id, expiresAt, ...payload }
  }
  function purchaseQuote(input) {
    getUser(input.userId)
    const product = configDetail('products', input.productId)
    if (!product.published || product.published.status !== 'active') fail(409, 'PRODUCT_UNAVAILABLE', 'This product is not available for new purchase.')
    if(product.published.kind==='credits'&&product.published.credits.creditType==='HUMAN_COACH_CREDIT')fail(409,'CREDIT_TYPE_NOT_IN_MVP','Human Coach Credits are outside the confirmed MVP. Historical purchases remain unchanged.')
    const sku = product.published.skus.find(entry => entry.id === input.skuId && entry.status === 'active') || fail(409, 'SKU_UNAVAILABLE', 'Choose an Active SKU.')
    let suit = null, startsAt = now(), subscriptionId = null
    if (product.published.kind === 'membership') {
      const selected = activeSuit(product.published.suitId, 'base')
      suit = { id: selected.id, version: selected.publishedVersion, config: selected.published }
      const periods = grants(input.userId).filter(grant => grant.type === 'base' && !grant.systemDefault && ['active','scheduled'].includes(grant.status))
      if (periods.length && product.published.upgradeRule === 'not_allowed') fail(409, 'ACTIVE_MEMBERSHIP', 'This product cannot be purchased during an existing paid period.')
      if (periods.length) {
        const current = subscriptionRows(input.userId).find(row => row.grant.status === 'active')
        if (!current) fail(409, 'MEMBERSHIP_MANAGEMENT_REQUIRED', 'Manage your existing paid period before making another purchase.')
        if (current.productId === product.id) fail(409, 'ALREADY_SUBSCRIBED', 'You already have this plan. Manage your subscription instead.')
        if (current.channel !== sku.channel) fail(409, 'CHANNEL_MISMATCH', 'Manage this subscription through its original channel.')
        if(selected.published.policyVersion===POLICY_VERSION||product.published.upgradeRule==='immediate')fail(409,'UPGRADE_SETTLEMENT_UNDEFINED','An upgrade starts immediately with a new cycle, but remaining-value settlement has not been configured. No payment has been taken; your current plan stays active.')
        startsAt = current.grant.expiresAt; subscriptionId = current.id
      }
    }
    const subscriptionTimeZone=input.subscriptionTimeZone||'UTC'
    if(!validateTimeZone(subscriptionTimeZone))fail(400,'INVALID_TIME_ZONE','Choose a valid subscription time zone.')
    const calendar=suit&&suit.config.policyVersion===POLICY_VERSION?date=>monthBoundary(startsAt,date,subscriptionTimeZone):date=>addMonths(startsAt,date)
    const end = suit ? sku.billingPeriod ? calendar(sku.billingPeriod === 'annual' ? 12 : 1) : addDays(startsAt, sku.durationDays) : null
    return putQuote(input.userId, 'purchase', { action: subscriptionId ? 'change_plan' : 'purchase', subscriptionId,subscriptionTimeZone, productId: product.id, productVersion: product.publishedVersion, product: product.published, sku, suit, startsAt, expiresAtMembership: end, credits: suit ? suit.config.creditGrants||suit.config.creditBenefit : product.published.credits })
  }
  function currentPurchaseQuote(quote) {
    const current = configDetail('products', quote.productId)
    if (!current.published || current.published.status !== 'active' || current.publishedVersion !== quote.productVersion) fail(409, 'QUOTE_STALE', 'Product changed. Review a new quote before purchasing.')
    const sku = current.published.skus.find(entry => entry.id === quote.sku.id && entry.status === 'active')
    if (!sku) fail(409, 'SKU_UNAVAILABLE', 'This SKU is no longer available.')
    if (quote.suit) {
      const suit = activeSuit(quote.suit.id, 'base')
      if (suit.publishedVersion !== quote.suit.version) fail(409, 'QUOTE_STALE', 'Membership benefits changed. Review a new quote.')
    }
  }
  function scheduleBenefits(userId, grantId, benefit, startsAt, endsAt, source,context={}) {
    if (Array.isArray(benefit)) { for (const rule of benefit) scheduleBenefits(userId,grantId,rule,startsAt,endsAt,source,context); return }
    if (!benefit) return
    if (!benefit.amount) return
    const dates = [startsAt]
    if (benefit.cadence === 'monthly') for (let month = 1; month < 121; month++) {
      const due = context.policyVersion===POLICY_VERSION&&source==='membership'?monthBoundary(context.subscriptionAnchor||startsAt,(context.subscriptionMonthIndex||0)+month,context.subscriptionTimeZone||'UTC'):addMonths(startsAt, month)
      if (due >= endsAt) break
      dates.push(due)
    }
    for (const [index,due] of dates.entries()) {
      const id = randomUUID()
      const monthlyEnd=context.policyVersion===POLICY_VERSION&&source==='membership'?monthBoundary(context.subscriptionAnchor||startsAt,(context.subscriptionMonthIndex||0)+index+1,context.subscriptionTimeZone||'UTC'):null
      const expirationTime=monthlyEnd?(monthlyEnd<endsAt?monthlyEnd:endsAt):benefit.expiration==='membership_cycle'?endsAt:benefit.expiration==='grant_period'?(benefit.cadence==='monthly'&&addMonths(startsAt,index+1)<endsAt?addMonths(startsAt,index+1):endsAt):undefined
      exec('INSERT INTO commerce_schedules VALUES(?,?,?,?,?,?,?)', id, userId, grantId, source, JSON.stringify({...benefit,...context,...(benefit.expiration==='never'?{validityDays:null}:{}),...(expirationTime?{expirationTime}:{})}), due, 'scheduled')
    }
  }
  function fulfill(row) {
    if (row.status !== 'paid') fail(409, 'ORDER_NOT_PAID', 'Only a paid order can be fulfilled.')
    if (row.fulfillment === 'completed') return
    const purchase = decode(row.payload)
    if (purchase.suit) {
      const overlap = grants(row.user_id).find(grant => grant.type === 'base' && !grant.systemDefault && grant.startsAt < purchase.expiresAtMembership && grant.expiresAt > purchase.startsAt)
      if (overlap) fail(409, 'FULFILLMENT_CONFLICT', 'Another paid period overlaps this purchase snapshot. Resolve the conflict before retrying.')
      const grantId = randomUUID()
      // Preserve purchased dates/version. Disabling a product or suit later does
      // not prevent fulfillment of an order that was already paid.
      const user = getUser(row.user_id)
      exec('INSERT INTO grants VALUES(?,?,?,?,?,?,?,?)', grantId, user.id, user.name, purchase.suit.id, purchase.suit.version, purchase.product.name, purchase.startsAt, purchase.expiresAtMembership)
      exec('UPDATE grants SET expires_at=? WHERE user_id=? AND suit_id=\'free\' AND (expires_at IS NULL OR expires_at>?)', purchase.startsAt, user.id, purchase.startsAt)
      scheduleBenefits(user.id, grantId, purchase.suit.config.creditGrants||purchase.suit.config.creditBenefit, purchase.startsAt, purchase.expiresAtMembership, 'membership',{policyVersion:purchase.suit.config.policyVersion||null,subscriptionTimeZone:purchase.subscriptionTimeZone||'UTC',subscriptionAnchor:purchase.startsAt})
      const subscriptionId = randomUUID()
      exec('INSERT INTO commerce_subscriptions VALUES(?,?,?,?,?,?)', subscriptionId, user.id, purchase.productId, grantId, 1, now())
      saveSubscription(subscriptionId, { product: purchase.product, sku: purchase.sku, suit: purchase.suit,subscriptionTimeZone:purchase.subscriptionTimeZone||'UTC',subscriptionAnchor:purchase.startsAt,subscriptionMonthIndex:0, pendingChange: null, billingIssue: null })
      purchase.grantId = grantId
    } else purchase.batchId = issue(row.user_id, purchase.product.credits.amount, purchase.product.credits.validityDays, 'purchase', row.id, now(), purchase.product.credits.creditType||'LEGACY_CREDIT')
    exec("UPDATE commerce_orders SET fulfillment='completed',payload=?,updated_at=? WHERE id=?", JSON.stringify(purchase), now(), row.id)
    audit('ORDER_FULFILLED', row.id, { userId: row.user_id, productId: purchase.productId, suitVersion: purchase.suit && purchase.suit.version, grantId: purchase.grantId, batchId: purchase.batchId })
    maintenance()
  }
  const orderDetail = id => {
    const row = one('SELECT * FROM commerce_orders WHERE id=?', id) || fail(404, 'ORDER_NOT_FOUND', 'Order was not found.')
    const payload = decode(row.payload)
    return { ...payload, id, userId: row.user_id, userName: getUser(row.user_id).name, status: row.status, fulfillment: row.fulfillment, createdAt: row.created_at, updatedAt: row.updated_at, batch: payload.batchId ? wallet(row.user_id).batches.find(batch => batch.id === payload.batchId) : null }
  }
  const usageDetail = id => {
    const row = one('SELECT * FROM commerce_usage WHERE id=?', id) || fail(404, 'REQUEST_NOT_FOUND', 'Service request was not found.')
    return { ...decode(row.payload), id: row.id, userId: row.user_id, userName: getUser(row.user_id).name, status: row.status, allocations: decode(row.allocations).map(enrichAllocation), assetId: row.asset_id, leaseExpiresAt: row.lease_expires_at, createdAt: row.created_at, updatedAt: row.updated_at }
  }
  const redemptionDetail = id => {
    const row = one('SELECT * FROM commerce_redemptions WHERE id=?', id) || fail(404, 'NOT_FOUND', 'Redemption was not found.')
    const payload = decode(row.payload)
    return { ...payload, id, userId: row.user_id, userName: getUser(row.user_id).name, contentId: row.content_id, contentType: payload.contentType || configDetail('content', row.content_id).published.contentType, source: row.source, expiresAt: row.expires_at, createdAt: row.created_at, status: row.expires_at && row.expires_at <= now() ? 'expired' : 'active' }
  }
  const subscriptionState = id => { const row = one('SELECT payload FROM commerce_subscription_state WHERE subscription_id=?', id); return row ? decode(row.payload) : null }
  const saveSubscription = (id, value) => exec('INSERT INTO commerce_subscription_state VALUES(?,?) ON CONFLICT(subscription_id) DO UPDATE SET payload=excluded.payload', id, JSON.stringify(value))
  const subscriptionRows = userId => all(`SELECT * FROM commerce_subscriptions${userId ? ' WHERE user_id=?' : ''} ORDER BY created_at DESC`, ...(userId ? [userId] : [])).map(row => {
    const grant = grants(row.user_id).find(entry => entry.id === row.grant_id)
    const saved = subscriptionState(row.id), product = saved ? saved.product : configDetail('products', row.product_id).published, sku = saved ? saved.sku : product.skus[0]
    return { id: row.id, userId: row.user_id, userName: getUser(row.user_id).name, productId: row.product_id, productName: product.name, autoRenew: !!row.auto_renew, createdAt: row.created_at, grant, status: saved && saved.billingIssue ? 'renewal_failed' : grant.status === 'active' && !row.auto_renew ? 'canceled' : grant.status, renewal: row.auto_renew && grant.status !== 'expired' ? 'on' : 'off', channel: sku.channel, sku,subscriptionTimeZone:saved&&saved.subscriptionTimeZone||'UTC', pendingChange: saved && saved.pendingChange, nextBillingAt: row.auto_renew ? grant.expiresAt : null, billingIssue: saved && saved.billingIssue }
  })
  const ledgerRows = userId => all(`SELECT * FROM commerce_ledger${userId ? ' WHERE user_id=?' : ''} ORDER BY created_at DESC,rowid DESC`, ...(userId ? [userId] : [])).map(row => ({ id: row.id, userId: row.user_id, userName: getUser(row.user_id).name, type: row.type, creditType:row.credit_type, amount: row.amount, reference: row.reference, reason: row.reason, allocations: decode(row.allocations).map(enrichAllocation), createdAt: row.created_at }))
  const assets = userId => all(`SELECT a.id,a.type,a.title,a.body,a.reference,a.created_at AS createdAt,u.payload AS usagePayload
    FROM commerce_assets a LEFT JOIN commerce_usage u ON u.id=a.reference AND u.asset_id=a.id
    WHERE a.user_id=? ORDER BY a.created_at DESC,a.rowid DESC`, userId).map(({ usagePayload, ...row }) => {
    const source = usagePayload ? decode(usagePayload) : {}
    const feature=source.policyVersion===POLICY_VERSION&&FEATURE_SERVICES[source.code]
    const readable=!feature||permission(userId,feature,null).allowed
    return { ...row,body:readable?row.body:null,locked:!readable, serviceId: source.serviceId || null, serviceCode: source.code || null, objectKey: source.objectKey || null, billingSource: source.billingSource || null,policyVersion:source.policyVersion||null }
  })
  function reportView(userId){
    getUser(userId);const row=one('SELECT payload FROM commerce_workout_fixtures WHERE user_id=?',userId)
    if(!row)return {available:false,reason:'NOT_ENOUGH_WORKOUTS'}
    const report=require('./weekly-report.cjs').buildReport(decode(row.payload))
    if(!report.available)return report
    const access=permission(userId,'weekly_report_ai_insight',null)
    const leading=report.mix.reduce((best,row)=>row.minutes>best.minutes?row:best,report.mix[0]),names={cardio:'cardio',strength:'strength',mind_body:'mind-body activity'}
    const insight=`Your ${report.stats.workouts} workouts added up to ${report.stats.time} minutes across ${report.stats.activeDays} active days. ${names[leading.type]} made up the largest part of your week. Review your workout mix alongside your goal and leave room for recovery.`
    return {...report,read:!!one('SELECT read_at FROM commerce_report_state WHERE user_id=? AND report_id=?',userId,report.id),insight:{allowed:access.allowed,body:access.allowed?insight:null},userName:getUser(userId).name}
  }
  const filtered = (entries, query = {}) => entries.filter(entry => (!query.userId || entry.userId === query.userId) && (!query.status || entry.status === query.status) && (!query.type || entry.type === query.type) && (!query.search || canonical(entry).toLowerCase().includes(String(query.search).toLowerCase())))

  return {
    configDetail,
    bulkContent(input) {
      return atomic(() => {
        if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100 || new Set(input.items.map(item => item.id)).size !== input.items.length) fail(400, 'INVALID_SELECTION', 'Choose 1–100 unique content records.')
        if (!['save','publish'].includes(input.action)) fail(400, 'INVALID_ACTION', 'Choose Save Drafts or Publish Drafts.')
        const prepared = input.items.map(item => {
          const row = configRow('content', item.id); revisionCheck(row, item.revision)
          if (input.action === 'publish' && !row.draft) fail(409, 'NO_DRAFT', 'Every selected record must have a saved draft.')
          const previous=decode(row.draft||JSON.stringify(liveConfig(row)))
          const mapping=previous.contentScope||(previous.tier==='free'?(previous.freeScope||'free_content'):'premium_content')
          const proposed = input.action === 'save' ? { ...previous,...(!legacyFixtures?{contentScope:mapping}:{}), tier: input.tier, redemptionCredits: input.redemptionCredits, redemptionValidityDays: input.redemptionValidityDays } : decode(row.draft)
          const config = validate('content', proposed, row)
          if (input.action === 'publish' && canonical(config) === canonical(liveConfig(row))) fail(409, 'NO_CHANGES', 'A selected draft matches its published version.')
          return { row, config }
        })
        for (const { row, config } of prepared) {
          if (input.action === 'save') exec('UPDATE commerce_configs SET draft=?,revision=revision+1,updated_at=? WHERE id=?', JSON.stringify(config), now(), row.id)
          else {
            const version = (row.published_version || 0) + 1
            exec('INSERT INTO commerce_versions VALUES(?,?,?,?)', row.id, version, JSON.stringify(config), now())
            exec('UPDATE commerce_configs SET draft=NULL,published_version=?,revision=revision+1,updated_at=? WHERE id=?', version, now(), row.id)
          }
          audit(input.action === 'save' ? 'BULK_CONTENT_DRAFT' : 'BULK_CONTENT_PUBLISH', row.id, { entity: 'content', config, version: input.action === 'publish' ? (row.published_version || 0) + 1 : null })
        }
        return prepared.map(({ row }) => configDetail('content', row.id))
      })
    },
    configList(entity, query = {}) { return atomic(() => filtered(all('SELECT id FROM commerce_configs WHERE entity=? ORDER BY updated_at DESC,code', entity).map(row => configDetail(entity, row.id)), query)) },
    configCreate(entity, input) {
      return atomic(() => {
        const config = validate(entity, input)
        if (one('SELECT id FROM commerce_configs WHERE entity=? AND code=?', entity, config.code)) fail(409, 'CODE_EXISTS', 'Code is already in use in this module.')
        const id = randomUUID()
        exec('INSERT INTO commerce_configs VALUES(?,?,?,?,?,?,?)', id, entity, config.code, 1, JSON.stringify(config), null, now())
        audit('CREATE_DRAFT', id, { entity, config })
        return configDetail(entity, id)
      })
    },
    configSave(entity, id, input, revision) {
      return atomic(() => {
        const row = configRow(entity, id); revisionCheck(row, revision)
        const config = validate(entity, input, row)
        exec('UPDATE commerce_configs SET draft=?,revision=revision+1,updated_at=? WHERE id=?', JSON.stringify(config), now(), id)
        audit('SAVE_DRAFT', id, { entity, config })
        return configDetail(entity, id)
      })
    },
    configPublish(entity, id, revision) {
      return atomic(() => {
        const row = configRow(entity, id); revisionCheck(row, revision)
        if (!row.draft) fail(409, 'NO_DRAFT', 'Save a draft before publishing.')
        const config = validate(entity, decode(row.draft), row)
        if (canonical(config) === canonical(liveConfig(row))) fail(409, 'NO_CHANGES', 'Draft matches the published version.')
        const version = (row.published_version || 0) + 1
        exec('INSERT INTO commerce_versions VALUES(?,?,?,?)', id, version, JSON.stringify(config), now())
        exec('UPDATE commerce_configs SET draft=NULL,published_version=?,revision=revision+1,updated_at=? WHERE id=?', version, now(), id)
        recordSuitRef(entity, id, version, config)
        audit('PUBLISH', id, { entity, version, config })
        return configDetail(entity, id)
      })
    },
    configDiscard(entity, id, revision) {
      return atomic(() => {
        const row = configRow(entity, id); revisionCheck(row, revision)
        if (!row.published_version) fail(409, 'UNPUBLISHED_CONFIG', 'Delete an unused unpublished draft instead.')
        exec('UPDATE commerce_configs SET draft=NULL,revision=revision+1,updated_at=? WHERE id=?', now(), id)
        audit('DISCARD_DRAFT', id, { entity })
        return configDetail(entity, id)
      })
    },
    configDelete(entity, id, revision) {
      return atomic(() => {
        const row = configRow(entity, id); revisionCheck(row, revision)
        if (row.published_version) fail(409, 'PUBLISHED_CONFIG', 'Published configuration keeps its history. Publish Disabled to stop new use.')
        exec('DELETE FROM commerce_configs WHERE id=?', id)
        audit('DELETE_DRAFT', id, { entity, code: row.code })
        return { id }
      })
    },
    configHistory(entity, id) { configRow(entity, id); return all('SELECT version,payload,published_at FROM commerce_versions WHERE config_id=? ORDER BY version DESC', id).map(row => ({ version: row.version, config: decode(row.payload), publishedAt: row.published_at })) },
    configPreview(entity, id, input) {
      return atomic(() => {
        const row = configRow(entity, id), proposed = validate(entity, input, row), published = liveConfig(row)
        const changes = Object.keys(proposed).filter(key => canonical(proposed[key]) !== canonical(published && published[key])).map(field => ({ field, before: published ? published[field] : null, after: proposed[field] }))
        const existingOrders = all('SELECT payload FROM commerce_orders').filter(order => decode(order.payload).productId === id).length
        const existingRedemptions = one('SELECT COUNT(*) AS count FROM commerce_redemptions WHERE content_id=?', id).count
        const included = entity === 'content' && proposed.contentType === 'training_program' ? proposed.members.map(memberId => { const member = configDetail('content', memberId); return { id: memberId, name: member.name, tier: member.published.tier, status: member.published.status } }) : []
        return { nextVersion: (row.published_version || 0) + 1, changes, existingOrders, existingRedemptions, included, policy: entity === 'content' ? 'New starts use the current label. Existing redemptions and saved results retain their rights.' : 'Saved purchases, grants, Credits batches and in-flight service quotes retain their snapshots.' }
      })
    },
    users(query) { return atomic(() => filtered(all('SELECT * FROM commerce_users ORDER BY id').map(user => ({ ...user, effective: effective(user.id), wallet: wallet(user.id) })), query)) },
    userDetail(userId) {
      return atomic(() => ({ user: getUser(userId), effective: effective(userId), grants: grants(userId), wallet: wallet(userId), ledger: ledgerRows(userId), redemptions: all('SELECT id FROM commerce_redemptions WHERE user_id=? ORDER BY created_at DESC', userId).map(row => redemptionDetail(row.id)), assets: assets(userId), orders: all('SELECT id FROM commerce_orders WHERE user_id=? ORDER BY created_at DESC', userId).map(row => orderDetail(row.id)), subscriptions: subscriptionRows(userId), requests: all('SELECT id FROM commerce_usage WHERE user_id=? ORDER BY created_at DESC', userId).map(row => usageDetail(row.id)) }))
    },
    overview() {
      return atomic(() => {
        const users = all('SELECT * FROM commerce_users ORDER BY id').map(user => ({ ...user, effective: effective(user.id), wallet: wallet(user.id) }))
        const balance=(user,type)=>(user.wallet.accounts.find(account=>account.code===type)||{available:0}).available
        return { users: users.length, paidMembers: users.filter(user => user.effective.membershipActive).length,availableAiCredits:users.reduce((sum,user)=>sum+balance(user,'AI_COACH_CREDIT'),0),availableContentCredits:users.reduce((sum,user)=>sum+balance(user,'CONTENT_CREDIT'),0), availableCredits: users.reduce((sum, user) => sum + user.wallet.available, 0), reservedCredits: users.reduce((sum, user) => sum + user.wallet.reserved, 0), pendingFulfillment: one("SELECT COUNT(*) AS count FROM commerce_orders WHERE status='paid' AND fulfillment!='completed'").count, products: publishedConfigs('products').filter(row => row.status === 'active').length, content: publishedConfigs('content').length, recentOrders: all('SELECT id FROM commerce_orders ORDER BY created_at DESC LIMIT 5').map(row => orderDetail(row.id)), recentLedger: ledgerRows().slice(0, 8), usersWithScenarios: users.map(user => ({ id: user.id, name: user.name, scenario: user.scenario, balance: user.wallet.available,aiCoachBalance:balance(user,'AI_COACH_CREDIT'),contentBalance:balance(user,'CONTENT_CREDIT'), membership: user.effective.base.name })), policy: { quoteMinutes: policy.quoteMinutes, reservationMinutes: policy.reservationMinutes } }
      })
    },
    ledger(query) { return atomic(() => filtered(ledgerRows(), query)) },
    subscriptions(query) { return atomic(() => filtered(subscriptionRows(), query)) },
    orders(query) { return atomic(() => filtered(all('SELECT id FROM commerce_orders ORDER BY created_at DESC').map(row => orderDetail(row.id)), query)) },
    order(id) { return atomic(() => orderDetail(id)) },
    redemptions(query) { return atomic(() => filtered(all('SELECT id FROM commerce_redemptions ORDER BY created_at DESC').map(row => redemptionDetail(row.id)), query)) },
    usage(query) { return atomic(() => filtered(all('SELECT id FROM commerce_usage ORDER BY created_at DESC').map(row => usageDetail(row.id)), query)) },
    getAsset(userId, id) { getUser(userId);const result=assets(userId).find(entry=>entry.id===id)||fail(404,'ASSET_NOT_FOUND','Saved asset was not found.');if(result.locked)fail(403,'ENTITLEMENT_REQUIRED','This AI insight requires feature access. Your base workout data remains available.');return result },
    access(input) { return atomic(() => input.contentId ? contentAccess(input.userId, input.contentId, input.programId) : serviceAccess(input.userId, input.serviceId)) },
    joinChallenge(input) {
      return atomic(()=>memo('challenge-join',input.requestKey,{userId:input.userId,contentId:input.contentId},()=>{
        const content=configDetail('content',input.contentId).published
        if(!content||content.contentType!=='limited_challenge')fail(400,'INVALID_CHALLENGE','Choose an enabled limited Challenge.')
        const prior=one('SELECT id FROM commerce_challenge_participation WHERE user_id=? AND content_id=?',input.userId,input.contentId)
        if(prior)return prior.id
        const rules=content.challengeRules
        if(now()<rules.startsAt)fail(409,'CHALLENGE_NOT_OPEN','This Challenge has not opened yet.')
        if(now()>=rules.endsAt)fail(409,'CHALLENGE_CLOSED','This Challenge has ended.')
        const decision=contentAccess(input.userId,input.contentId)
        if(!decision.allowed)fail(409,decision.reason,decision.message)
        const id=randomUUID();exec('INSERT INTO commerce_challenge_participation VALUES(?,?,?,?,?)',id,input.userId,input.contentId,JSON.stringify({rules,contentVersion:configDetail('content',input.contentId).publishedVersion}),now());audit('CHALLENGE_JOINED',id,{userId:input.userId,contentId:input.contentId});return id
      },id=>one('SELECT id,content_id AS contentId,joined_at AS joinedAt FROM commerce_challenge_participation WHERE id=?',id)))
    },
    weeklyReport(userId){return atomic(()=>reportView(userId))},
    readWeeklyReport(input){return atomic(()=>{getUser(input.userId);const row=one('SELECT payload FROM commerce_workout_fixtures WHERE user_id=?',input.userId);const report=row&&require('./weekly-report.cjs').buildReport(decode(row.payload));if(!report||!report.available||report.id!==input.reportId)fail(404,'REPORT_NOT_FOUND','Weekly report was not found.');exec('INSERT OR IGNORE INTO commerce_report_state VALUES(?,?,?)',input.userId,input.reportId,now());return {read:true,reportId:input.reportId}})},
    quotePurchase(input) { return atomic(() => purchaseQuote(input)) },
    purchase(input) {
      return atomic(() => memo('purchase', input.requestKey, { userId: input.userId, quoteId: input.quoteId, outcome: input.outcome || 'succeeded' }, () => {
        getUser(input.userId)
        const quote = quoteRow(input.quoteId, 'purchase', input.userId)
        currentPurchaseQuote(quote)
        if (quote.action === 'change_plan') {
          if (input.outcome && input.outcome !== 'succeeded') fail(400, 'INVALID_OUTCOME', 'A plan change schedules no payment. Simulate payment outcomes at renewal.')
          const current = subscriptionRows(input.userId).find(row => row.id === quote.subscriptionId)
          if (!current || current.grant.status !== 'active' || current.grant.expiresAt !== quote.startsAt) fail(409, 'QUOTE_STALE', 'The subscription period changed. Review this change again.')
          const state = subscriptionState(current.id) || { product: configDetail('products', current.productId).published, sku: current.sku, suit: { id: current.grant.suitId, version: current.grant.version, config: current.grant.config } }
          if (state.pendingChange) exec("UPDATE commerce_orders SET status='canceled',fulfillment='not_started',updated_at=? WHERE id=?", now(), state.pendingChange.orderId)
          const id = randomUUID()
          exec('INSERT INTO commerce_orders VALUES(?,?,?,?,?,?,?)', id, input.userId, 'scheduled', 'scheduled', JSON.stringify(quote), now(), now())
          saveSubscription(current.id, { ...state, pendingChange: { ...quote, orderId: id }, billingIssue: null })
          exec('UPDATE commerce_subscriptions SET auto_renew=1 WHERE id=?', current.id)
          audit('PLAN_CHANGE_SCHEDULED', current.id, { orderId: id, effectiveAt: quote.startsAt, noChargeNow: true })
          return id
        }
        if (!['succeeded','failed','fulfillment_failed'].includes(input.outcome || 'succeeded')) fail(400, 'INVALID_OUTCOME', 'Choose a supported simulated payment outcome.')
        // Another checkout may have queued a period after the quote was created.
        if (quote.suit && grants(input.userId).some(grant => grant.type === 'base' && !grant.systemDefault && grant.startsAt < quote.expiresAtMembership && grant.expiresAt > quote.startsAt)) fail(409, 'QUOTE_STALE', 'Another paid period changed the start date. Review a new quote.')
        const id = randomUUID(), paid = input.outcome !== 'failed', fulfillment = input.outcome === 'fulfillment_failed' ? 'failed' : paid ? 'pending' : 'not_started'
        exec('INSERT INTO commerce_orders VALUES(?,?,?,?,?,?,?)', id, input.userId, paid ? 'paid' : 'failed', fulfillment, JSON.stringify(quote), now(), now())
        audit('PAYMENT_RESULT', id, { userId: input.userId, status: paid ? 'paid' : 'failed', fulfillment })
        if (paid && fulfillment === 'pending') fulfill(one('SELECT * FROM commerce_orders WHERE id=?', id))
        return id
      }, orderDetail))
    },
    retryFulfillment(id) { return atomic(() => { const row = one('SELECT * FROM commerce_orders WHERE id=?', id) || fail(404, 'ORDER_NOT_FOUND', 'Order was not found.'); fulfill(row); return orderDetail(id) }) },
    setRenewal(id, enabled, reason) {
      return atomic(() => {
        const row = one('SELECT * FROM commerce_subscriptions WHERE id=?', id) || fail(404, 'NOT_FOUND', 'Subscription was not found.')
        if (typeof reason !== 'string' || !reason.trim()) fail(400, 'REASON_REQUIRED', 'Enter a reason for the renewal change.')
        if (typeof enabled !== 'boolean') fail(400, 'INVALID_CONFIG', 'Renewal must be on or off.')
        const grant = one('SELECT * FROM grants WHERE id=?', row.grant_id)
        if (enabled && grant.expires_at <= now()) fail(409, 'PERIOD_EXPIRED', 'The old period expired. Create a new purchase rather than resuming it.')
        exec('UPDATE commerce_subscriptions SET auto_renew=? WHERE id=?', enabled ? 1 : 0, id)
        const state = subscriptionState(id)
        if (!enabled && state && state.pendingChange) {
          exec("UPDATE commerce_orders SET status='canceled',fulfillment='not_started',updated_at=? WHERE id=?", now(), state.pendingChange.orderId)
          saveSubscription(id, { ...state, pendingChange: null })
        }
        audit(enabled ? 'RESUME_RENEWAL' : 'CANCEL_RENEWAL', id, { reason: reason.trim(), userId: row.user_id, currentPeriodUnchanged: true })
        return subscriptionRows(row.user_id).find(subscription => subscription.id === id)
      })
    },
    restorePurchases(input) { return atomic(() => { getUser(input.userId); return { subscriptions: subscriptionRows(input.userId), effective: effective(input.userId), restored: true } }) },
    renewDemo(id, input) {
      return atomic(() => memo('subscription_renewal', input.requestKey, { id, periodEnd: input.periodEnd, outcome: input.outcome || 'succeeded' }, () => {
        const row = one('SELECT * FROM commerce_subscriptions WHERE id=?', id) || fail(404, 'NOT_FOUND', 'Subscription was not found.')
        const grant = grants(row.user_id).find(g => g.id === row.grant_id)
        if (grant.expiresAt !== input.periodEnd) fail(409, 'PERIOD_CHANGED', 'The subscription period already changed.')
        if (grant.expiresAt > now()) fail(409, 'PERIOD_NOT_ENDED', 'The current paid period has not ended.')
        if (!row.auto_renew) fail(409, 'RENEWAL_OFF', 'Renewal is off; no new period is charged.')
        if (!['succeeded','failed'].includes(input.outcome || 'succeeded')) fail(400, 'INVALID_OUTCOME', 'Choose success or failure.')
        const state = subscriptionState(id) || { product: configDetail('products', row.product_id).published, sku: configDetail('products', row.product_id).published.skus[0], suit: { id: grant.suitId, version: grant.version, config: grant.config }, pendingChange: null }
        const next = state.pendingChange || state, startsAt = grant.expiresAt
        const subscriptionAnchor=state.subscriptionAnchor||grant.startsAt,subscriptionMonthIndex=(state.subscriptionMonthIndex||0)+(state.sku.billingPeriod==='annual'?12:1)
        const expiresAtMembership = next.sku.billingPeriod ? next.suit.config.policyVersion===POLICY_VERSION?monthBoundary(subscriptionAnchor,subscriptionMonthIndex+(next.sku.billingPeriod==='annual'?12:1),state.subscriptionTimeZone||'UTC'):addMonths(startsAt, next.sku.billingPeriod === 'annual' ? 12 : 1) : addDays(startsAt, next.sku.durationDays)
        if (grants(row.user_id).some(g => g.type==='base' && !g.systemDefault && g.id!==grant.id && g.startsAt<expiresAtMembership && g.expiresAt>startsAt)) fail(409, 'RENEWAL_CONFLICT', 'Another paid membership overlaps this renewal. No payment is created.')
        const orderId = randomUUID(), snapshot = { productId: next.productId || row.product_id, product: next.product, sku: next.sku, suit: next.suit, startsAt, expiresAtMembership,subscriptionTimeZone:state.subscriptionTimeZone||'UTC', credits: next.suit.config.creditGrants||next.suit.config.creditBenefit, subscriptionId: id }
        exec('INSERT INTO commerce_orders VALUES(?,?,?,?,?,?,?)', orderId, row.user_id, input.outcome === 'failed' ? 'failed' : 'paid', input.outcome === 'failed' ? 'not_started' : 'completed', JSON.stringify(snapshot), now(), now())
        if (input.outcome === 'failed') { saveSubscription(id, { ...state, billingIssue: 'Payment failed at renewal.' }); return orderId }
        const grantId = randomUUID(), user = getUser(row.user_id)
        exec('INSERT INTO grants VALUES(?,?,?,?,?,?,?,?)', grantId, user.id, user.name, next.suit.id, next.suit.version, next.product.name, startsAt, expiresAtMembership)
        scheduleBenefits(user.id, grantId, next.suit.config.creditGrants||next.suit.config.creditBenefit, startsAt, expiresAtMembership, 'membership',{policyVersion:next.suit.config.policyVersion||null,subscriptionTimeZone:state.subscriptionTimeZone||'UTC',subscriptionAnchor,subscriptionMonthIndex})
        exec('UPDATE commerce_subscriptions SET product_id=?,grant_id=? WHERE id=?', snapshot.productId, grantId, id)
        if (state.pendingChange) exec("UPDATE commerce_orders SET status='applied',fulfillment='completed',updated_at=? WHERE id=?", now(), state.pendingChange.orderId)
        saveSubscription(id, { product: next.product, sku: next.sku, suit: next.suit,subscriptionTimeZone:state.subscriptionTimeZone||'UTC',subscriptionAnchor,subscriptionMonthIndex, pendingChange: null, billingIssue: null })
        audit('DEMO_RENEWAL', id, { periodEnd: input.periodEnd, orderId, grantId, simulated: true })
        return orderId
      }, orderDetail))
    },
    quoteService(input) {
      return atomic(() => {
        const decision = serviceAccess(input.userId, input.serviceId)
        if (!decision.allowed) return { decision, quote: null }
        const service = serviceConfig(input.userId,input.serviceId)
        let targetAssetId = null
        if ((service.published.servicePurpose||service.published.code) === 'plan_activate') {
          const saved = assets(input.userId).find(entry => entry.type === 'plan' && (!input.assetId || entry.id === input.assetId)) || fail(409, 'PLAN_REQUIRED', 'Choose an existing saved plan to activate.')
          targetAssetId = saved.id
        }
        const objectKey = input.objectKey || null
        if (objectKey !== null && (typeof objectKey !== 'string' || objectKey.length > 160)) fail(400, 'INVALID_OBJECT', 'Choose a valid source object.')
        return { decision, quote: putQuote(input.userId, 'service', { ...service.published,policyVersion:decision.policyVersion||service.published.policyVersion||null,entitlementCode:decision.entitlementCode,scope:decision.scope,code:service.published.servicePurpose||service.published.code,serviceId:service.id, priceVersion: service.publishedVersion, credits: decision.credits,creditType:decision.billingSource==='feature'?null:decision.creditType||'LEGACY_CREDIT',unit:decision.unit||null, billingSource: decision.billingSource, requiresOverageConsent: decision.requiresOverageConsent, allowance: decision.allowance, objectKey, targetAssetId }) }
      })
    },
    startService(input) {
      return atomic(() => memo('service', input.requestKey, { userId: input.userId, quoteId: input.quoteId, message: input.message || '', acceptOverage: input.acceptOverage === true }, () => {
        const quote = quoteRow(input.quoteId, 'service', input.userId)
        const service = configDetail('pricing', quote.serviceId)
        if (!service.published || service.published.status !== 'active' || service.publishedVersion !== quote.priceVersion) fail(409, 'QUOTE_STALE', 'Service price changed. Review the current quote.')
        const decision = serviceAccess(input.userId, quote.serviceId)
        if (decision.billingSource !== quote.billingSource || (quote.allowance && (!decision.allowance || decision.allowance.bucketId !== quote.allowance.bucketId))) fail(409, 'QUOTE_STALE', 'Included usage changed. Review again; no extra Credits were charged.')
        if (!decision.allowed) fail(409, decision.reason, decision.message)
        if (quote.requiresOverageConsent && input.acceptOverage !== true) fail(409, 'OVERAGE_CONFIRMATION_REQUIRED', 'Confirm the extra Credits charge first.')
        if (typeof (input.message || '') !== 'string' || (input.message || '').length > 5000) fail(400, 'INVALID_MESSAGE', 'Use at most 5,000 characters.')
        if(quote.policyVersion===POLICY_VERSION&&quote.billingSource==='credits'&&!String(input.message||'').trim())fail(400,'MESSAGE_REQUIRED','Enter your question before sending it to AI Coach.')
        const allocations = allocate(input.userId, quote.credits, true,quote.creditType||'LEGACY_CREDIT')
        if (quote.allowance) {
          const a = quote.allowance
          exec('INSERT OR IGNORE INTO commerce_allowance_buckets(id,user_id,grant_id,service_id,period_start,period_end,quota) VALUES(?,?,?,?,?,?,?)', a.bucketId, input.userId, a.grantId, quote.serviceId, a.periodStart, a.resetAt, a.amount)
          exec('UPDATE commerce_allowance_buckets SET reserved=reserved+1 WHERE id=?', a.bucketId)
        }
        const id = randomUUID(), lease = new Date(Date.parse(now()) + policy.reservationMinutes * 60000).toISOString()
        exec('INSERT INTO commerce_usage VALUES(?,?,?,?,?,?,?,?,?)', id, input.userId, 'reserved', JSON.stringify({ ...quote, message: input.message || '' }), JSON.stringify(allocations), null, lease, now(), now())
        if (quote.credits) ledger(input.userId, 'RESERVE', -quote.credits, id, quote.name, allocations,quote.creditType||'LEGACY_CREDIT')
        audit('SERVICE_RESERVED', id, { userId: input.userId, priceVersion: quote.priceVersion, credits: quote.credits, billingSource: quote.billingSource, allowanceBucket: quote.allowance && quote.allowance.bucketId, objectKey: quote.objectKey })
        return id
      }, usageDetail))
    },
    finishService(id, outcome) {
      return atomic(() => {
        const row = one('SELECT * FROM commerce_usage WHERE id=?', id) || fail(404, 'REQUEST_NOT_FOUND', 'Request was not found.')
        if (row.status !== 'reserved') return usageDetail(id)
        if (!['succeeded','failed'].includes(outcome)) fail(400, 'INVALID_OUTCOME', 'Choose success or failure.')
        const payload = decode(row.payload), allocations = decode(row.allocations)
        if (outcome === 'failed') releaseUsage(row, 'failed')
        else {
          if (payload.allowance) exec('UPDATE commerce_allowance_buckets SET reserved=reserved-1,used=used+1 WHERE id=?', payload.allowance.bucketId)
          for (const part of allocations) exec('UPDATE commerce_batches SET remaining=remaining-?,reserved=reserved-? WHERE id=?', part.amount, part.amount, part.batchId)
          if (payload.credits) ledger(row.user_id, 'SPEND', -payload.credits, id, payload.name, allocations,payload.creditType||'LEGACY_CREDIT')
          const type = payload.code === 'plan_activate' ? 'activation' : payload.code === 'plan_preview' ? 'plan' : payload.code.startsWith('ai_') ? 'conversation' : 'report'
          const entry = type === 'conversation' ? 'AI Coach history' : type === 'report' ? 'the original workout or report page' : 'your plan page'
          const body = payload.code === 'plan_activate' ? 'Your saved plan is ready to follow.' : payload.code === 'weekly_insight' ? payload.policyVersion===POLICY_VERSION?(reportView(row.user_id).insight.body||'Your base weekly report remains available.'):'Example weekly summary: You completed 3 workouts and 92 active minutes. Keep a consistent schedule next week and review how each session feels.' : payload.code === 'deep_analysis' ? 'Example workout insight: At RPE 4/10, this session felt moderate. Compare your effort with previous sessions and use it to choose a comfortable next workout.' : `${payload.message ? 'Your question: ' + payload.message + '\n\n' : ''}Example coach reply: Tell me about your goal, available equipment and how you feel today so we can choose your next training step.`
          const assetId = asset(row.user_id, type, payload.name, body, id)
          exec("UPDATE commerce_usage SET status='completed',asset_id=?,updated_at=? WHERE id=?", assetId, now(), id)
        }
        audit(outcome === 'succeeded' ? 'SERVICE_COMPLETED' : 'SERVICE_FAILED', id, { userId: row.user_id, credits: payload.credits, priceVersion: payload.priceVersion, billingSource: payload.billingSource, allowanceBucket: payload.allowance && payload.allowance.bucketId, objectKey: payload.objectKey })
        maintenance()
        return usageDetail(id)
      })
    },
    quoteRedemption(input) {
      return atomic(() => {
        getUser(input.userId)
        const content = configDetail('content', input.contentId), existing = usableRedemption(input.userId, input.contentId)
        if (existing) return { alreadyRedeemed: true, redemption: existing, quote: null }
        if (!content.published || content.published.status !== 'active' || content.published.tier !== 'featured') fail(409, 'NOT_REDEEMABLE', 'Only Active Featured content can be redeemed.')
        const currentPolicy=content.published.policyVersion===POLICY_VERSION
        if ((content.published.contentScope&&!currentPolicy)||content.published.redemptionCredits===null) return {quote:null,reason:'CONSUMPTION_POLICY_UNDEFINED',message:'The redemption amount has not been configured. No credits have been charged.',creditType:'CONTENT_CREDIT'}
        const creditType=currentPolicy?'CONTENT_CREDIT':'LEGACY_CREDIT',balance = wallet(input.userId,creditType).available
        if (balance < content.published.redemptionCredits) return { quote: null, reason: 'CREDITS_INSUFFICIENT', available: balance, credits: content.published.redemptionCredits,creditType }
        return { quote: putQuote(input.userId, 'redemption', { contentId: content.id, contentVersion: content.publishedVersion, name: content.published.name, contentType: content.published.contentType, credits: content.published.redemptionCredits,creditType,policyVersion:content.published.policyVersion||null, validityDays: currentPolicy?null:content.published.redemptionValidityDays, members: content.published.members }), available: balance }
      })
    },
    redeem(input) {
      return atomic(() => memo('redemption', input.requestKey, { userId: input.userId, quoteId: input.quoteId }, () => {
        const quote = quoteRow(input.quoteId, 'redemption', input.userId)
        const prior = usableRedemption(input.userId, quote.contentId)
        if (prior) return prior.id
        const current = configDetail('content', quote.contentId)
        if (!current.published || current.published.status !== 'active' || current.published.tier !== 'featured' || current.publishedVersion !== quote.contentVersion) fail(409, 'QUOTE_STALE', 'Content price or label changed. Review the current offer.')
        const allocations = allocate(input.userId, quote.credits, false,quote.creditType||'LEGACY_CREDIT')
        const id = randomUUID(), expiresAt = quote.validityDays ? addDays(now(), quote.validityDays) : null
        exec('INSERT INTO commerce_redemptions VALUES(?,?,?,?,?,?,?)', id, input.userId, quote.contentId, 'credits', JSON.stringify({ ...quote, allocations }), expiresAt, now())
        ledger(input.userId, 'SPEND', -quote.credits, id, `Featured redemption · ${quote.name}`, allocations,quote.creditType||'LEGACY_CREDIT')
        audit('CONTENT_REDEEMED', id, { userId: input.userId, contentId: quote.contentId, contentVersion: quote.contentVersion, credits: quote.credits })
        return id
      }, redemptionDetail))
    },
    issueCredits(input) {
      return atomic(() => memo('compensation', input.requestKey, { userId: input.userId, creditType:input.creditType||'LEGACY_CREDIT', amount: input.amount, validityDays: input.validityDays, reason: input.reason }, () => {
        getUser(input.userId)
        if (!integer(input.amount, 1, 1000000) || (input.validityDays!==null&&!integer(input.validityDays, 1, 3650))) fail(400, 'INVALID_CONFIG', 'Use positive integer Credits and no expiry or 1–3,650 validity days.')
        if (typeof input.reason !== 'string' || input.reason.trim().length < 3 || input.reason.length > 500) fail(400, 'REASON_REQUIRED', 'Enter a reason of 3–500 characters.')
        if(input.creditType==='HUMAN_COACH_CREDIT')fail(400,'CREDIT_TYPE_NOT_IN_MVP','Human Coach Credits are outside the confirmed MVP. Historical balances remain unchanged.')
        const id = issue(input.userId, input.amount, input.validityDays, 'compensation', input.requestKey, now(), input.creditType||'LEGACY_CREDIT')
        audit('CREDITS_COMPENSATED', id, { userId: input.userId, amount: input.amount, validityDays: input.validityDays, reason: input.reason.trim() })
        return id
      }, id => ({ batch: wallet(input.userId).batches.find(row => row.id === id), wallet: wallet(input.userId) })))
    },
    // Accounting primitives take an explicit amount; they do not define a service
    // tariff or a user cancellation policy, and are not exposed as App endpoints.
    consumeCredits(input) {
      return atomic(()=>memo('typed-consume',input.requestKey,input,()=>{
        getUser(input.userId)
        if (!entitlementModel.validCreditType(input.creditType)||!integer(input.amount,1,1000000)||typeof input.reference!=='string'||!input.reference.trim()) fail(400,'INVALID_CREDIT_TRANSACTION','A credit type, positive amount and reference are required.')
        const allocations=allocate(input.userId,input.amount,false,input.creditType)
        return ledger(input.userId,'CONSUME',-input.amount,input.reference,'Explicit accounting consumption',allocations,input.creditType)
      },id=>ledgerRows(input.userId).find(entry=>entry.id===id)))
    },
    refundCredits(input) {
      return atomic(()=>memo('typed-refund',input.requestKey,input,()=>{
        const consume=one("SELECT * FROM commerce_ledger WHERE id=? AND user_id=? AND type='CONSUME'",input.transactionId,input.userId)
        if (!consume) fail(404,'TRANSACTION_NOT_FOUND','Consumption transaction was not found.')
        if (one("SELECT id FROM commerce_ledger WHERE reference=? AND type='REFUND'",consume.id)) fail(409,'ALREADY_REFUNDED','This transaction was already refunded.')
        const allocations=decode(consume.allocations)
        for (const part of allocations) exec('UPDATE commerce_batches SET remaining=remaining+? WHERE id=?',part.amount,part.batchId)
        const id=ledger(input.userId,'REFUND',-consume.amount,consume.id,'Accounting reversal; original expiration retained',allocations,consume.credit_type)
        maintenance()
        return id
      },id=>ledgerRows(input.userId).find(entry=>entry.id===id)))
    },
    runCampaign(input) {
      return atomic(() => memo('campaign', input.requestKey, { campaignId: input.campaignId, userIds: input.userIds, caseRef: input.caseRef || '', reason: input.reason }, () => {
        const campaign = configDetail('campaigns', input.campaignId), config = campaign.published
        if (!config || config.status !== 'active' || (config.startsAt && config.startsAt > now()) || (config.endsAt && config.endsAt <= now())) fail(409, 'CAMPAIGN_UNAVAILABLE', 'Campaign is not Active within its effective dates.')
        if (!Array.isArray(input.userIds) || !input.userIds.length || new Set(input.userIds).size !== input.userIds.length || input.userIds.length > config.maxRecipients) fail(400, 'INVALID_RECIPIENTS', 'Select unique recipients within the configured limit.')
        if (typeof input.reason !== 'string' || input.reason.trim().length < 3 || input.reason.length > 500) fail(400, 'REASON_REQUIRED', 'Enter a reason of 3–500 characters.')
        const rawCaseRef = config.kind === 'campaign' ? 'once' : input.caseRef
        if (typeof rawCaseRef !== 'string' || !rawCaseRef.trim() || rawCaseRef.length > 100) fail(400, 'CASE_REF_REQUIRED', 'Compensation needs a case reference of 1–100 characters.')
        const caseRef = rawCaseRef.trim()
        const additional = config.suitId ? activeSuit(config.suitId, 'additional') : null
        if (additional && additional.published.modelVersion===2&&additional.published.policyVersion!==POLICY_VERSION) fail(409,'ADDITIONAL_MERGE_UNDEFINED','Publish the current access-union and independent-grant policy before issuing this Additional suit.')
        const id = randomUUID(), results = []
        for (const userId of input.userIds) {
          const user = getUser(userId)
          if (one('SELECT run_id FROM commerce_campaign_receipts WHERE campaign_id=? AND user_id=? AND case_ref=?', campaign.id, userId, caseRef)) { results.push({ userId, name: user.name, status: 'skipped', reason: 'Already delivered for this campaign/case' }); continue }
          let grantId = null
          if (additional) {
            grantId = randomUUID()
            const ends = addDays(now(), config.grantDurationDays)
            exec('INSERT INTO grants VALUES(?,?,?,?,?,?,?,?)', grantId, userId, user.name, additional.id, additional.publishedVersion, `Campaign · ${config.name}`, now(), ends)
            scheduleBenefits(userId, grantId, additional.published.creditGrants||additional.published.creditBenefit, now(), ends, config.kind)
          }
          const batchId = issue(userId, config.creditAmount, config.creditValidityDays, config.kind, id, now(), config.creditType||'LEGACY_CREDIT')
          exec('INSERT INTO commerce_campaign_receipts VALUES(?,?,?,?)', campaign.id, userId, caseRef, id)
          results.push({ userId, name: user.name, status: 'delivered', grantId, suitVersion: additional && additional.publishedVersion, batchId, credits: config.creditAmount })
        }
        exec('INSERT INTO commerce_campaign_runs VALUES(?,?,?,?,?,?,?)', id, campaign.id, campaign.publishedVersion, caseRef, input.reason.trim(), JSON.stringify(results), now())
        audit('CAMPAIGN_DELIVERED', id, { campaignId: campaign.id, version: campaign.publishedVersion, caseRef, reason: input.reason.trim(), results })
        maintenance()
        return id
      }, id => { const row = one('SELECT * FROM commerce_campaign_runs WHERE id=?', id); return { id, campaignId: row.campaign_id, version: row.version, caseRef: row.case_ref, reason: row.reason, results: decode(row.results), createdAt: row.created_at } }))
    },
    campaignRuns(query) { return atomic(() => filtered(all('SELECT * FROM commerce_campaign_runs ORDER BY created_at DESC').map(row => ({ id: row.id, campaignId: row.campaign_id, campaignName: configDetail('campaigns', row.campaign_id).name, version: row.version, caseRef: row.case_ref, reason: row.reason, results: decode(row.results), delivered: decode(row.results).filter(result => result.status === 'delivered').length, skipped: decode(row.results).filter(result => result.status === 'skipped').length, createdAt: row.created_at })), query)) },
    audit(query) { return filtered(all('SELECT * FROM audit ORDER BY created_at DESC,rowid DESC LIMIT 500').map(row => ({ id: row.id, action: row.action, targetId: row.target_id, payload: decode(row.payload), actor: 'Demo Admin', createdAt: row.created_at })), query) },
    expireDemo(input) {
      return atomic(() => {
        getUser(input.userId)
        if (input.batchId) {
          const batch = one('SELECT * FROM commerce_batches WHERE id=? AND user_id=?', input.batchId, input.userId) || fail(404, 'NOT_FOUND', 'Batch was not found.')
          if (batch.reserved) fail(409, 'BATCH_RESERVED', 'Finish or release pending work before simulating this expiry.')
          if (batch.never_expires) fail(409, 'NON_EXPIRING_BATCH', 'Purchased extra Credits do not expire.')
          exec('UPDATE commerce_batches SET expires_at=? WHERE id=?', now(), batch.id)
          audit('DEMO_BATCH_EXPIRED', batch.id, { userId: input.userId, priorExpiresAt: batch.expires_at })
        } else {
          exec('UPDATE grants SET expires_at=? WHERE user_id=? AND starts_at<=? AND (expires_at IS NULL OR expires_at>?) AND suit_id IN (SELECT id FROM suits WHERE type=\'base\' AND system_default=0)', now(), input.userId, now(), now())
          audit('DEMO_MEMBERSHIP_EXPIRED', input.userId, { userId: input.userId, existingAssetsRetained: true })
        }
        maintenance()
        return { effective: effective(input.userId), wallet: wallet(input.userId) }
      })
    },
    storefront(userId) { return atomic(() => {
      const mvp=mvpUser(userId),visible=row=>row.status==='active'&&(mvp?row.policyVersion===POLICY_VERSION:row.policyVersion!==POLICY_VERSION)
      const services=publishedConfigs('pricing').filter(visible).map(row=>({...row,id:row.servicePurpose||row.id,configId:row.id,access:serviceAccess(userId,row.id)}))
      const contents=publishedConfigs('content').filter(visible).map(row=>{
        const decision=contentAccess(userId,row.id),members=row.contentType==='training_program'&&decision.redemption&&Array.isArray(decision.redemption.members)?decision.redemption.members:row.members
        return {...row,members,access:decision,participation:row.contentType==='limited_challenge'?one('SELECT id,joined_at AS joinedAt FROM commerce_challenge_participation WHERE user_id=? AND content_id=?',userId,row.id)||null:null,membersPreview:members.map(id=>{const member=configDetail('content',id);return {id,name:member.name,tier:member.published.tier,access:contentAccess(userId,id,row.contentType==='training_program'?row.id:undefined)}})}
      })
      return {user:getUser(userId),effective:effective(userId),wallet:wallet(userId),products:publishedConfigs('products').filter(visible).filter(row=>!(row.credits&&row.credits.creditType==='HUMAN_COACH_CREDIT')).map(row=>({...row,benefits:row.kind==='membership'?{...suitDetail(row.suitId).published,version:suitDetail(row.suitId).publishedVersion}:null})),services,contents,weeklyReport:reportView(userId),assets:assets(userId),ledger:ledgerRows(userId).slice(0,20),subscriptions:subscriptionRows(userId),orders:all('SELECT id FROM commerce_orders WHERE user_id=? ORDER BY created_at DESC',userId).map(row=>orderDetail(row.id)),policyVersion:mvp?POLICY_VERSION:null}
    }) }
  }
}
module.exports = { createCommerce, addMonths }
