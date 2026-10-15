const {experiment,scenarioById,resolveVariant}=require('./scenarios/registry.cjs')
const prefix='sunnyfit-ui-lab:v1:'
function clone(value){return JSON.parse(JSON.stringify(value))}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function createRun({id,scenarioId,storefront,createdAt}){
  const scenario=scenarioById(scenarioId)
  if(scenario.id!==scenarioId||storefront.user.id!==scenario.userId)throw Error('Scenario and account do not match.')
  return freeze({schemaVersion:1,id,scenarioId,experimentId:experiment.id,experimentVersion:experiment.version,createdAt,storefront:clone(storefront)})
}
function saveRun(storage,run){storage.setItem(prefix+'run:'+run.id,JSON.stringify(run))}
function readRun(storage,id){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id||''))return null
  try{const run=JSON.parse(storage.getItem(prefix+'run:'+id));if(!run||run.schemaVersion!==1||run.id!==id||run.experimentId!==experiment.id||run.experimentVersion!==experiment.version||!run.createdAt)return null;return createRun(run)}catch(_){return null}
}
function appendEvent(storage,event){
  // Events contain navigation and timings only, never chat inputs or raw account payloads.
  const allowed=['id','runId','attemptId','experimentId','experimentVersion','scenarioId','variant','type','screen','target','at','elapsedMs']
  const saved=Object.fromEntries(allowed.filter(k=>event[k]!==undefined).map(k=>[k,event[k]]))
  saved.id=saved.id||globalThis.crypto.randomUUID()
  // Each observation has its own key: concurrent A/B tabs cannot overwrite a shared array.
  storage.setItem(prefix+'event:'+event.runId+':'+saved.id,JSON.stringify(saved));return readEvents(storage,event.runId)
}
function eventKeys(storage,runId){const start=prefix+'event:'+runId+':',keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&key.startsWith(start))keys.push(key)}return keys}
function readEvents(storage,runId){return eventKeys(storage,runId).flatMap(key=>{try{const event=JSON.parse(storage.getItem(key));return event&&event.runId===runId?[event]:[]}catch(_){return []}}).sort((a,b)=>(a.at||'').localeCompare(b.at||''))}
function clearEvents(storage,runId){eventKeys(storage,runId).forEach(key=>storage.removeItem(key))}
function labQuery(run,variant,extra={}){return {...extra,run:run.id,scenario:run.scenarioId,variant:resolveVariant(variant)}}
function summarize(events){
  return ['A','B'].map(variant=>{
    const own=events.filter(e=>e.variant===variant),starts=own.filter(e=>e.type==='task_started'),completed=own.filter(e=>e.type==='task_completed')
    const completedIds=new Set(completed.map(e=>e.attemptId)),times=completed.map(e=>e.elapsedMs).filter(Number.isFinite).sort((a,b)=>a-b)
    const mid=Math.floor(times.length/2),median=times.length?(times.length%2?times[mid]:(times[mid-1]+times[mid])/2):null
    const abortedIds=new Set(own.filter(e=>e.type==='task_aborted').map(e=>e.attemptId))
    return {variant,started:starts.length,completed:completedIds.size,aborted:abortedIds.size,pending:starts.filter(e=>!completedIds.has(e.attemptId)&&!abortedIds.has(e.attemptId)).length,medianMs:median}
  })
}
module.exports={createRun,saveRun,readRun,appendEvent,readEvents,clearEvents,labQuery,summarize}
