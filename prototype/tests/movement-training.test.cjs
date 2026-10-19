const test=require('node:test'),assert=require('node:assert/strict')
const {TrainingSession,StabilityGate,framingValid,deviceCapability,assessFraming,assessPerson,RecognitionPerformance}=require('../src/features/movement/session.cjs')
const {defaultTraining,validateTraining}=require('../config/movement-training.cjs')
const reps={exerciseId:'seated_dumbbell_curl',phase:'main',kind:'reps',target:3,repSeconds:4},timed={exerciseId:'arm_circles',phase:'warmup',kind:'time',target:2}
const exerciseSession=(steps,mode)=>new TrainingSession(steps,mode,{countdownSeconds:0})
const {AlternatingCurlDetector}=require('../src/features/movement/curl-counter.cjs')
test('Every movement gets its own countdown, without training time or reps during preparation',()=>{
  const s=new TrainingSession([{...reps,target:1},{...timed,target:2}],'vision');s.start();assert.equal(s.phase,'countdown');s.recognizeRep();s.tick(2);assert.deepEqual([s.phaseRemaining,s.elapsed,s.reps,s.seconds],[1,0,0,0]);s.tick(1);assert.equal(s.phase,'exercise');assert.equal(s.elapsed,0);s.recognizeRep();assert.equal(s.index,1);assert.equal(s.phase,'countdown');s.tick(3);assert.equal(s.phase,'exercise');assert.equal(s.seconds,0);s.tick(2);assert.equal(s.status,'complete')
})
test('Timer boundaries charge only the remaining active time and never spill into countdown or rest',()=>{
  const s=new TrainingSession([{...timed,target:2,restSeconds:4},timed],'regular');s.start();s.tick(3);s.tick(1.9);s.tick(.3);assert.equal(s.elapsed,2);assert.equal(s.results[0].seconds,2);assert.equal(s.phaseSeconds,4);s.tick(4.5);assert.equal(s.phase,'countdown');assert.equal(s.phaseSeconds,3);assert.equal(s.elapsed,2)
})
test('Generated rest is respected; absent/zero rest never receives a fixed fallback',()=>{
  for(const restSeconds of [undefined,0,7]){const s=new TrainingSession([{...reps,target:1,restSeconds},reps],'vision');s.start();s.tick(3);s.recognizeRep();assert.equal(s.phase,restSeconds?'rest':'countdown');if(restSeconds){s.tick(2);assert.equal(s.phaseRemaining,5);s.recognizeRep();assert.equal(s.reps,0);assert.equal(s.elapsed,0);s.tick(5);assert.equal(s.phase,'countdown')}s.tick(3);assert.equal(s.phase,'exercise');assert.equal(s.seconds,0);assert.equal(s.results.length,1)}
})
test('Skipping rest is idempotent and cannot skip the upcoming movement or its countdown',()=>{
  const s=new TrainingSession([{...reps,target:1,restSeconds:10},{...reps,target:1,restSeconds:100}],'vision');s.start();s.tick(3);s.recognizeRep();s.skipRest();s.skipRest();s.skip();s.recognizeRep();assert.deepEqual([s.phase,s.index,s.results.length,s.reps],['countdown',1,1,0]);s.tick(3);s.recognizeRep();assert.equal(s.status,'complete');assert.equal(s.phase,'complete');assert.equal(s.results.length,2);s.tick(100);s.skipRest();assert.equal(s.results.length,2)
})
test('Pause and exit freeze countdown, exercise and prescribed rest without reinitializing the phase',()=>{
  const s=new TrainingSession([{...timed,target:2,restSeconds:4},timed],'regular');s.start();s.tick(1);s.pause();s.tick(90);assert.equal(s.phaseRemaining,2);s.resume();s.tick(2);s.tick(1);s.pause();s.tick(90);assert.equal(s.seconds,1);s.resume();s.tick(1);assert.equal(s.phase,'rest');s.tick(1);s.pause();s.tick(90);s.skipRest();assert.equal(s.phaseRemaining,3);s.resume();s.mode='vision';assert.equal(s.phase,'rest');s.tick(3);assert.equal(s.phase,'countdown');assert.equal(s.elapsed,2);s.end();assert.equal(s.status,'ended');s.tick(90);assert.equal(s.elapsed,2)
})
test('Generated rest durations validate as optional integer seconds and the sample schedules recovery after consecutive moves',()=>{
  const training=defaultTraining('studio');assert.equal(training.steps[2].restSeconds,0);assert.equal(training.steps[3].restSeconds,30);assert.equal(training.steps[4].restSeconds,0);assert.deepEqual(validateTraining(training),[]);for(const invalid of [-1,1.5,301,'20']){training.steps[2].restSeconds=invalid;assert.ok(validateTraining(training).some(e=>e.includes('rest')))}
})
test('Alternating curls count independently; simultaneous arms and partial cycles do not double-count',()=>{
  const detector=new AlternatingCurlDetector();let timestamp=0
  function feed(left,right){for(let frame=0;frame<2;frame++){const landmarks=pose();for(const [angle,shoulder,elbow,wrist,x]of [[left,11,13,15,.35],[right,12,14,16,.65]]){landmarks[shoulder]={x,y:.3,visibility:1};landmarks[elbow]={x,y:.5,visibility:1};landmarks[wrist]={x:x+.15*Math.sin(angle*Math.PI/180),y:.5-.15*Math.cos(angle*Math.PI/180),visibility:1}}detector.updatePose({landmarks,confidence:1,timestamp:timestamp+=100})}}
  feed(170,170);feed(110,170);feed(60,170);feed(110,170);feed(170,170);assert.equal(detector.getRepCount(),1)
  feed(170,110);feed(170,60);feed(170,110);feed(170,170);assert.equal(detector.getRepCount(),2)
  feed(110,110);feed(60,60);feed(110,110);feed(170,170);assert.equal(detector.getRepCount(),3)
  feed(110,170);feed(170,170);assert.equal(detector.getRepCount(),3);detector.reset();feed(60,170);feed(110,170);feed(170,170);assert.equal(detector.getRepCount(),0)
})
function pose(){return Array.from({length:33},(_,i)=>({x:i===11?.3:i===12?.7:.5,y:.5,visibility:1}))}
test('Demo starts on person presence without requiring hands, feet or complete torso; loss resets the three-second gate',()=>{
  const partial=Array.from({length:33},()=>({x:2,y:2,visibility:0}));partial[0]={x:.5,y:.2,visibility:.9}
  assert.equal(assessPerson(partial).valid,true);assert.equal(assessFraming(partial,'full_body').valid,false)
  assert.equal(assessPerson(null).valid,false);assert.equal(assessPerson([]).valid,false)
  const gate=new StabilityGate();for(let t=0;t<=3000;t+=100)gate.update(assessPerson(partial).valid,null,t)
  assert.equal(gate.progress,3);gate.update(assessPerson(null).valid,null,3100);assert.equal(gate.progress,0)
})
test('Vision repetition targets never advance on elapsed time',()=>{const s=exerciseSession([reps],'vision');s.start();s.tick(100);assert.equal(s.reps,0);assert.equal(s.index,0);s.recognizeRep();s.recognizeRep();s.recognizeRep();assert.equal(s.status,'complete');assert.equal(s.results[0].reps,3)})
test('Timed warmup and cooldown progress by time with recognition ignored',()=>{for(const phase of ['warmup','cooldown']){const s=exerciseSession([{...timed,phase},reps],'vision');s.start();s.recognizeRep();assert.equal(s.reps,0);s.tick(2);assert.equal(s.index,1);assert.equal(s.seconds,0);assert.equal(s.reps,0)}})
test('Regular guided reps use cadence and ignore recognition events',()=>{const s=exerciseSession([reps],'regular');s.start();s.recognizeRep();assert.equal(s.reps,0);s.tick(3.9);assert.equal(s.reps,0);s.tick(.1);assert.equal(s.reps,1)})
test('Mid-step fallback preserves recognized and guided counts separately',()=>{const s=exerciseSession([reps,reps],'vision');s.start();s.recognizeRep();s.mode='regular';s.tick(4);s.tick(4);assert.equal(s.index,1);assert.deepEqual([s.results[0].reps,s.results[0].recognizedReps,s.results[0].guidedReps],[3,1,2]);assert.equal(s.recognizedReps,0);s.tick(4);assert.equal(s.guidedReps,1)})
test('Pause freezes both timer and recognition',()=>{const s=exerciseSession([reps,timed],'vision');s.start();s.pause();s.tick(20);s.recognizeRep();assert.equal(s.elapsed,0);assert.equal(s.reps,0);s.resume();s.recognizeRep();assert.equal(s.reps,1)})
test('Skip preserves actual recognized reps and uncompleted target separately',()=>{const s=exerciseSession([reps,timed],'vision');s.start();s.recognizeRep();s.skip();assert.equal(s.index,1);assert.deepEqual([s.results[0].reps,s.results[0].remaining,s.results[0].skipped],[1,2,true]);s.tick(2);assert.equal(s.status,'complete');s.tick(100);assert.equal(s.results.length,2)})
test('Framing uses full body or upper body and image bounds',()=>{const p=pose();p[27].visibility=0;assert.equal(framingValid(p,'upper_body'),true);assert.equal(framingValid(p,'full_body'),false);p[15].x=.99;assert.equal(framingValid(p,'upper_body'),false)})
test('Stability requires continuous 3 seconds; absence, motion and frame gaps reset',()=>{const gate=new StabilityGate(),p=pose();assert.equal(gate.update(true,p,0),0);for(let t=100;t<=3000;t+=100)gate.update(true,p,t);assert.equal(gate.progress,3);gate.update(false,null,3100);assert.equal(gate.progress,0);gate.update(true,p,3200);gate.update(true,p,4000);assert.equal(gate.progress,0);const q=pose();q[11].x=.36;gate.update(true,q,4100);assert.equal(gate.progress,0)})
test('Device capability handles low memory, low cores, absent WebGL and unknown hints',()=>{assert.equal(deviceCapability({hardwareConcurrency:2,deviceMemory:8}).supported,false);assert.equal(deviceCapability({hardwareConcurrency:8,deviceMemory:2}).supported,false);assert.equal(deviceCapability({hardwareConcurrency:8,deviceMemory:8},false).supported,false);assert.equal(deviceCapability({hardwareConcurrency:8,deviceMemory:8}).supported,true);assert.equal(deviceCapability({}).provisional,true)})
test('Intermittent slow inference cannot leave setup silently waiting forever',()=>{const monitor=new RecognitionPerformance();let now=0,low=false;for(let i=0;i<100;i++){const cost=i%5===0?550:90;now+=cost+20;low=monitor.record(cost,now)||low}assert.equal(low,true);const fast=new RecognitionPerformance();for(let i=0;i<100;i++)assert.equal(fast.record(30,i*100),false)})
test('Framing reports the missing body region instead of a generic retry',()=>{const p=pose();p[27].visibility=0;assert.match(assessFraming(p,'full_body').reason,/feet/);assert.equal(assessFraming(p,'upper_body').valid,true);assert.match(assessFraming(null).reason,/No body/);p[11].visibility=0;assert.match(assessFraming(p,'upper_body').reason,/shoulders/)})
test('Stability rejects slow cumulative drift across the starting anchor',()=>{const gate=new StabilityGate();let maximum=0;for(let n=0;n<=35;n++){const p=pose();for(const i of [11,12,23,24])p[i].x+=n*.003;maximum=Math.max(maximum,gate.update(true,p,n*100))}assert.ok(maximum<3)})
test('Group configuration rejects unrecognized rep steps and insufficient framing',()=>{const group=defaultTraining('upper');assert.deepEqual(validateTraining(group),[]);group.steps[1].exerciseId='arm_circles';assert.ok(validateTraining(group).some(x=>x.includes('detector')));group.steps[1].exerciseId='bodyweight_squat';assert.ok(validateTraining(group).some(x=>x.includes('full-body')));group.steps[1].videoUrl='javascript:alert(1)';assert.ok(validateTraining(group).some(x=>x.includes('video')))})
test('Malformed steps return validation errors instead of a server exception',()=>{const group=defaultTraining('upper');group.steps=[null];assert.ok(validateTraining(group).includes('Choose a valid training step.'))})
test('Movement configuration persists through draft publication and additive fixture initialization',t=>{
  const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto'),{createStore}=require('../server/store.cjs'),{ensureMvpDemo}=require('../server/mvp-demo.cjs')
  const filename=path.resolve(__dirname,'../runtime/movement-domain-'+randomUUID()+'.sqlite');let store=createStore(filename)
  t.after(()=>{store.close();for(const suffix of ['','-wal','-shm'])fs.rmSync(filename+suffix,{force:true})})
  ensureMvpDemo(store,filename);const record=store.commerce.configList('content').find(c=>c.code==='vision_upper_starter'),training=defaultTraining('upper');training.steps[1].target=7;training.steps[1].restSeconds=17
  let draft=store.commerce.configSave('content',record.id,{...record.published,training},record.revision);store.commerce.configPublish('content',record.id,draft.revision)
  store.close();store=createStore(filename);ensureMvpDemo(store,filename);const saved=store.commerce.configDetail('content',record.id)
  assert.equal(saved.published.training.steps[1].target,7);assert.equal(saved.published.training.steps[1].restSeconds,17);assert.equal(store.commerce.configList('content').filter(c=>c.code==='vision_upper_starter').length,1)
  training.steps[1].exerciseId='bodyweight_squat';assert.throws(()=>store.commerce.configSave('content',record.id,{...saved.published,training},saved.revision),e=>e.reason==='INVALID_CONFIG')
})
test('Studio sample upgrades the original seven-step version once and preserves edits and drafts',t=>{
  const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto'),{DatabaseSync}=require('node:sqlite'),{createStore}=require('../server/store.cjs'),{ensureMvpDemo}=require('../server/mvp-demo.cjs')
  const filename=path.resolve(__dirname,'../runtime/movement-upgrade-'+randomUUID()+'.sqlite'),store=createStore(filename);ensureMvpDemo(store,filename)
  const db=new DatabaseSync(filename),record=store.commerce.configList('content').find(c=>c.code==='vision_studio_workout'),training=defaultTraining('studio');training.steps=training.steps.filter(s=>s.exerciseId!=='high_pull').map(({restSeconds,...s})=>s)
  t.after(()=>{db.close();store.close();for(const suffix of ['','-wal','-shm'])fs.rmSync(filename+suffix,{force:true})})
  const previous={...record.published,training},custom=JSON.parse(JSON.stringify(previous));custom.training.steps[2].target=9
  db.prepare('UPDATE commerce_versions SET payload=? WHERE config_id=? AND version=1').run(JSON.stringify(custom),record.id)
  ensureMvpDemo(store,filename);assert.equal(store.commerce.configDetail('content',record.id).published.training.steps.length,7)
  db.prepare('UPDATE commerce_versions SET payload=? WHERE config_id=? AND version=1').run(JSON.stringify(previous),record.id)
  const draft=store.commerce.configSave('content',record.id,{...previous,name:'My studio draft'},record.revision)
  ensureMvpDemo(store,filename);assert.equal(store.commerce.configDetail('content',record.id).draft.name,'My studio draft')
  store.commerce.configDiscard('content',record.id,draft.revision);ensureMvpDemo(store,filename)
  const upgraded=store.commerce.configDetail('content',record.id);assert.equal(upgraded.published.training.steps.length,8);assert.equal(upgraded.publishedVersion,2);assert.equal(upgraded.published.training.steps[4].exerciseId,'high_pull')
  ensureMvpDemo(store,filename);assert.equal(store.commerce.configDetail('content',record.id).revision,upgraded.revision);assert.equal(store.commerce.configHistory('content',record.id)[1].config.training.steps.length,7)
  const legacyEight={...upgraded.published,training:{...upgraded.published.training,steps:upgraded.published.training.steps.map(({restSeconds,...s})=>s)}}
  db.prepare('UPDATE commerce_versions SET payload=? WHERE config_id=? AND version=2').run(JSON.stringify(legacyEight),record.id);ensureMvpDemo(store,filename)
  const scheduled=store.commerce.configDetail('content',record.id);assert.equal(scheduled.publishedVersion,3);assert.equal(scheduled.published.training.steps[3].restSeconds,30);ensureMvpDemo(store,filename);assert.equal(store.commerce.configDetail('content',record.id).revision,scheduled.revision)
})
