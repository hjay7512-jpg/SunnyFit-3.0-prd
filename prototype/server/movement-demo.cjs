const {defaultTraining}=require('../config/movement-training.cjs')
// Upgrade only untouched Studio samples; keep customized plans and drafts intact.
function upgradeStudioSample(store,record){
  if(record.code!=='vision_studio_workout'||record.hasDraft||record.publishedVersion>2||!record.published||record.published.sample!==true||record.published.name!=='Studio movement workout')return
  const training=defaultTraining('studio'),legacy={...training,steps:training.steps.map(({restSeconds,...s})=>s)},previous={...legacy,steps:legacy.steps.filter(s=>s.exerciseId!=='high_pull')}
  if(![legacy,previous].some(plan=>JSON.stringify(record.published.training)===JSON.stringify(plan)))return
  const draft=store.commerce.configSave('content',record.id,{...record.published,training},record.revision)
  store.commerce.configPublish('content',record.id,draft.revision)
}
function ensureMovementDemo(store){
  for(const [code,name,template,minutes] of [['vision_studio_workout','Studio movement workout','studio',4],['vision_upper_starter','Dumbbell upper body','upper',4],['vision_full_starter','Full body foundations','full',3],['movement_follow_starter','Everyday movement','regular',2]]){
    const existing=store.commerce.configList('content').find(c=>c.code===code)
    if(existing){upgradeStudioSample(store,existing);continue}
    const record=store.commerce.configCreate('content',{code,name,status:'active',description:'A guided movement group with a warm-up, focused practice and a cooldown.',contentType:'movement',entitlementCode:'movement_access',contentScope:'free_content',freeScope:'free_content',tier:'free',recommended:false,redemptionCredits:0,redemptionValidityDays:null,durationMinutes:minutes,members:[],policyVersion:20261014,sample:true,training:defaultTraining(template)})
    store.commerce.configPublish('content',record.id,record.revision)
  }
}
module.exports={ensureMovementDemo}
