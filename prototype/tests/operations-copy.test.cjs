const test=require('node:test'),assert=require('node:assert/strict')
const {defaults,catalog,validateCopyDocument,wallCopyConfiguration,renderCopy}=require('../src/copy/copy-model.cjs'),{resolveSubscriptionWall}=require('../src/views/app/subscription-wall.cjs')
const {locationsForBlock,locationForFields,effectiveCopy}=require('../src/copy/copy-locations.cjs'),blocks=require('../config/copy-blocks.json').blocks
const draft=()=>JSON.parse(JSON.stringify(defaults))
test('The full copy file is valid and editable fields exclude entitlement, prices, quota and event identifiers',()=>{
 assert.equal(validateCopyDocument(defaults).valid,true);assert.equal(catalog.fields.length,Object.keys(defaults.values).length);assert.ok(!catalog.fields.some(field=>/priceCents|currency|placementId|entitlementCode|scope|trialDays|creditType/.test(field.key)))
 const invalid=draft();invalid.values.priceCents='0';assert.equal(validateCopyDocument(invalid).valid,false);delete invalid.values.priceCents;invalid.schemaVersion=2;assert.equal(validateCopyDocument(invalid).valid,false)
})
test('Copy validation preserves live variables and rejects blank, oversized and unknown variable fields',()=>{
 for(const value of ['', 'Free for everyone','Start {price} trial','x'.repeat(61)]){const doc=draft();doc.values['wall.base.trialCta']=value;assert.equal(validateCopyDocument(doc).valid,false)}
 const doc=draft();doc.values['wall.base.trialCta']='Try Premium for {days} days';assert.equal(validateCopyDocument(doc).valid,true);assert.equal(renderCopy(doc.values,'wall.base.trialCta',{days:30}),'Try Premium for 30 days')
})
test('Per-entry CTA changes share the resolver while verified eligibility still controls trial claims',()=>{
 const inherited=draft();inherited.values['wall.base.contentCta']='Explore with Premium';assert.equal(resolveSubscriptionWall({kind:'course',configuration:wallCopyConfiguration(inherited.values),offers:[{product:{status:'active'},sku:{id:'monthly',status:'active',billingPeriod:'monthly',priceCents:999,currency:'USD'}}]}).offers[0].contentCta,'Explore with Premium')
 const doc=draft();doc.values['wall.placements.course.contentCta']='Unlock this session';doc.values['wall.placements.course.trialCta']='Try it for {days} days';const configuration=wallCopyConfiguration(doc.values),offers=[{product:{status:'active'},sku:{id:'annual',status:'active',billingPeriod:'annual',priceCents:7999,currency:'USD'}}],input={kind:'course',configuration,offers,now:1000,campaign:{id:'trial',trialDays:30},eligibility:{verified:true,status:'unknown'}}
 const ordinary=resolveSubscriptionWall(input);assert.equal(ordinary.offers[0].contentCta,'Unlock this session');assert.equal(ordinary.offers[0].trialDays,0);const trial=resolveSubscriptionWall({...input,eligibility:{verified:true,status:'eligible'}});assert.equal(trial.offers[0].cta,'Try it for 30 days');assert.equal(trial.offers[0].sku.priceCents,7999);assert.equal(configuration.placements.course.placementId,'course.detail.start');assert.equal(defaults.values['wall.placements.course.contentCta'],'')
})
test('Content workflow locations cover owned fields and separate the actual start button from purchase receipts',()=>{
 for(const kind of ['course','training_program','world_tour']){
  const id='entry-'+kind,locations=locationsForBlock(id),owned=blocks.find(block=>block.id===id).fields
  assert.deepEqual([...new Set(locations.flatMap(location=>location.fields))].sort(),[...owned].sort())
  for(const suffix of ['contentCta','contentTrialCta']){const field='wall.placements.'+kind+'.'+suffix,location=locationForFields(id,[field]);assert.equal(location.stage,'detail');assert.deepEqual(location.fields,[field]);assert.ok(!location.fields.some(key=>key.endsWith('.success')))}
  assert.equal(locationForFields(id,['wall.entryStories.'+kind+'.next']).view,'benefits')
 }
 assert.deepEqual(locationsForBlock('profile.membership'),[])
})
test('Blank per-entry copy reports the same inherited value that is rendered, including trial variables',()=>{
 const key='wall.placements.course.contentTrialCta',field=catalog.fields.find(field=>field.key===key),values={...defaults.values,'wall.base.contentTrialCta':'Try {days} days with us'}
 assert.deepEqual(effectiveCopy(values,field),{source:field.inherit,value:'Try {days} days with us',inherited:true})
 values[key]='Explore for {days} days';assert.equal(effectiveCopy(values,field).source,key);assert.equal(effectiveCopy(values,field).inherited,false)
})
