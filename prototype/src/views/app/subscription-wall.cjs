const configuration=require('../../../config/subscription-wall.cjs')
function placementFor(kind,config){return (config||configuration).placements[kind]||(config||configuration).placements.membership}
function date(value){return typeof value==='number'?value:Date.parse(value)}
function isCurrent(record,now){return record&&(!record.startsAt||date(record.startsAt)<=now)&&(!record.endsAt||date(record.endsAt)>now)}
function sameChannel(offer,channel){return !channel||!offer.sku.channel||offer.sku.channel===channel}
function campaignDecision(campaign,eligibility,member,placement,now){
  if(!campaign)return {matched:false,reason:'no_campaign'}
  if(!isCurrent(campaign,now))return {matched:false,reason:'campaign_expired'}
  if(campaign.placements&&campaign.placements.indexOf(placement.placementId)<0)return {matched:false,reason:'placement_not_eligible'}
  if(member&&member.active)return {matched:false,reason:'already_subscribed'}
  if(!eligibility||eligibility.status==='unknown'||eligibility.verified!==true)return {matched:false,reason:'eligibility_unknown'}
  if(eligibility.status!=='eligible')return {matched:false,reason:'ineligible'}
  if(eligibility.expiresAt&&date(eligibility.expiresAt)<=now)return {matched:false,reason:'eligibility_expired'}
  if(eligibility.campaignId&&eligibility.campaignId!==campaign.id)return {matched:false,reason:'eligibility_mismatch'}
  return {matched:true,reason:'eligible'}
}
function resolveSubscriptionWall(input){
  input=input||{};const config=input.configuration||configuration,base=config.base,placement=placementFor(input.kind,config),now=input.now===undefined?Date.now():input.now
  const campaign=input.campaign,eligibility=input.eligibility||{status:'unknown'},decision=campaignDecision(campaign,eligibility,input.member,placement,now),seen=new Set()
  const catalog=(input.offers||[]).filter(offer=>offer&&offer.product&&offer.sku&&offer.product.status==='active'&&offer.sku.status==='active'&&['monthly','annual'].includes(offer.sku.billingPeriod)&&Number.isInteger(offer.sku.priceCents)&&offer.sku.priceCents>=0&&sameChannel(offer,input.channel)&&(!input.currency||offer.sku.currency===input.currency))
  const offers=catalog.map(offer=>{
    const sku=offer.sku,applicable=decision.matched&&(!campaign.billingPeriods||campaign.billingPeriods.includes(sku.billingPeriod))&&(!campaign.skuIds||campaign.skuIds.includes(sku.id))&&(!campaign.channel||campaign.channel===sku.channel)
    const trialDays=applicable&&Number.isInteger(campaign.trialDays)&&campaign.trialDays>0?campaign.trialDays:0
    const campaignId=trialDays?campaign.id:null,offerId=(trialDays?'campaign:'+campaign.id:'standard')+':'+(sku.offerId||sku.id)+':'+(sku.channel||'default')
    return Object.assign({},offer,{offerId,campaignId,trialDays,chargeTodayCents:trialDays?0:sku.priceCents,renewalPriceCents:sku.priceCents,renewalPeriod:sku.billingPeriod,eligibilityStatus:trialDays?'eligible':eligibility.status,cta:trialDays?base.trialCta.replace('{days}',String(trialDays)):base.cta})
  }).filter(offer=>{if(seen.has(offer.offerId))return false;seen.add(offer.offerId);return true})
  const hasTrial=offers.some(offer=>offer.trialDays>0),reason=decision.matched&&!hasTrial?'no_eligible_offer':decision.reason
  const preferred=offers.find(offer=>offer.trialDays>0&&offer.sku.billingPeriod===(campaign&&campaign.defaultBillingPeriod||'annual'))||offers.find(offer=>offer.sku.billingPeriod===base.defaultBillingPeriod)||offers[0]
  const benefitIds=placement.benefitIds.slice(0,base.maxVisibleBenefits),resource=input.resource||{}
  return {id:base.id,version:base.version,variant:base.variant,placementId:placement.placementId,entitlementCode:placement.entitlementCode,scope:placement.scope,title:placement.title,headline:placement.headline,subtitle:placement.subtitle,artwork:placement.artwork,benefits:benefitIds.map(id=>Object.assign({id},config.benefits[id])),fullBenefits:config.fullBenefits,resource:{id:resource.id||null,name:resource.name||'',detail:resource.detail||'',savedDraft:!!resource.draft},offers,defaultOfferId:preferred&&preferred.offerId||'',campaignId:hasTrial?campaign.id:null,eligibility:{status:eligibility.status,reason},signature:[base.id,base.version,placement.placementId,reason].concat(offers.map(offer=>[offer.offerId,offer.sku.priceCents,offer.trialDays].join(':'))).join('|')}
}
function reviewPromotion(state,now){
  if(!state||state==='standard'||state==='unavailable')return {campaign:null,eligibility:{status:'unknown',verified:false}}
  const campaign={id:'review-intro-30d',version:1,trialDays:30,billingPeriods:['annual'],defaultBillingPeriod:'annual',startsAt:new Date(now-86400000).toISOString(),endsAt:new Date(now+(state==='expired'?-1:14)*86400000).toISOString(),source:'review_fixture'}
  return {campaign,eligibility:{campaignId:campaign.id,status:state==='trial'?'eligible':state==='ineligible'?'ineligible':'unknown',verified:state!=='unknown',expiresAt:new Date(now+86400000).toISOString()}}
}
function wallDisclosure(offer,locale){
  if(!offer)return ''
  const money=cents=>new Intl.NumberFormat(locale||'en-US',{style:'currency',currency:offer.sku.currency}).format(cents/100),period=offer.sku.billingPeriod==='annual'?'year':'month'
  return offer.trialDays?money(0)+' today. After '+offer.trialDays+' days, '+money(offer.sku.priceCents)+'/'+period+'. Auto-renews until canceled.':money(offer.sku.priceCents)+'/'+period+', starting today. Auto-renews until canceled.'
}
const eventFields=['eventId','type','at','flowId','placementId','wallId','wallVersion','entitlementCode','scope','resourceId','campaignId','offerId','skuId','productId','billingPeriod','currency','priceCents','trialDays','eligibilityStatus','eligibilityReason','result','source','reason','attemptId']
function safeWallEvent(event){const safe={};for(const field of eventFields)if(event[field]!==undefined)safe[field]=event[field];return safe}
module.exports={placementFor,resolveSubscriptionWall,reviewPromotion,wallDisclosure,safeWallEvent}
