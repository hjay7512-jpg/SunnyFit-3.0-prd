const test = require('node:test')
const assert = require('node:assert/strict')
const model = require('../src/views/commercialization/subscription-guides/model.cjs')

test('PRD 4.1 seeds three fixed modules and existing entitlement scenes', () => {
  const data = model.seed()
  assert.deepEqual(model.SECTION_IDS, ['comparison','details','faq'])
  assert.equal(data.membership.details.benefits.length, 4)
  assert.ok(data.scenes.course_access)
  assert.ok(data.scenes.dynamic_plan)
  assert.ok(data.scenes.weekly_report_ai_insight)
  assert.equal(model.validate(data).length,0)
})

test('sort descending; disabled modules do not appear in membership projection', () => {
  const data = model.seed()
  data.membership.comparison.sort = 4
  data.membership.details.sort = 11
  data.membership.faq.sort = 9
  assert.deepEqual(model.projectMembership(data).map(section=>section.id),['details','faq','comparison'])
  data.membership.faq.enabled = false
  assert.deepEqual(model.projectMembership(data).map(section=>section.id),['details','comparison'])
})

test('Free and Premium comparison descriptions are omitted when blank', () => {
  const data=model.seed()
  const row=model.projectMembership(data)[0].rows[0]
  assert.equal(row.free.enabled,true)
  assert.ok(row.free.description)
  data.membership.comparison.rows[0].free.description.en=''
  assert.equal('description' in model.projectMembership(data)[0].rows[0].free,false)
})

test('required multilingual fields and fixed image dimensions are validated at publish', () => {
  const data=model.seed()
  data.enabledLocales.push('es')
  assert.ok(model.validate(data).some(error=>error.includes('es')))
  data.enabledLocales=['en']
  data.membership.details.benefits[0].image.width=200
  assert.ok(model.validate(data).some(error=>error.includes('750 × 375')))
  data.membership.details.benefits[0].image.width=750
  data.scenes.course_access.variants[0].banner.height=100
  assert.ok(model.validate(data).some(error=>error.includes('750 × 320')))
})

test('text limits, integer sort, and required scenario text',()=>{
  const data=model.seed()
  data.membership.comparison.sort=1.5
  data.membership.comparison.title.en='X'.repeat(31)
  data.membership.details.benefits[0].headline.en='X'.repeat(31)
  data.scenes.course_access.variants[0].description.en=''
  const errors=model.validate(data)
  assert.ok(errors.some(error=>error.includes('integer required')))
  assert.ok(errors.some(error=>error.includes('exceeds 30')))
  assert.ok(errors.some(error=>error.includes('scenario / course_access')&&error.includes('required')))
})

test('localized projections fall back to English and never change access rules',()=>{
  const data=model.seed()
  data.membership.comparison.title.es='Comparar'
  data.scenes.course_access.variants[0].title.es='Desbloquear'
  assert.equal(model.projectMembership(data,'es')[0].title,'Comparar')
  assert.equal(model.projectScene(data,'course_access','es').title,'Desbloquear')
  assert.equal(model.projectScene(data,'course_access','de').title,data.scenes.course_access.variants[0].title.en)
})

test('old saved data gains only missing fixed scenarios without deleting existing copy',()=>{
  const existing=model.seed()
  const original=existing.scenes.course_access.variants[0].title.en='My curated headline'
  delete existing.scenes.ai_coach_chat
  const recovered=model.reconcile(existing)
  assert.equal(recovered.scenes.course_access.variants[0].title.en,original)
  assert.ok(recovered.scenes.ai_coach_chat)
})

test('annotated Figma references are shipped and closed by default', () => {
  const fs=require('node:fs'), path=require('node:path')
  const root=path.join(__dirname,'..')
  const page=fs.readFileSync(path.join(root,'src/views/commercialization/subscription-guides/index.vue'),'utf8')
  assert.match(page,/referenceOpen:false/)
  assert.match(page,/aside v-if="referenceOpen"/)
  assert.match(page,/annotated-ui-reference/)
  assert.doesNotMatch(page,/Draft Preview/)
  for(const asset of ['membership-ui.png','paywall-ui.png']) {
    const data=fs.readFileSync(path.join(root,'public/assets/figma/subscription-guidance',asset))
    assert.deepEqual(Array.from(data.subarray(0,8)),[137,80,78,71,13,10,26,10])
  }
})

test('unavailable Movement and Challenge feature paywalls do not appear', () => {
  const excluded = ['movement_access','challenge_access']
  assert.deepEqual(model.UNAVAILABLE_SCENE_CODES, excluded)
  const catalog = excluded.map(code => ({code, name:code, type:'feature_access', category:'Feature Access'}))
  const seeded = model.seed(catalog)
  for (const code of excluded) {
    assert.ok(!model.CORE_SCENES.some(item => item.code===code))
    assert.equal(seeded.scenes[code],undefined)
    assert.equal(model.projectScene(seeded,code),null)
  }
  assert.equal(Object.keys(seeded.scenes).length,8)
  assert.ok(seeded.scenes.ai_coach_chat)
  assert.ok(seeded.scenes.dynamic_plan)
})

test('older local drafts drop unavailable paywall scenes but retain other edits', () => {
  const existing = model.seed()
  existing.scenes.movement_access = {title:{en:'Old movement copy'}}
  existing.scenes.challenge_access = {title:{en:'Old challenge copy'}}
  existing.scenes.course_access.variants[0].title.en = 'Keep my custom copy'
  const recovered = model.reconcile(existing, [
    {code:'movement_access',name:'Movement Access',type:'feature_access'},
    {code:'challenge_access',name:'Challenge Access',type:'feature_access'}
  ])
  assert.equal(recovered.scenes.movement_access,undefined)
  assert.equal(recovered.scenes.challenge_access,undefined)
  assert.equal(recovered.scenes.course_access.variants[0].title.en,'Keep my custom copy')
  assert.deepEqual(model.validate(recovered),[])
})

test('membership is a standalone page entry, not a feature entitlement',()=>{
  const config=model.seed()
  assert.deepEqual(model.CORE_SCENES.map(item=>item.code).slice(0,2),['membership','course_access'])
  assert.ok(config.scenes.membership)
  const introduction=model.projectScene(config,'membership','en')
  assert.equal(introduction.entrySource,'membership')
  assert.equal(introduction.entitlementCode,null)
  assert.equal(introduction.variantId,'A')
  assert.ok(introduction.title)
  assert.ok(introduction.description)
  assert.equal(model.validate(config).length,0)
})

test('create variant from existing creative, rebalance traffic and edit independently',()=>{
  const config=model.seed()
  const scene=config.scenes.membership
  const controlTitle=scene.variants[0].title.en
  const copy=model.addVariant(scene,'A')
  assert.equal(copy.id,'B')
  assert.deepEqual(scene.variants.map(v=>v.traffic),[50,50])
  assert.equal(copy.title.en,controlTitle)
  copy.title.en='A completely different offer'
  assert.equal(scene.variants[0].title.en,controlTitle)
  scene.enabled=true
  assert.deepEqual(model.validate(config),[])
  assert.equal(model.projectScene(config,'membership','en','B').title,copy.title.en)
  assert.equal(model.projectScene(config,'membership','en','A').title,controlTitle)
})

test('traffic and group validity gates publishing, duplicate group IDs are rejected',()=>{
  const config=model.seed()
  const entry=config.scenes.course_access
  model.addVariant(entry)
  entry.enabled=true
  entry.variants[0].traffic=20
  assert.ok(model.validate(config).some(error=>error.includes('must total 100%')))
  model.rebalanceTraffic(entry)
  assert.equal(model.validate(config).length,0)
  entry.variants[1].id='A'
  assert.ok(model.validate(config).some(error=>error.includes('duplicate group ID')))
})

test('disabled A/B test always serves Control A; test assignment is deterministic',()=>{
  const config=model.seed()
  const scene=config.scenes.membership
  model.addVariant(scene)
  const control=model.assignVariant(config,'membership','visitor_123')
  assert.equal(control.variantId,'A')
  assert.equal(control.experimentEnabled,false)
  scene.enabled=true
  const assignment=model.assignVariant(config,'membership','visitor_123')
  assert.equal(model.assignVariant(config,'membership','visitor_123').variantId,assignment.variantId)
  assert.equal(model.assignVariant(config,'membership','visitor_123').bucket,assignment.bucket)
  assert.ok(['A','B'].includes(assignment.variantId))
  assert.equal(model.assignVariant(config,'membership','').variantId,'A')
})

test('delete variation protects Control A and automatically resets a single-group experiment',()=>{
  const config=model.seed()
  const scene=config.scenes.membership
  model.addVariant(scene)
  model.addVariant(scene)
  assert.deepEqual(scene.variants.map(x=>x.traffic),[34,33,33])
  assert.equal(model.removeVariant(scene,'A'),false)
  assert.equal(model.removeVariant(scene,'B'),true)
  scene.enabled=true
  assert.equal(model.removeVariant(scene,'C'),true)
  assert.equal(scene.enabled,false)
  assert.equal(scene.variants[0].traffic,100)
  assert.equal(model.validate(config).length,0)
})

test('saved v1 browser draft migrates all existing creative into Control A',()=>{
  const fresh=model.seed()
  const control=fresh.scenes.course_access.variants[0]
  const legacy={schemaVersion:1,enabledLocales:['en'],membership:fresh.membership,
    scenes:{course_access:{banner:control.banner,title:{en:'Preserve my title'},description:{en:'Preserve my description'}}}}
  const migrated=model.reconcile(legacy)
  assert.equal(migrated.schemaVersion,2)
  assert.equal(migrated.scenes.course_access.variants[0].title.en,'Preserve my title')
  assert.equal(migrated.scenes.course_access.variants[0].description.en,'Preserve my description')
  assert.ok(migrated.scenes.membership)
  assert.equal(model.validate(migrated).length,0)
})

test('multilingual A/B groups require valid localized title and description',()=>{
  const config=model.seed()
  const scene=config.scenes.membership
  model.addVariant(scene)
  scene.enabled=true
  config.enabledLocales.push('es')
  assert.ok(model.validate(config).some(error=>error.includes('/ es / title')))
  for(const variant of scene.variants){variant.title.es='Más con Premium';variant.description.es='Beneficios del programa'}
  // Other paywall entries must also be translated before global publication.
  assert.ok(model.validate(config).some(error=>error.includes('scenario / course_access')))
})

test('Feature Paywalls editor exposes group selection and traffic controls',()=>{
  const fs=require('node:fs'),path=require('node:path')
  const page=fs.readFileSync(path.join(__dirname,'../src/views/commercialization/subscription-guides/index.vue'),'utf8')
  for(const token of ['paywall-entry-','paywall-ab-editor','ab-duplicate','ab-traffic-','ab-group-','ab-sample-user','ab-assignment']) assert.ok(page.includes(token))
  assert.ok(page.includes("sceneId:'membership'"))
})
