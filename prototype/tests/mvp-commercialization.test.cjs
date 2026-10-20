const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {randomUUID}=require('node:crypto'),{DatabaseSync}=require('node:sqlite')
const {createStore}=require('../server/store.cjs'),{ensureMvpDemo}=require('../server/mvp-demo.cjs')
const {monthBoundary,civil}=require('../server/subscription-period.cjs'),{buildReport}=require('../server/weekly-report.cjs')
const runtime=path.resolve(__dirname,'../runtime')
function fixture(t,initial='2026-10-14T00:00:00.000Z'){
  fs.mkdirSync(runtime,{recursive:true});const filename=path.join(runtime,'mvp-test-'+randomUUID()+'.sqlite');let clock=initial
  const store=createStore(filename,()=>clock);ensureMvpDemo(store,filename,()=>clock)
  const db=new DatabaseSync(filename),c=store.commerce
  t.after(()=>{db.close();store.close();for(const suffix of ['','-wal','-shm'])fs.rmSync(filename+suffix,{force:true})})
  return {store,c,db,advance:value=>{clock=value},record:(entity,code)=>c.configList(entity).find(row=>row.code===code)}
}
const account=(c,user,type)=>c.userDetail(user).wallet.accounts.find(row=>row.code===type)
const grant=(c,user,type,amount,days=null)=>c.issueCredits({userId:user,creditType:type,amount,validityDays:days,reason:'Isolated review verification',requestKey:randomUUID()}).batch
const reject=(work,reason)=>assert.throws(work,error=>error.reason===reason)
function buy(c,user,record,tz='America/Los_Angeles'){const quote=c.quotePurchase({userId:user,productId:record.id,skuId:record.published.skus[0].id,subscriptionTimeZone:tz});return c.purchase({userId:user,quoteId:quote.id,requestKey:randomUUID()})}
function invoke(c,user,purpose,message='Help me plan my training',outcome='succeeded',objectKey='fixture-workout'){
  const result=c.quoteService({userId:user,serviceId:purpose,objectKey});assert.ok(result.quote,JSON.stringify(result.decision))
  const request=c.startService({userId:user,quoteId:result.quote.id,message,acceptOverage:true,requestKey:randomUUID()})
  return {quote:result.quote,request,finished:c.finishService(request.id,outcome)}
}
function publish(c,entity,record,input){const draft=c.configSave(entity,record.id,{...record.published,...input},record.revision);return c.configPublish(entity,record.id,draft.revision)}

test('MVP catalog is exactly five content, three feature, two credit items',t=>{
  const {store}=fixture(t),catalog=store.catalog();assert.equal(catalog.length,10)
  assert.deepEqual(catalog.filter(row=>row.type==='content_access').map(row=>row.code).sort(),['challenge_access','course_access','movement_access','training_program_access','world_tour_access'])
  assert.equal(catalog.filter(row=>row.type==='feature_access').length,3);assert.equal(catalog.filter(row=>row.type==='consumable_credits').length,2)
  assert.ok(!catalog.some(row=>['ai_coach_chat','human_coach_credits'].includes(row.code)))
  reject(()=>store.create({modelVersion:2,name:'Invalid credits feature',code:'invalid_credits_feature',type:'additional',status:'active',description:'',items:[{code:'ai_coach_credits'}],creditGrants:[]}),'INVALID_CONFIG')
})

test('Storefront exposes owned order and redemption history without creating transactions',t=>{
  const {c}=fixture(t),before=c.userDetail('DEMO-1002'),view=c.storefront('DEMO-1002'),after=c.userDetail('DEMO-1002')
  assert.deepEqual(view.redemptions,before.redemptions);assert.ok(view.redemptions.length>0);assert.ok(view.redemptions.every(row=>row.userId==='DEMO-1002'));assert.deepEqual(view.orders,before.orders);assert.deepEqual(after,before)
})
test('three feature services execute with no credit reservation or charge',t=>{
  const {c}=fixture(t),before=c.userDetail('DEMO-2002')
  for(const service of ['deep_analysis','weekly_insight','plan_activate']){const result=invoke(c,'DEMO-2002',service,'');assert.equal(result.quote.billingSource,'feature');assert.equal(result.finished.credits,0);assert.deepEqual(result.request.allocations,[])}
  const after=c.userDetail('DEMO-2002');assert.deepEqual(after.wallet,before.wallet);assert.deepEqual(after.ledger,before.ledger)
  assert.equal(c.access({userId:'DEMO-2001',serviceId:'deep_analysis'}).reason,'ENTITLEMENT_REQUIRED')
})
test('free weekly statistics and share data stay available; personalized body is gated',t=>{
  const {c}=fixture(t),before=c.userDetail('DEMO-2001').wallet,free=c.weeklyReport('DEMO-2001'),paid=c.weeklyReport('DEMO-2002')
  assert.equal(free.stats.workouts,6);assert.equal(free.stats.time,210);assert.equal(free.stats.activeDays,4);assert.equal(free.stats.calories,1681)
  assert.equal(free.insight.allowed,false);assert.equal(free.insight.body,null);assert.ok(paid.insight.body)
  assert.deepEqual(free.daily,paid.daily);assert.deepEqual(free.recommend,[100,60,40]);assert.equal(free.read,false)
  c.readWeeklyReport({userId:'DEMO-2001',reportId:free.id});assert.equal(c.weeklyReport('DEMO-2001').read,true);assert.deepEqual(c.userDetail('DEMO-2001').wallet,before)
})
test('weekly eligibility and aggregation exclude other weeks and invalid workouts',()=>{
  const input={weekStart:'2026-10-05',timeZone:'America/Los_Angeles',workouts:[{date:'2026-09-01',minutes:20,calories:100},{date:'2026-09-02',minutes:20,calories:100}]}
  assert.equal(buildReport(input).available,false)
  input.workouts.push({date:'2026-10-05',minutes:10,calories:30,type:'strength'},{date:'2026-10-11',minutes:20,calories:50,type:'cardio'},{date:'2026-10-05',minutes:0,calories:500},{date:'2026-10-06',minutes:-10,calories:100})
  const report=buildReport(input);assert.equal(report.stats.workouts,2);assert.equal(report.stats.time,30);assert.equal(report.stats.calories,80);assert.equal(report.recommend,null)
})
test('free accounts can use purchased AI credits; user turns reserve and settle once',t=>{
  const {c}=fixture(t),user='DEMO-2003',gift=grant(c,user,'AI_COACH_CREDIT',3),before=account(c,user,'AI_COACH_CREDIT').available
  assert.equal(c.userDetail(user).effective.membershipActive,false)
  const result=invoke(c,user,'ai_chat');assert.equal(result.quote.creditType,'AI_COACH_CREDIT');assert.equal(result.quote.unit,'user_turn');assert.equal(result.quote.credits,2)
  assert.equal(result.request.allocations[0].batchId,gift.id,'Non-expiring purchased credits remain last even after an independent never-expiring gift')
  assert.equal(account(c,user,'AI_COACH_CREDIT').available,before-2);assert.equal(account(c,user,'CONTENT_CREDIT').available,0)
  c.finishService(result.request.id,'succeeded');assert.equal(account(c,user,'AI_COACH_CREDIT').available,before-2)
  assert.equal(c.userDetail(user).ledger.filter(row=>row.type==='SPEND'&&row.reference===result.request.id).length,1)
})
test('failed AI user turn releases the exact expiring batches without duplication',t=>{
  const {c}=fixture(t),user='DEMO-2003',soon=grant(c,user,'AI_COACH_CREDIT',1,1),later=grant(c,user,'AI_COACH_CREDIT',5,3),before=c.userDetail(user).wallet
  const result=invoke(c,user,'ai_chat','What should I do today?','failed');assert.deepEqual(result.request.allocations.map(row=>row.batchId),[soon.id,later.id])
  assert.deepEqual(c.userDetail(user).wallet,before);c.finishService(result.request.id,'failed');assert.deepEqual(c.userDetail(user).wallet,before)
  assert.equal(c.userDetail(user).ledger.filter(row=>row.type==='RELEASE'&&row.reference===result.request.id).length,1)
})
test('empty user turns and unconfigured consumption cannot reserve or debit',t=>{
  const {c,record}=fixture(t),user='DEMO-2003',before=c.userDetail(user).wallet
  const quote=c.quoteService({userId:user,serviceId:'ai_chat'}).quote
  reject(()=>c.startService({userId:user,quoteId:quote.id,message:'   ',acceptOverage:true,requestKey:randomUUID()}),'MESSAGE_REQUIRED')
  publish(c,'pricing',record('pricing','mvp_ai_chat'),{credits:null})
  const result=c.quoteService({userId:user,serviceId:'ai_chat'});assert.equal(result.quote,null);assert.equal(result.decision.reason,'CONSUMPTION_POLICY_UNDEFINED');assert.deepEqual(c.userDetail(user).wallet,before)
})
test('new Content Credit confirmation grants a permanent independent unlock',t=>{
  const {c,record,advance}=fixture(t),user='DEMO-2002',content=record('content','mvp_course_featured');grant(c,user,'CONTENT_CREDIT',40)
  assert.equal(c.access({userId:user,contentId:content.id}).reason,'REDEMPTION_REQUIRED')
  const before=account(c,user,'CONTENT_CREDIT').available,ai=account(c,user,'AI_COACH_CREDIT').available
  const response=c.quoteRedemption({userId:user,contentId:content.id});assert.equal(response.quote.creditType,'CONTENT_CREDIT');assert.equal(response.quote.validityDays,null);assert.equal(account(c,user,'CONTENT_CREDIT').available,before)
  const input={userId:user,quoteId:response.quote.id,requestKey:randomUUID()},unlock=c.redeem(input);assert.equal(unlock.expiresAt,null);assert.equal(c.redeem(input).id,unlock.id)
  assert.equal(account(c,user,'CONTENT_CREDIT').available,before-30);assert.equal(account(c,user,'AI_COACH_CREDIT').available,ai)
  advance('2027-12-01T00:00:00.000Z');assert.equal(c.userDetail(user).effective.membershipActive,false);assert.equal(c.access({userId:user,contentId:content.id}).allowed,true)
  assert.equal(c.quoteRedemption({userId:user,contentId:content.id}).alreadyRedeemed,true)
})
test('content price undefined and insufficient Content balance do not use AI balance',t=>{
  const {c,record}=fixture(t),content=record('content','mvp_course_featured'),user='DEMO-2003'
  const denied=c.quoteRedemption({userId:user,contentId:content.id});assert.equal(denied.reason,'CREDITS_INSUFFICIENT');assert.equal(denied.available,0);assert.equal(denied.creditType,'CONTENT_CREDIT')
  publish(c,'content',content,{redemptionCredits:null});assert.equal(c.quoteRedemption({userId:user,contentId:content.id}).reason,'CONSUMPTION_POLICY_UNDEFINED')
})
test('Movement Start and Program Select use explicit scopes; Challenge joins only record participation',t=>{
  const {c,record,advance}=fixture(t),movement=record('content','mvp_movement'),program=record('content','mvp_program'),challenge=record('content','mvp_limited_challenge')
  assert.equal(c.access({userId:'DEMO-2001',contentId:movement.id}).allowed,true);assert.equal(c.access({userId:'DEMO-2001',contentId:program.id}).allowed,false)
  reject(()=>c.joinChallenge({userId:'DEMO-2001',contentId:challenge.id,requestKey:randomUUID()}),'ENTITLEMENT_REQUIRED')
  const before=c.userDetail('DEMO-2002'),input={userId:'DEMO-2002',contentId:challenge.id,requestKey:randomUUID()},joined=c.joinChallenge(input)
  assert.equal(c.joinChallenge({...input,requestKey:randomUUID()}).id,joined.id);assert.deepEqual(c.userDetail('DEMO-2002').wallet,before.wallet);assert.deepEqual(c.userDetail('DEMO-2002').assets,before.assets)
  advance('2026-11-01T00:00:00.000Z');reject(()=>c.joinChallenge({userId:'DEMO-2003',contentId:challenge.id,requestKey:randomUUID()}),'CHALLENGE_CLOSED')
})
test('Challenge opening offsets are normalized before comparison',t=>{
  const {c,record}=fixture(t),item=record('content','mvp_limited_challenge')
  const updated=publish(c,'content',item,{challengeRules:{startsAt:'2026-10-14T09:00:00+09:00',endsAt:'2026-10-15T09:00:00+09:00',target:'Actual challenge target'}})
  assert.equal(updated.published.challengeRules.startsAt,'2026-10-14T00:00:00.000Z')
  assert.ok(c.joinChallenge({userId:'DEMO-2002',contentId:item.id,requestKey:randomUUID()}).id)
})
test('Additional access unions with Base while campaign credits retain their source',t=>{
  const {store,c}=fixture(t),draft=store.create({modelVersion:2,policyVersion:20261014,name:'Report campaign access',code:'report_campaign_access',type:'additional',status:'active',description:'',items:[{code:'weekly_report_ai_insight'}],creditGrants:[{creditType:'CONTENT_CREDIT',amount:4,cadence:'one_time',expiration:'days',validityDays:3}]}),suit=store.publish(draft.id,draft.revision)
  const campaign=c.configCreate('campaigns',{name:'Access and credit fixture',code:'access_credit_fixture',status:'active',description:'',kind:'campaign',suitId:suit.id,grantDurationDays:7,creditType:'AI_COACH_CREDIT',creditAmount:3,creditValidityDays:3,maxRecipients:10,startsAt:null,endsAt:null});c.configPublish('campaigns',campaign.id,campaign.revision)
  const input={campaignId:campaign.id,userIds:['DEMO-2001'],reason:'Explicit isolated campaign verification',requestKey:randomUUID()};c.runCampaign(input);c.runCampaign({...input,requestKey:randomUUID()})
  assert.equal(c.weeklyReport('DEMO-2001').insight.allowed,true);assert.equal(c.access({userId:'DEMO-2001',serviceId:'deep_analysis'}).allowed,false)
  assert.equal(account(c,'DEMO-2001','CONTENT_CREDIT').available,4);assert.equal(account(c,'DEMO-2001','AI_COACH_CREDIT').available,3)
  assert.ok(c.userDetail('DEMO-2001').wallet.batches.every(row=>row.source==='campaign'))
})
test('original subscription date survives month-end, leap year and DST',()=>{
  assert.equal(monthBoundary('2027-01-31T20:00:00.000Z',1,'America/Los_Angeles'),'2027-02-28T20:00:00.000Z')
  assert.equal(monthBoundary('2027-01-31T20:00:00.000Z',2,'America/Los_Angeles'),'2027-03-31T19:00:00.000Z')
  assert.equal(monthBoundary('2028-01-31T20:00:00.000Z',1,'America/Los_Angeles'),'2028-02-29T20:00:00.000Z')
  assert.equal(civil(monthBoundary('2027-01-31T20:00:00.000Z',2,'America/Los_Angeles'),'America/Los_Angeles').hour,12)
})
test('successive monthly renewals retain timezone and original month-end anchor',t=>{
  const {c,record,advance}=fixture(t,'2027-01-31T20:00:00.000Z');buy(c,'DEMO-2001',record('products','mvp_premium_monthly'))
  let sub=c.userDetail('DEMO-2001').subscriptions.find(row=>row.grant.status==='active');assert.equal(sub.grant.expiresAt,'2027-02-28T20:00:00.000Z')
  advance(sub.grant.expiresAt);c.renewDemo(sub.id,{periodEnd:sub.grant.expiresAt,requestKey:randomUUID()});sub=c.userDetail('DEMO-2001').subscriptions.find(row=>row.id===sub.id)
  assert.equal(sub.subscriptionTimeZone,'America/Los_Angeles');assert.equal(sub.grant.expiresAt,'2027-03-31T19:00:00.000Z')
  advance(sub.grant.expiresAt);c.renewDemo(sub.id,{periodEnd:sub.grant.expiresAt,requestKey:randomUUID()});sub=c.userDetail('DEMO-2001').subscriptions.find(row=>row.id===sub.id)
  assert.equal(sub.grant.expiresAt,'2027-04-30T19:00:00.000Z');assert.equal(sub.subscriptionTimeZone,'America/Los_Angeles')
})
test('annual billing still refreshes monthly with no gift rollover or purchased expiry',t=>{
  const {c,record,advance}=fixture(t);grant(c,'DEMO-2001','AI_COACH_CREDIT',50);buy(c,'DEMO-2001',record('products','mvp_premium_annual'))
  assert.equal(account(c,'DEMO-2001','AI_COACH_CREDIT').available,150)
  advance('2026-11-14T01:00:01.000Z');assert.equal(account(c,'DEMO-2001','AI_COACH_CREDIT').available,150)
  const batches=c.userDetail('DEMO-2001').wallet.batches.filter(row=>row.creditType==='AI_COACH_CREDIT');assert.equal(batches.length,3);assert.equal(batches.filter(row=>row.status==='expired').length,1);assert.equal(batches.find(row=>row.source==='compensation').expiresAt,null)
})
test('old contracts and catalog remain unchanged after typed credit grants',t=>{
  const {c}=fixture(t),before=c.storefront('DEMO-1003');grant(c,'DEMO-1003','AI_COACH_CREDIT',10)
  const after=c.storefront('DEMO-1003');assert.deepEqual(after.effective,before.effective);assert.deepEqual(after.contents,before.contents);assert.deepEqual(after.products,before.products);assert.equal(after.policyVersion,null)
})
test('current personalized assets remain permission-gated after membership expires',t=>{
  const {c}=fixture(t),result=invoke(c,'DEMO-2002','deep_analysis','')
  assert.ok(c.getAsset('DEMO-2002',result.finished.assetId).body);c.expireDemo({userId:'DEMO-2002'})
  const asset=c.storefront('DEMO-2002').assets.find(row=>row.id===result.finished.assetId);assert.equal(asset.body,null);assert.equal(asset.locked,true)
  reject(()=>c.getAsset('DEMO-2002',asset.id),'ENTITLEMENT_REQUIRED');assert.equal(c.weeklyReport('DEMO-2002').available,true)
})
test('upgrade settlement remains explicitly open and cannot create a new payment',t=>{
  const {c,record}=fixture(t),before=c.userDetail('DEMO-2002').orders
  reject(()=>c.quotePurchase({userId:'DEMO-2002',productId:record('products','mvp_premium_annual').id,skuId:record('products','mvp_premium_annual').published.skus[0].id}),'UPGRADE_SETTLEMENT_UNDEFINED')
  assert.deepEqual(c.userDetail('DEMO-2002').orders,before)
  reject(()=>grant(c,'DEMO-2001','HUMAN_COACH_CREDIT',10),'CREDIT_TYPE_NOT_IN_MVP')
})
