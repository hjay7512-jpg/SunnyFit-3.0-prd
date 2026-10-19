// Presentation adapter for the October MVP. Review overrides never modify account data.
export function membershipView(data, query = {}) {
  const subscriptions = data.subscriptions || []
  const current = subscriptions.find(s => s.grant && s.grant.status === 'active')
  const ended = subscriptions.filter(s => s.grant && s.grant.status === 'expired').sort((a,b) => new Date(b.grant.expiresAt)-new Date(a.grant.expiresAt))[0]
  const actual = data.effective.membershipActive ? (current && !current.autoRenew ? 'canceled' : 'active') : ended ? 'expired' : 'free'
  const preview = ['free','active','canceled','expired'].includes(query.membershipState)
  const state = preview ? query.membershipState : actual
  const active = state === 'active' || state === 'canceled'
  const allowance = ((data.wallet || {}).includedUsage || []).find(r => r.serviceId === 'ai_chat')
  const account = ((data.wallet || {}).accounts || []).find(row=>row.code==='AI_COACH_CREDIT')
  const batches = ((data.wallet || {}).batches || []).filter(row=>row.creditType==='AI_COACH_CREDIT'&&row.status==='active')
  const issued = batches.reduce((sum,row)=>sum+(Number(row.original)||0),0)
  const available = batches.reduce((sum,row)=>sum+(Number(row.available)||0),0)
  const walletPercent = issued>0?Math.max(0,Math.min(100,Math.round(available/issued*100))):account&&account.available===0?0:null
  const rawPercent = typeof query.chatRemaining === 'string' && query.chatRemaining.trim() !== '' ? Number(query.chatRemaining) : NaN
  const percent = preview && Number.isFinite(rawPercent) ? Math.max(0,Math.min(100,Math.round(rawPercent))) : allowance && allowance.amount > 0 ? Math.max(0,Math.min(100,Math.round(allowance.remaining / allowance.amount * 100))) : walletPercent
  const unlimited = preview && query.allowanceMode === 'campaign'
  const campaignEndsAt = unlimited ? '2026-10-23T12:00:00Z' : null
  const expiry = preview ? state === 'expired' ? '2026-10-15T12:00:00Z' : active ? query.membershipCycle==='annual'?'2027-10-16T12:00:00Z':'2026-11-16T12:00:00Z' : null : active ? (current && current.grant.expiresAt) || data.effective.base.expiresAt : ended && ended.grant.expiresAt
  return {state, active, preview, percent, unlimited, campaignEnded:preview&&query.allowanceMode==='ended',campaignEndsAt, expiry, resetAt: !preview && allowance && allowance.resetAt, subscription:current, tier:active?'Premium':'Free', label:state==='expired'?'Premium expired':state==='canceled'?'Renewal off':active?'Active':'Free account'}
}

export function membershipDate(value, locale = 'en-US') {
  return value && Number.isFinite(new Date(value).getTime()) ? new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value)) : ''
}
