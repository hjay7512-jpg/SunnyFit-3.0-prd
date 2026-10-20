const test=require('node:test'),assert=require('node:assert/strict')
const {workoutRecap,workoutShareData}=require('../src/views/app/workout-recap.cjs')
test('sharing includes only workout stats and verified achievements, even when private fields are present',()=>{
 const workout={...workoutRecap(),rpe:8,heartRate:[99,126],aiAnalysis:'private analysis',userId:'private user',metrics:[...workoutRecap().metrics,{label:'RPE',value:8},{label:'Heart rate',value:126}],achievements:workoutRecap().achievements.map(a=>({...a,privateNote:'private note'}))}
 const shared=workoutShareData(workout),text=JSON.stringify(shared)
 assert.deepEqual(shared.metrics.map(m=>m.label),['Distance','Time','Calories']);assert.doesNotMatch(text,/private|RPE|heartRate|Heart rate|aiAnalysis|userId/)
 assert.equal(shared.achievements[0].previous,'8.1 mi');assert.equal(workout.rpe,8)
})
test('normal completion and unknown scenarios cannot fabricate a personal best',()=>{
 for(const key of ['none','unknown']){const result=workoutRecap(key);assert.deepEqual(result.achievements,[]);assert.equal(workoutShareData(result).achievements.length,0);assert.equal(result.metrics.length,3)}
})
test('a distance record carries the comparison while a cumulative milestone retains its own meaning',()=>{
 const record=workoutRecap('personal-best').achievements[0],milestone=workoutRecap('milestone').achievements[0]
 assert.equal(record.value,'8.6');assert.equal(record.previous,'8.1 mi');assert.equal(record.improvement,'+0.5 mi')
 assert.equal(milestone.kind,'milestone');assert.equal(milestone.value,'30');assert.equal(milestone.previous,undefined)
})
