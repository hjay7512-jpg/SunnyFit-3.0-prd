const orderTypes=[{value:'subscription',label:'Subscription'},{value:'points-exchange',label:'Points Exchange'},{value:'star-content',label:'Star Content'}]
const orderType=value=>orderTypes.some(item=>item.value===value)?value:'subscription'
const contentType=value=>({course:'Course',world_tour:'World Tour',training_program:'Training Program',movement:'Movement'})[value]||'Content'
function paymentRecord(order){
  const product=order.product||{},sku=order.sku||{},credits=product.kind==='credits'
  return {id:order.id,category:'subscription',title:product.name||'Purchase',subtitle:credits?'One-time credit purchase':sku.billingPeriod==='annual'?'Annual subscription':'Monthly subscription',icon:credits?'coach':'membership',status:({paid:order.fulfillment==='completed'?'Completed':'Processing',applied:'Applied',scheduled:'Scheduled',canceled:'Canceled',failed:'Payment failed'})[order.status]||'Processing',date:order.createdAt,amount:sku.priceCents,currency:sku.currency||'USD',unit:'money',startsAt:order.status==='scheduled'?order.startsAt:null,note:order.status==='scheduled'?'No charge today.':null}
}
function contentRecord(record,contents){
  const content=contents.find(item=>item.id===record.contentId)
  return {id:record.id,category:'star-content',title:record.name||(content&&content.name)||'Star Content',subtitle:contentType(record.contentType),icon:'play',image:content&&content.coverUrl||null,status:record.status==='expired'?'Expired':'Unlocked',date:record.createdAt,amount:record.source==='legacy_star'?null:record.credits,unit:record.source==='legacy_star'?'legacy':record.creditType==='CONTENT_CREDIT'?'Content Credits':'Credits',expiresAt:record.expiresAt,source:record.source}
}
function orderRecords(data,type){
  const owner=data.user.id,own=record=>record.userId===owner
  const records=type==='subscription'?(data.orders||[]).filter(own).filter(order=>['membership','credits'].includes(order.product&&order.product.kind)).map(paymentRecord):type==='star-content'?(data.redemptions||[]).filter(own).map(record=>contentRecord(record,data.contents||[])):[]
  return records.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))
}
function reviewOrderRecords(type){
  const date='2026-10-18T10:30:00Z'
  if(type==='subscription')return [
    {id:'EXAMPLE-SUB-1024',category:type,title:'SunnyFit Premium',subtitle:'Annual subscription',icon:'membership',status:'Completed',date,amount:7999,currency:'USD',unit:'money'},
    {id:'EXAMPLE-CREDIT-1021',category:type,title:'100 AI Coach Credits',subtitle:'One-time credit purchase',icon:'coach',status:'Completed',date:'2026-10-14T08:20:00Z',amount:499,currency:'USD',unit:'money'}
  ]
  if(type==='points-exchange')return [
    {id:'EXAMPLE-POINTS-1018',category:type,title:'15% Off Coupon',subtitle:'Equipment discount',icon:'ticket',status:'Exchanged',date,amount:3000,unit:'Points',quantity:1},
    {id:'EXAMPLE-POINTS-1006',category:type,title:'SunnyFit Water Bottle',subtitle:'Training essentials',icon:'shopping-bag',status:'Exchanged',date:'2026-10-06T13:10:00Z',amount:1500,unit:'Points',quantity:1}
  ]
  return [
    {id:'EXAMPLE-STAR-1016',category:type,title:'The Signature Strength Session',subtitle:'Course',icon:'play',image:'/assets/movement/real/bicep-curl.jpg',status:'Unlocked',date,amount:60,unit:'Content Credits'},
    {id:'EXAMPLE-STAR-1009',category:type,title:'Coastal Discovery',subtitle:'World Tour',icon:'play',status:'Unlocked',date:'2026-10-09T06:40:00Z',amount:40,unit:'Content Credits'}
  ]
}
module.exports={orderTypes,orderType,orderRecords,reviewOrderRecords}
