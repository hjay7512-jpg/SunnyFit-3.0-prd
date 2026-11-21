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
  data.scenes.course_access.banner.height=100
  assert.ok(model.validate(data).some(error=>error.includes('750 × 320')))
})

test('text limits, integer sort, and required scenario text',()=>{
  const data=model.seed()
  data.membership.comparison.sort=1.5
  data.membership.comparison.title.en='X'.repeat(31)
  data.membership.details.benefits[0].headline.en='X'.repeat(31)
  data.scenes.course_access.description.en=''
  const errors=model.validate(data)
  assert.ok(errors.some(error=>error.includes('integer required')))
  assert.ok(errors.some(error=>error.includes('exceeds 30')))
  assert.ok(errors.some(error=>error.includes('scenario / course_access')&&error.includes('required')))
})

test('localized projections fall back to English and never change access rules',()=>{
  const data=model.seed()
  data.membership.comparison.title.es='Comparar'
  data.scenes.course_access.title.es='Desbloquear'
  assert.equal(model.projectMembership(data,'es')[0].title,'Comparar')
  assert.equal(model.projectScene(data,'course_access','es').title,'Desbloquear')
  assert.equal(model.projectScene(data,'course_access','de').title,data.scenes.course_access.title.en)
})

test('old saved data gains only missing fixed scenarios without deleting existing copy',()=>{
  const existing=model.seed()
  const original=existing.scenes.course_access.title.en='My curated headline'
  delete existing.scenes.ai_coach_chat
  const recovered=model.reconcile(existing)
  assert.equal(recovered.scenes.course_access.title.en,original)
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
  assert.equal(Object.keys(seeded.scenes).length,7)
  assert.ok(seeded.scenes.ai_coach_chat)
  assert.ok(seeded.scenes.dynamic_plan)
})

test('older local drafts drop unavailable paywall scenes but retain other edits', () => {
  const existing = model.seed()
  existing.scenes.movement_access = {title:{en:'Old movement copy'}}
  existing.scenes.challenge_access = {title:{en:'Old challenge copy'}}
  existing.scenes.course_access.title.en = 'Keep my custom copy'
  const recovered = model.reconcile(existing, [
    {code:'movement_access',name:'Movement Access',type:'feature_access'},
    {code:'challenge_access',name:'Challenge Access',type:'feature_access'}
  ])
  assert.equal(recovered.scenes.movement_access,undefined)
  assert.equal(recovered.scenes.challenge_access,undefined)
  assert.equal(recovered.scenes.course_access.title.en,'Keep my custom copy')
  assert.deepEqual(model.validate(recovered),[])
})
