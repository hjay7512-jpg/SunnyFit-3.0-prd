const goalCopy={
  'weight-loss':{title:'Weight Loss Plan',label:'Weight Loss',summary:'Low-impact cardio and strength, built around short, manageable sessions.',stageNames:['Awakening','Ignition','Metabolic Shift'],sessions:['Low-impact cardio','Full-body strength','Cardio & mobility','Strength & balance','Easy endurance']},
  fitness:{title:'Fitness Habit Plan',label:'Fitness',summary:'A balanced mix of cardio, strength and mobility to build a regular routine.',stageNames:['Awakening','Momentum','Consistency'],sessions:['Cardio & mobility','Full-body strength','Easy endurance','Strength & balance','Mobility & core']},
  strength:{title:'Strength Plan',label:'Strength',summary:'Full-body strength sessions with room to recover between workouts.',stageNames:['Foundation','Build','Progression'],sessions:['Full-body strength','Strength & core','Full-body strength','Strength & balance','Strength & mobility']}
}
const weekPatterns={3:[0,2,4],4:[0,1,3,5],5:[0,1,2,4,5]},weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
function createDynamicPlan(request,context={}){
  if(!request||!goalCopy[request.goal]||![3,4,5].includes(request.days)||![15,30,45].includes(request.minutes)||!context.ownerId)return null
  const copy=goalCopy[request.goal],days=weekPatterns[request.days],durations=['3–7 days','2–3 weeks','From week 4']
  const focuses=[
    request.goal==='strength'?'Practise the main movements and establish a comfortable starting point.':'Start with approachable sessions and build your training routine.',
    request.goal==='strength'?'Build on the main movements with focused strength sessions.':'Keep a steady mix of cardio and strength across your training days.',
    request.goal==='fitness'?'Keep your routine consistent and review what fits your week.':'Review your sessions with AI Coach and adapt the next stage.'
  ]
  return {schemaVersion:1,id:context.id||'plan-'+context.messageId,ownerId:context.ownerId,messageId:context.messageId||'review-plan',createdAt:context.createdAt||new Date().toISOString(),status:context.status==='active'?'active':'draft',...(context.activatedAt?{activatedAt:context.activatedAt}:{}),goal:request.goal,days:request.days,minutes:request.minutes,title:copy.title,goalLabel:copy.label,summary:copy.summary.replace('short, manageable',request.minutes+'-minute'),
    stages:copy.stageNames.map((name,i)=>({id:'stage-'+(i+1),number:i+1,name,period:durations[i],focus:focuses[i]})),
    firstWeek:weekdays.map((label,index)=>{const position=days.indexOf(index);return {day:label,training:position!==-1,title:position===-1?'Recovery':copy.sessions[position],minutes:position===-1?null:request.minutes}})
  }
}
function restoreDynamicPlan(candidate,ownerId){
  if(!candidate||candidate.ownerId!==ownerId||typeof candidate.id!=='string'||!candidate.id||candidate.id.length>160||!['draft','active'].includes(candidate.status))return null
  return createDynamicPlan(candidate,{...candidate,ownerId})
}
function readDynamicPlans(payload,ownerId){
  if(!payload||payload.schemaVersion!==1||payload.ownerId!==ownerId)return {draft:null,active:null}
  const draft=restoreDynamicPlan(payload.draft,ownerId),active=restoreDynamicPlan(payload.active,ownerId)
  return {draft:draft&&draft.status==='draft'?draft:null,active:active&&active.status==='active'?active:null}
}
module.exports={createDynamicPlan,restoreDynamicPlan,readDynamicPlans}
