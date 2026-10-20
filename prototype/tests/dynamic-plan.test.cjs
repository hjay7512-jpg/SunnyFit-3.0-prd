const test=require('node:test'),assert=require('node:assert/strict')
const {createDynamicPlan,readDynamicPlans}=require('../src/views/app/dynamic-plan.cjs')
const context={ownerId:'USER-A',messageId:'message-1',createdAt:'2026-10-20T01:00:00.000Z'}
test('a generated plan keeps the chosen goal, frequency and duration across its card, schedule and saved snapshot',()=>{
 const plan=createDynamicPlan({goal:'weight-loss',days:3,minutes:15},context),saved=readDynamicPlans({schemaVersion:1,ownerId:'USER-A',draft:plan,active:null},'USER-A').draft
 assert.equal(saved.title,'Weight Loss Plan');assert.equal(saved.days,3);assert.equal(saved.minutes,15);assert.equal(saved.id,plan.id);assert.equal(saved.messageId,'message-1')
 assert.equal(saved.firstWeek.filter(d=>d.training).length,3);assert.ok(saved.firstWeek.filter(d=>d.training).every(d=>d.minutes===15))
})
test('foreign, corrupt and invalid snapshots cannot become a current plan',()=>{
 const plan=createDynamicPlan({goal:'strength',days:4,minutes:30},context),payload={schemaVersion:1,ownerId:'USER-A',draft:plan,active:null}
 assert.deepEqual(readDynamicPlans(payload,'USER-B'),{draft:null,active:null})
 assert.equal(readDynamicPlans({...payload,draft:{...plan,ownerId:'USER-B'}},'USER-A').draft,null)
 for(const request of [{goal:'unknown',days:3,minutes:15},{goal:'fitness',days:7,minutes:15},{goal:'fitness',days:3,minutes:0}])assert.equal(createDynamicPlan(request,context),null)
})
test('a fresh draft remains separate from an active plan and cannot replace its identity on restore',()=>{
 const active=createDynamicPlan({goal:'strength',days:4,minutes:30},{...context,id:'active-plan',status:'active'}),draft=createDynamicPlan({goal:'fitness',days:3,minutes:15},{...context,id:'new-draft',messageId:'message-2'})
 const saved=readDynamicPlans({schemaVersion:1,ownerId:'USER-A',draft,active},'USER-A')
 assert.equal(saved.active.id,'active-plan');assert.equal(saved.active.goal,'strength');assert.equal(saved.draft.id,'new-draft');assert.equal(saved.draft.goal,'fitness')
 assert.equal(readDynamicPlans({schemaVersion:1,ownerId:'USER-A',active:draft},'USER-A').active,null)
})
