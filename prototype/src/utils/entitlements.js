export const entitlementTypeLabel = type => ({content_access:'Content Access',feature_access:'Feature Access',consumable_credits:'Consumable Credits'}[type]||type)
export const creditTypeLabel = code => ({AI_COACH_CREDIT:'AI Coach Credits',HUMAN_COACH_CREDIT:'Human Coach Credits',CONTENT_CREDIT:'Content Credits',LEGACY_CREDIT:'Legacy Credits'}[code]||code)
export const expirationLabel = rule => ({membership_cycle:'Membership cycle end',grant_period:rule.cadence==='monthly'?'Expires at the next monthly refresh':'Expires at the end of this grant',never:'No expiry',days:rule.validityDays+' days after grant'}[rule.expiration]||'Original expiration')
export const creditGrantLabel = rule => `${rule.amount} ${creditTypeLabel(rule.creditType)} · ${{monthly:'Monthly',billing_cycle:'Per membership cycle',one_time:'One time'}[rule.cadence]||rule.cadence} · ${expirationLabel(rule)}`
export function normalizeSuit(config,catalog) {
  const result=JSON.parse(JSON.stringify(config))
  result.includedServices=result.includedServices||[]
  if(result.modelVersion===2&&result.policyVersion===20261014)return result
  result.modelVersion=2
  result.policyVersion=20261014
  result.includedServices=[]
  result.items=result.items.filter(spec=>catalog.some(item=>item.code===spec.code&&item.type!=='consumable_credits')).map(spec=>{
    const definition=catalog.find(item=>item.code===spec.code)
    return definition&&definition.type==='content_access'?{code:spec.code,scopes:spec.scopes.includes('all')?definition.scopes.map(scope=>scope.code):spec.scopes}:{code:spec.code}
  })
  result.creditGrants=(result.creditGrants||[]).filter(grant=>['AI_COACH_CREDIT','CONTENT_CREDIT'].includes(grant.creditType)).map(grant=>result.type==='base'?{...grant,cadence:'monthly',expiration:'grant_period'}:grant)
  delete result.creditBenefit
  return result
}
