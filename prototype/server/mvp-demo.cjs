const {DatabaseSync}=require('node:sqlite')
const {POLICY_VERSION}=require('./entitlement-model.cjs')
const {civil}=require('./subscription-period.cjs')
// All prices, quantities and targets below are editable local review fixtures.
// They are not inferred production prices or approved membership grants.
function ensureMvpDemo(store,filename,clockSource=()=>new Date().toISOString()){
  require('./movement-demo.cjs').ensureMovementDemo(store)
  const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON')
  try{
    if(db.prepare("SELECT value FROM commerce_settings WHERE key='mvp-review-20261014'").get())return
    const suit=(code,input)=>{
      const prior=store.list().find(row=>row.code===code);if(prior&&prior.publishedVersion)return store.detail(prior.id)
      const draft=prior?store.detail(prior.id):store.create({modelVersion:2,policyVersion:POLICY_VERSION,code,status:'active',description:'Editable local MVP review fixture; not production configuration.',includedServices:[],creditGrants:[],...input})
      return store.publish(draft.id,draft.revision)
    }
    const freeItems=['course_access','world_tour_access','training_program_access','movement_access'].map(code=>({code,scopes:['free_content']}))
    const free=suit('mvp_free_account',{name:'SunnyFit Free · MVP',type:'base',items:freeItems})
    db.prepare('UPDATE suits SET system_default=1 WHERE id=?').run(free.id)
    const premium=suit('mvp_premium',{name:'SunnyFit Premium · MVP',type:'base',items:[...freeItems.map(item=>({...item,scopes:['free_content','premium_content']})),{code:'challenge_access',scopes:['limited_challenge']},...['dynamic_plan','workout_result_ai_insight','weekly_report_ai_insight'].map(code=>({code}))],creditGrants:[{creditType:'AI_COACH_CREDIT',amount:100,cadence:'monthly',expiration:'grant_period'},{creditType:'CONTENT_CREDIT',amount:20,cadence:'monthly',expiration:'grant_period'}]})
    const publish=(entity,code,input)=>{
      const prior=store.commerce.configList(entity).find(row=>row.code===code);if(prior&&prior.publishedVersion)return prior
      const draft=prior||store.commerce.configCreate(entity,{code,status:'active',description:'Editable local review fixture. Prices and grant amounts are demo parameters.',policyVersion:POLICY_VERSION,sample:true,...input})
      return store.commerce.configPublish(entity,draft.id,draft.revision)
    }
    const sku=(code,cents,billingPeriod='one_time')=>({id:code+'_web',channel:'web_demo',storeCode:'demo.'+code,priceCents:cents,currency:'USD',status:'active',durationDays:billingPeriod==='annual'?365:billingPeriod==='monthly'?30:0,billingPeriod})
    const monthly=publish('products','mvp_premium_monthly',{name:'Premium Monthly',kind:'membership',suitId:premium.id,upgradeRule:'immediate',credits:{amount:0,validityDays:30},skus:[sku('mvp_premium_monthly',999,'monthly')]})
    publish('products','mvp_premium_annual',{name:'Premium Annual',kind:'membership',suitId:premium.id,upgradeRule:'immediate',credits:{amount:0,validityDays:30},skus:[sku('mvp_premium_annual',7999,'annual')]})
    const packs=[]
    for(const [name,type,amount,cents,code] of [['AI Coach Credits','AI_COACH_CREDIT',100,499,'mvp_ai_credits'],['Content Credits','CONTENT_CREDIT',40,499,'mvp_content_credits']])packs.push(publish('products',code,{name,kind:'credits',suitId:null,upgradeRule:'not_allowed',credits:{creditType:type,amount,validityDays:null},skus:[sku(code,cents)]}))
    for(const [purpose,name,credits] of [['ai_chat','AI Coach',2],['plan_preview','Discuss a plan with Coach',2],['deep_analysis','Workout AI Insight',0],['weekly_insight','Weekly Report AI Insight',0],['plan_activate','Activate saved plan',0]])publish('pricing','mvp_'+purpose,{name,servicePurpose:purpose,credits})
    const content=(code,name,type,tier,extra={})=>publish('content',code,{name,contentType:type,entitlementCode:{course:'course_access',world_tour:'world_tour_access',training_program:'training_program_access',movement:'movement_access',limited_challenge:'challenge_access'}[type],contentScope:type==='limited_challenge'?'limited_challenge':tier==='free'?'free_content':'premium_content',freeScope:'free_content',tier,recommended:false,redemptionCredits:tier==='featured'?30:0,redemptionValidityDays:null,durationMinutes:type==='limited_challenge'?null:20,members:[],...extra})
    const basic=content('mvp_course_free','20-Minute Full Body Basics','course','free')
    const member=content('mvp_course_premium','Strength & Mobility','course','premium')
    content('mvp_course_featured','Featured Strength Session','course','featured')
    content('mvp_world_tour','Mountain Trail','world_tour','premium')
    content('mvp_movement','Bodyweight Squat','movement','free',{durationMinutes:5})
    content('mvp_program','Strength Foundation','training_program','premium',{members:[basic.id,member.id]})
    const clock=clockSource(),end=new Date(Date.parse(clock)+14*86400000).toISOString()
    content('mvp_limited_challenge','Winter Challenge','limited_challenge','premium',{challengeRules:{startsAt:new Date(Date.parse(clock)-86400000).toISOString(),endsAt:end,target:'Follow the challenge workouts during the event.'}})
    const users=[['DEMO-2001','Jamie Taylor','mvp-free@example.test','MVP · Free · core data'],['DEMO-2002','Casey Brooks','mvp-premium@example.test','MVP · Premium · separate wallets'],['DEMO-2003','Morgan Reed','mvp-credit@example.test','MVP · Free · purchased AI Credits']]
    for(const user of users){db.prepare('INSERT OR IGNORE INTO commerce_users VALUES(?,?,?,?)').run(...user);db.prepare('INSERT OR IGNORE INTO grants VALUES(?,?,?,?,?,?,?,?)').run('mvp-free-'+user[0],user[0],user[1],free.id,free.publishedVersion,'Free Account',clock,null);db.prepare('INSERT OR IGNORE INTO commerce_assets VALUES(?,?,?,?,?,?,?)').run('mvp-plan-'+user[0],user[0],'plan','My saved training plan','Local review plan: preview its workouts, then activate when ready.','mvp-review-fixture',clock)}
    if(!store.commerce.userDetail('DEMO-2002').effective.membershipActive){const quote=store.commerce.quotePurchase({userId:'DEMO-2002',productId:monthly.id,skuId:monthly.published.skus[0].id,subscriptionTimeZone:'America/Los_Angeles'});store.commerce.purchase({userId:'DEMO-2002',quoteId:quote.id,requestKey:'mvp-initial-member'})}
    const aiPack=packs.find(pack=>pack.published.credits.creditType==='AI_COACH_CREDIT')
    if(!store.commerce.userDetail('DEMO-2003').wallet.batches.some(batch=>batch.creditType==='AI_COACH_CREDIT')){const quote=store.commerce.quotePurchase({userId:'DEMO-2003',productId:aiPack.id,skuId:aiPack.published.skus[0].id});store.commerce.purchase({userId:'DEMO-2003',quoteId:quote.id,requestKey:'mvp-initial-ai-pack'})}
    const local=civil(clock,'America/Los_Angeles'),day=new Date(Date.UTC(local.year,local.month-1,local.day)),distance=(day.getUTCDay()+6)%7
    const monday=new Date(day.getTime()-(distance+7)*86400000).toISOString().slice(0,10)
    const samples=[[0,12,'cardio',92],[0,24,'strength',150],[2,42,'cardio',280],[4,30,'mind_body',190],[4,40,'strength',430],[5,62,'cardio',539]].map(([offset,minutes,type,calories])=>({date:new Date(Date.parse(monday+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10),minutes,type,calories}))
    for(const [id] of users)db.prepare('INSERT OR IGNORE INTO commerce_workout_fixtures VALUES(?,?)').run(id,JSON.stringify({weekStart:monday,timeZone:'America/Los_Angeles',goal:'health_vitality',sample:true,workouts:samples}))
    db.prepare("INSERT INTO commerce_settings VALUES('mvp-review-20261014','1')").run()
  }finally{db.close()}
}
module.exports={ensureMvpDemo}
