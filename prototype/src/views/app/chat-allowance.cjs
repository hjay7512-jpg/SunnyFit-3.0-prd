const THRESHOLDS=[20,10,5]
function allowanceReminder(percent,seen=[]){
  if(typeof percent!=='number'||!Number.isFinite(percent)||percent<=0)return null
  const crossed=THRESHOLDS.filter(value=>percent<=value),threshold=crossed[crossed.length-1]
  return threshold&&!seen.includes(threshold)?{threshold,percent,seen:[...new Set([...seen,...crossed])]}:null
}
function creditOffers(data={}){
  const channel=(data.subscriptionOffer||{}).channel||'web_demo',currency=(data.subscriptionOffer||{}).currency
  return (data.products||[]).filter(p=>p.status==='active'&&p.kind==='credits'&&p.credits&&p.credits.creditType==='AI_COACH_CREDIT'&&p.credits.validityDays===null&&Number.isInteger(p.credits.amount)&&p.credits.amount>0).flatMap(product=>(product.skus||[]).filter(sku=>sku.status==='active'&&sku.channel===channel&&sku.billingPeriod==='one_time'&&Number.isInteger(sku.priceCents)&&sku.priceCents>=0&&sku.currency&&(!currency||sku.currency===currency)).map(sku=>({product,sku,offerId:product.id+':'+sku.id})))
}
function sameCreditOffer(a,b){return !!(a&&b&&a.offerId===b.offerId&&a.sku.id===b.sku.id&&a.sku.channel===b.sku.channel&&a.sku.currency===b.sku.currency&&a.sku.priceCents===b.sku.priceCents&&a.product.credits.amount===b.product.credits.amount)}
module.exports={THRESHOLDS,allowanceReminder,creditOffers,sameCreditOffer}
