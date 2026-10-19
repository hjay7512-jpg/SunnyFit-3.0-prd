// The same single-tier catalog is used by account entry and contextual purchase.
export function premiumOffers(data) {
  const products=(data?.products||[]).filter(p=>p.kind==='membership'&&p.status==='active')
  const preferred=products.find(p=>p.benefits?.code==='mvp_premium')||products.find(p=>/premium/i.test(p.name))
  if(!preferred)return []
  const seen=new Set()
  return products.filter(p=>p.suitId===preferred.suitId).flatMap(product=>(product.skus||[]).filter(sku=>sku.status==='active'&&['monthly','annual'].includes(sku.billingPeriod)).map(sku=>({product,sku}))).sort((a,b)=>Number(a.sku.billingPeriod==='annual')-Number(b.sku.billingPeriod==='annual')).filter(offer=>{const period=offer.sku.billingPeriod;if(seen.has(period))return false;seen.add(period);return true})
}

export function premiumActivationQuery(query,cycle,fresh=!['active','canceled'].includes(query.membershipState)) {
  // Owner confirmed: first Free -> Premium purchase grants a fresh finite allowance.
  return {...query,membershipState:'active',membershipCycle:cycle,chatRemaining:fresh?'100':query.chatRemaining}
}
