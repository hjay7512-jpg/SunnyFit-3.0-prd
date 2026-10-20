const test=require('node:test'),assert=require('node:assert/strict')
const {orderRecords,orderType,reviewOrderRecords}=require('../src/views/app/order-center.cjs')
const payment=(id,userId,kind,date)=>({id,userId,createdAt:date,product:{kind,name:kind==='membership'?'Premium':'AI Coach Credits'},sku:{priceCents:499,currency:'USD',billingPeriod:kind==='membership'?'monthly':null},status:'paid',fulfillment:'completed'})
test('Order center keeps payment snapshots and one-time credit purchases out of points exchanges',()=>{
  const data={user:{id:'A'},orders:[payment('subscription','A','membership','2026-10-01'),payment('credits','A','credits','2026-10-02'),payment('other-user','B','membership','2026-10-03')],ledger:[{creditType:'CONTENT_CREDIT',amount:30}]}
  const records=orderRecords(data,'subscription');assert.deepEqual(records.map(r=>r.id),['credits','subscription']);assert.equal(records[0].subtitle,'One-time credit purchase');assert.equal(records[0].unit,'money');assert.deepEqual(orderRecords(data,'points-exchange'),[])
})
test('Star Content uses owner redemption snapshots and preserves unknown historical prices',()=>{
  const data={user:{id:'A'},contents:[{id:'C',name:'Renamed course'}],redemptions:[{id:'new',userId:'A',contentId:'C',name:'Purchased course name',contentType:'course',createdAt:'2026-10-02',credits:60,creditType:'CONTENT_CREDIT',source:'credits',status:'active'},{id:'old',userId:'A',contentId:'C',createdAt:'2026-09-01',credits:0,source:'legacy_star',status:'active'},{id:'foreign',userId:'B',contentId:'C',createdAt:'2026-10-03'}]}
  const records=orderRecords(data,'star-content');assert.equal(records.length,2);assert.equal(records[0].title,'Purchased course name');assert.equal(records[0].unit,'Content Credits');assert.equal(records[0].amount,60);assert.equal(records[1].amount,null);assert.equal(records[1].unit,'legacy');assert.equal(data.redemptions[1].credits,0)
})
test('Review orders are explicit isolated examples and invalid categories have a stable default',()=>{
  assert.equal(orderType('broken'),'subscription');for(const type of ['subscription','points-exchange','star-content'])assert.ok(reviewOrderRecords(type).every(record=>record.id.startsWith('EXAMPLE-')&&record.category===type));assert.equal(reviewOrderRecords('points-exchange')[0].unit,'Points');assert.equal(reviewOrderRecords('star-content')[0].unit,'Content Credits')
})
