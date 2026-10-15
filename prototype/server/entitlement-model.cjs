const legacyCatalog = require('./catalog.cjs')
const CREDIT_TYPES = [
  { code: 'AI_COACH_CREDIT', name: 'AI Coach Credits', itemCode: 'ai_coach_credits' },
  { code: 'HUMAN_COACH_CREDIT', name: 'Human Coach Credits', itemCode: 'human_coach_credits', future: true },
  { code: 'CONTENT_CREDIT', name: 'Content Credits', itemCode: 'content_credits' },
  { code: 'LEGACY_CREDIT', name: 'Legacy Credits', legacy: true }
]
const POLICY_VERSION = 20261014
const CONTENT_CODES = ['course_access', 'world_tour_access', 'training_program_access', 'movement_access', 'challenge_access']
const FEATURE_CODES = ['dynamic_plan', 'workout_result_ai_insight', 'weekly_report_ai_insight']
const CONTENT_DEFINITIONS = [
  ...legacyCatalog.filter(item => CONTENT_CODES.includes(item.code)),
  {code:'movement_access',name:'Movement Access',status:'supported',description:'Use an enabled movement. Access is checked at Start.',checkAt:'Start',scopes:[{code:'free_content',label:'Free Content'}]},
  {code:'challenge_access',name:'Challenge Access (Limited Challenge)',status:'supported',description:'Join a specified limited Challenge. Challenge timing, goals, progress and rewards remain part of Challenge business rules.',checkAt:'Join',scopes:[{code:'limited_challenge',label:'Limited Challenges'}]}
]
function createEntitlementModel({ db, now, fail, transaction, audit }) {
  db.exec(`CREATE TABLE IF NOT EXISTS entitlement_credit_types(code TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS entitlement_content_scopes(item_code TEXT NOT NULL,code TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(item_code,code));`)
  for (const type of CREDIT_TYPES) db.prepare('INSERT OR IGNORE INTO entitlement_credit_types VALUES(?,?)').run(type.code, JSON.stringify(type))
  for (const code of CONTENT_CODES) {
    for (const scope of [...CONTENT_DEFINITIONS.find(item=>item.code===code).scopes.filter(scope=>scope.code!=='all'), ...(code==='challenge_access'?[]:[{ code:'premium_content', label:'Premium Content' }])]) {
      db.prepare('INSERT OR IGNORE INTO entitlement_content_scopes VALUES(?,?,?,?,?)').run(code,scope.code,scope.label,'active',1)
    }
  }
  const creditTypes = () => db.prepare('SELECT payload FROM entitlement_credit_types ORDER BY rowid').all().map(row=>{const type=JSON.parse(row.payload);return {...type,...CREDIT_TYPES.find(known=>known.code===type.code)}})
  const scopes = (code, activeOnly=false) => db.prepare('SELECT item_code AS entitlementCode,code,name,status,revision FROM entitlement_content_scopes ORDER BY rowid').all().filter(scope=>(!code||scope.entitlementCode===code)&&(!activeOnly||scope.status==='active'))
  const catalog = () => [...[...CONTENT_DEFINITIONS,...legacyCatalog.filter(item=>FEATURE_CODES.includes(item.code))].map(item=>({
    code:item.code,name:item.name,status:item.status,description:item.description,checkAt:item.checkAt,
    type:CONTENT_CODES.includes(item.code)?'content_access':'feature_access',
    category:CONTENT_CODES.includes(item.code)?'Content Access':'Feature Access',
    scopes:CONTENT_CODES.includes(item.code)?scopes(item.code,true).map(scope=>({code:scope.code,label:scope.name})):[],
    ...(item.code==='weekly_report_ai_insight'?{checkAt:'View AI Insight',description:'Personalized weekly insights. Base statistics and template summaries stay free. No Credits are charged.'}:item.code==='workout_result_ai_insight'?{checkAt:'Generate / View AI Insight',description:'Automatic workout analysis. Basic workout results and feedback stay free. No Credits are charged.'}:{})
  })), ...creditTypes().filter(type=>!type.legacy&&!type.future).map(type=>({code:type.itemCode,name:type.name,type:'consumable_credits',category:'Consumable Credits',creditType:type.code,scopes:[],status:'supported',checkAt:type.code==='AI_COACH_CREDIT'?'User Turn':'Confirm redemption',description:type.code==='AI_COACH_CREDIT'?'User-initiated open-ended Coach requests. Reserve by User Turn; actual request failure releases the original credits.':'Confirm a premium content redemption. Charge once on success and retain a permanent independent unlock.'}))]
  function saveScope(input, expected) {
    return transaction(()=>{
      if(!input||typeof input!=='object'||Array.isArray(input)) fail(400,'INVALID_SCOPE','A content scope configuration is required.')
      const existing=db.prepare('SELECT * FROM entitlement_content_scopes WHERE item_code=? AND code=?').get(input.entitlementCode,input.code)
      if (!CONTENT_CODES.includes(input.entitlementCode)||!/^[a-z][a-z0-9_]{2,63}$/.test(input.code||'')||input.code==='all'||typeof input.name!=='string'||!input.name.trim()||input.name.length>80||!['active','disabled'].includes(input.status)) fail(400,'INVALID_SCOPE','Choose a content entitlement, a unique scope code, a name and status. ALL is not a content scope.')
      if (expected===undefined && existing) fail(409,'SCOPE_EXISTS','This content scope already exists.')
      if (expected!==undefined && (!existing||existing.revision!==expected)) fail(409,'CONFIG_CHANGED','Scope changed. Reload before saving.')
      if (existing) db.prepare('UPDATE entitlement_content_scopes SET name=?,status=?,revision=revision+1 WHERE item_code=? AND code=?').run(input.name.trim(),input.status,input.entitlementCode,input.code)
      else db.prepare('INSERT INTO entitlement_content_scopes VALUES(?,?,?,?,?)').run(input.entitlementCode,input.code,input.name.trim(),input.status,1)
      audit('CONTENT_SCOPE_SAVED',input.entitlementCode+':'+input.code,{...input,revision:existing?existing.revision+1:1})
      return scopes(input.entitlementCode).find(scope=>scope.code===input.code)
    })
  }
  function normalizeSuit(input) {
    const result=JSON.parse(JSON.stringify(input))
    if (result.modelVersion===2&&result.policyVersion===POLICY_VERSION) return result
    result.modelVersion=2
    result.policyVersion=POLICY_VERSION
    result.includedServices=[]
    result.items=result.items.filter(spec=>CONTENT_CODES.includes(spec.code)||FEATURE_CODES.includes(spec.code)).map(spec=>CONTENT_CODES.includes(spec.code)?{code:spec.code,scopes:(spec.scopes||[]).includes('all')?scopes(spec.code,true).map(scope=>scope.code):spec.scopes}:{code:spec.code})
    result.creditGrants=(result.creditGrants||[]).filter(rule=>['AI_COACH_CREDIT','CONTENT_CREDIT'].includes(rule.creditType)).map(rule=>result.type==='base'?{...rule,cadence:'monthly',expiration:'grant_period'}:rule)
    delete result.creditBenefit
    return result
  }
  return { catalog,creditTypes,scopes,saveScope,normalizeSuit,validCreditType:code=>creditTypes().some(type=>type.code===code),activeCreditType:code=>creditTypes().some(type=>type.code===code&&!type.legacy&&!type.future),isContent:code=>CONTENT_CODES.includes(code) }
}
module.exports={createEntitlementModel,CREDIT_TYPES,CONTENT_CODES,FEATURE_CODES,POLICY_VERSION}
