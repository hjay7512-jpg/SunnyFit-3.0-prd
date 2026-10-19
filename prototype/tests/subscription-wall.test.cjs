const test=require('node:test'),assert=require('node:assert/strict')
const {resolveSubscriptionWall,reviewPromotion,wallDisclosure,safeWallEvent}=require('../src/views/app/subscription-wall.cjs')
const config=require('../config/subscription-wall.cjs'),now=Date.parse('2026-10-19T00:00:00Z')
const product={id:'premium',status:'active'}
const offer=(period,channel='web_demo',currency='USD')=>({product,sku:{id:period+'-'+channel,channel,currency,status:'active',billingPeriod:period,priceCents:period==='monthly'?999:7999}})
const offers=[offer('monthly'),offer('annual')]
const wall=(extra={})=>resolveSubscriptionWall({kind:'course',offers,channel:'web_demo',now,member:{active:false},...extra})
test('all entitlement entries share one base but preserve placement, context and focused value',()=>{
  const placements=new Set()
  for(const kind of Object.keys(config.placements)){
    const resolved=wall({kind,resource:{id:'resource',name:'Selected workout',draft:'private message'}})
    assert.equal(resolved.id,'sunnyfit-premium');assert.equal(resolved.version,2);assert.equal(resolved.benefits.length,3)
    assert.equal(resolved.benefits[0].id,config.placements[kind].focus);assert.equal(resolved.resource.id,'resource')
    assert.equal(resolved.resource.savedDraft,true);assert.equal(JSON.stringify(resolved).includes('private message'),false);placements.add(resolved.placementId)
  }
  assert.equal(placements.size,10)
})
test('normal subscription uses the catalog price and defaults to monthly',()=>{
  const resolved=wall(),selected=resolved.offers.find(item=>item.offerId===resolved.defaultOfferId)
  assert.equal(selected.sku.billingPeriod,'monthly');assert.equal(selected.chargeTodayCents,999);assert.equal(selected.cta,'Continue with Premium')
  assert.match(wallDisclosure(selected),/\$9\.99\/month, starting today/)
})
test('verified annual-only trial defaults to annual and discloses full renewal price',()=>{
  const resolved=wall(reviewPromotion('trial',now)),annual=resolved.offers.find(item=>item.offerId===resolved.defaultOfferId),monthly=resolved.offers.find(item=>item.sku.billingPeriod==='monthly')
  assert.equal(annual.sku.billingPeriod,'annual');assert.equal(annual.trialDays,30);assert.equal(annual.chargeTodayCents,0);assert.equal(annual.renewalPriceCents,7999)
  assert.equal(annual.cta,'Start 30-day free trial');assert.match(wallDisclosure(annual),/\$0\.00 today.*30 days, \$79\.99\/year/)
  assert.equal(monthly.trialDays,0);assert.equal(monthly.cta,'Continue with Premium');assert.equal(monthly.campaignId,null)
})
for(const [state,reason] of [['ineligible','ineligible'],['unknown','eligibility_unknown'],['expired','campaign_expired']])test(state+' cannot promise a free trial',()=>{
  const resolved=wall(reviewPromotion(state,now));assert.equal(resolved.eligibility.reason,reason);assert.equal(resolved.campaignId,null)
  assert.ok(resolved.offers.every(item=>!item.trialDays&&!/free/i.test(item.cta)&&item.chargeTodayCents===item.sku.priceCents))
})
test('trial is rejected for subscribed accounts, expired eligibility and mismatched placement or campaign',()=>{
  const promotion=reviewPromotion('trial',now)
  for(const extra of [{member:{active:true}},{eligibility:{...promotion.eligibility,expiresAt:new Date(now-1).toISOString()}},{eligibility:{...promotion.eligibility,campaignId:'another'}},{campaign:{...promotion.campaign,placements:['different.entry']}}])assert.ok(wall({...promotion,...extra}).offers.every(item=>!item.trialDays))
})
test('offers retain distinct channels, reject inactive/wrong currency SKU, and never invent missing eligible offers',()=>{
  const promotion=reviewPromotion('trial',now),catalog=[...offers,offer('annual','ios'),offer('monthly','web_demo','EUR'),{product,sku:{...offer('monthly').sku,status:'inactive'}}]
  assert.equal(wall({offers:catalog,currency:'USD'}).offers.length,2)
  const resolved=wall({...promotion,offers:[offers[0]]});assert.equal(resolved.campaignId,null);assert.equal(resolved.eligibility.reason,'no_eligible_offer');assert.equal(resolved.offers[0].trialDays,0)
  assert.equal(wall({offers:[]}).defaultOfferId,'')
})
test('catalog and promotion inputs are immutable; price updates invalidate the wall signature',()=>{
  const promotion=reviewPromotion('trial',now),before=JSON.stringify({offers,promotion}),first=wall(promotion)
  assert.equal(JSON.stringify({offers,promotion}),before)
  assert.notEqual(first.signature,wall({...promotion,offers:offers.map(item=>({...item,sku:{...item.sku,priceCents:item.sku.priceCents+100}}))}).signature)
})
test('tracking keeps attribution and funnel data without message content or user payloads',()=>{
  assert.deepEqual(safeWallEvent({type:'paywall_view',placementId:'course.detail.start',resourceId:'course',flowId:'flow',draft:'secret',message:'private',userPayload:{email:'private'}}),{type:'paywall_view',placementId:'course.detail.start',resourceId:'course',flowId:'flow'})
})
