const {resolveSubscriptionWall}=require('./subscription-wall.cjs')
const config=require('../../../config/subscription-wall.cjs')
function contentBadge(content){
  if(!content)return ''
  if(content.access&&content.access.reason==='REDEEMED')return 'Unlocked'
  if(content.access&&content.access.reason==='PROGRAM_INCLUDED')return 'Program'
  return content.tier==='premium'?'Premium':content.tier==='featured'?'Credits':'Free'
}
function contentAction(content,input){
  const ordinary=content&&content.contentType==='training_program'?'Select Program':'Start'
  if(!content||content.tier!=='premium'||content.access&&content.access.allowed)return {label:ordinary,locked:false,offerId:null}
  const wall=resolveSubscriptionWall({...input,kind:content.contentType,resource:content}),selected=wall.offers.find(offer=>offer.offerId===wall.defaultOfferId)
  const trial=selected&&selected.trialDays>0,campaignOverrides=trial&&input&&input.campaign&&input.campaign.contentCta
  return {label:selected?selected.contentCta:(input&&input.configuration||config).base.contentCta,locked:true,offerId:selected&&selected.offerId||null,copyField:campaignOverrides?null:'wall.placements.'+content.contentType+'.'+(trial?'contentTrialCta':'contentCta'),copySource:campaignOverrides?'campaign':null}
}
function presentContent(content){
  const c={...content},fixture=/Editable local review fixture|demo parameters/i.test(c.description||'')||String(c.id).startsWith('preview-free-')
  if(c.contentType==='world_tour'){
    c.coverUrl=c.coverUrl||'assets/figma/content-review/world-tour-cover.png'
    if(fixture){c.description='Make your next workout a change of scenery. Follow this route at a pace that works for you.';c.scene=c.scene||(c.tier==='free'?'Running':'Riding');c.equipment=c.equipment||(c.tier==='free'?'Treadmill':'Indoor Ride')}
  }
  if(c.contentType==='training_program'){
    c.coverUrl=c.coverUrl||'assets/figma/content-review/program-cover.png'
    if(fixture){c.description='Build a steady training routine with a sequence of guided workouts.';c.durationWeeks=c.durationWeeks||1;c.workoutGoal=c.workoutGoal||'Build strength';c.intensity=c.intensity||'Beginner';c.targetArea=c.targetArea||'Full body';c.trainers=c.trainers||[{name:'SunnyFit Coaches'}]}
  }
  if(c.contentType==='course'&&fixture)c.description=c.tier==='free'?'Build your foundations with this guided full-body workout.':'A guided session combining strength work and mobility.'
  return c
}
module.exports={contentBadge,contentAction,presentContent}
