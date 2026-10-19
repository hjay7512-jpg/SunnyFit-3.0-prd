// Shared state machine: only pose events can increment vision reps.
class TrainingSession {
  constructor(steps,mode,options={}){this.steps=steps;this.mode=mode;this.index=0;this.reps=0;this.recognizedReps=0;this.guidedReps=0;this.seconds=0;this.elapsed=0;this.cadence=0;this.status='ready';this.phase='idle';this.phaseSeconds=0;this.countdownSeconds=options.countdownSeconds===undefined?3:options.countdownSeconds;this.results=[]}
  get current(){return this.steps[this.index]}
  get phaseRemaining(){return Math.max(0,Math.ceil(this.phaseSeconds))}
  countdown(){this.phaseSeconds=this.countdownSeconds;this.phase=this.phaseSeconds>0?'countdown':'exercise'}
  start(){if(this.status==='ready'){this.status='active';this.countdown()}}
  pause(){if(this.status==='active')this.status='paused'}
  resume(){if(this.status==='paused')this.status='active'}
  tick(delta){
    if(this.status!=='active'||!Number.isFinite(delta)||delta<=0)return
    if(this.phase==='rest'||this.phase==='countdown'){this.phaseSeconds=Math.max(0,this.phaseSeconds-delta);if(this.phaseSeconds===0){if(this.phase==='rest')this.countdown();else this.phase='exercise'}return}
    if(this.phase!=='exercise')return
    const step=this.current
    if(step.kind==='time'){const activeDelta=Math.min(delta,Math.max(0,step.target-this.seconds));this.elapsed+=activeDelta;this.seconds+=activeDelta;if(this.seconds>=step.target)this.advance(false)}
    else{this.elapsed+=delta;if(this.mode==='regular'){this.cadence+=delta;if(this.cadence>=(step.repSeconds||4)){this.cadence%=step.repSeconds||4;this.addRep('regular')}}}
  }
  recognizeRep(){if(this.mode==='vision'&&(this.current||{}).kind==='reps'&&this.status==='active'&&this.phase==='exercise')this.addRep('vision')}
  addRep(source){if(this.status!=='active'||this.phase!=='exercise'||this.current.kind!=='reps')return;this.reps++;if(source==='vision')this.recognizedReps++;else this.guidedReps++;if(this.reps>=this.current.target)this.advance(false)}
  skip(){if(this.status==='active'&&this.phase==='exercise')this.advance(true)}
  skipRest(){if(this.status==='active'&&this.phase==='rest')this.countdown()}
  advance(skipped){
    if(this.status!=='active'||this.phase!=='exercise')return
    const restSeconds=this.current.restSeconds||0
    this.results.push({index:this.index,exerciseId:this.current.exerciseId,kind:this.current.kind,target:this.current.target,reps:this.reps,recognizedReps:this.recognizedReps,guidedReps:this.guidedReps,seconds:this.seconds,skipped,remaining:Math.max(0,this.current.target-(this.current.kind==='reps'?this.reps:this.seconds))})
    this.index++;this.reps=0;this.recognizedReps=0;this.guidedReps=0;this.seconds=0;this.cadence=0
    if(this.index>=this.steps.length){this.status='complete';this.phase='complete';this.phaseSeconds=0}
    else if(restSeconds>0){this.phase='rest';this.phaseSeconds=restSeconds}
    else this.countdown()
  }
  end(){if(this.status!=='complete'){this.status='ended';this.phase='ended';this.phaseSeconds=0}}
}
function deviceCapability(nav={},hasWebGL=true){
  const cores=Number(nav.hardwareConcurrency),memory=Number(nav.deviceMemory)
  const low=(cores>0&&cores<4)||(memory>0&&memory<4)||!hasWebGL
  return {supported:!low,reason:low?'This device works best with Follow along. Vision recognition is unavailable.':'',provisional:!cores||!memory}
}
// The demo starts on person presence; full/upper framing remains configuration for a later strict check.
function assessPerson(landmarks){
  const visible=Array.isArray(landmarks)&&[0,11,12,23,24].some(i=>{const p=landmarks[i];return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&p.visibility>=.5})
  return {valid:!!visible,reason:visible?'Person detected. Stay in view.':'Step into view of the camera.'}
}
// Bounds match the guide rectangle. Coordinates are in the uncropped camera image.
function framingValid(landmarks,framing='full_body',bounds={left:.08,right:.92,top:.04,bottom:.96}){
  return assessFraming(landmarks,framing,bounds).valid
}
function assessFraming(landmarks,framing='full_body',bounds={left:.08,right:.92,top:.04,bottom:.96}){
  if(!landmarks)return {valid:false,reason:'No body detected. Step into the guide.'}
  const groups=[['head',[0]],['shoulders',[11,12]],['arms and hands',[13,14,15,16]],['hips',[23,24]]]
  if(framing==='full_body')groups.push(['knees and feet',[25,26,27,28]])
  for(const [name,indices] of groups){
    if(indices.some(i=>{const p=landmarks[i];return !p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.visibility)||p.visibility<.5||p.x<bounds.left||p.x>bounds.right||p.y<bounds.top||p.y>bounds.bottom}))return {valid:false,reason:'Keep your '+name+' inside the guide.'}
  }
  const width=Math.abs(landmarks[11].x-landmarks[12].x)
  if(width<=.08)return {valid:false,reason:'Move a little closer to the camera.'}
  if(width>=.65)return {valid:false,reason:'Step back to leave room for your movement.'}
  return {valid:true,reason:'Position found. Hold steady for 3 seconds.'}
}
class StabilityGate{
  constructor(){this.reset()}
  reset(){this.since=null;this.previous=null;this.anchor=null;this.lastAt=null;this.progress=0}
  update(valid,landmarks,now){
    const anchor=landmarks&&[landmarks[11],landmarks[12],landmarks[23],landmarks[24]].map(p=>p&&({x:p.x,y:p.y}))
    const moved=anchor&&this.previous&&anchor.some((p,i)=>!p||!this.previous[i]||Math.hypot(p.x-this.previous[i].x,p.y-this.previous[i].y)>.035||this.anchor&&Math.hypot(p.x-this.anchor[i].x,p.y-this.anchor[i].y)>.035)
    const gap=this.lastAt!==null&&now-this.lastAt>500
    this.lastAt=now;this.previous=anchor
    if(!valid||moved||gap){this.since=null;this.anchor=null;this.progress=0;return 0}
    if(this.since===null){this.since=now;this.anchor=anchor}
    this.progress=Math.min(3,(now-this.since)/1000)
    return this.progress
  }
}
class RecognitionPerformance{
  constructor(){this.samples=[];this.warmup=2}
  record(cost,now){
    if(this.warmup>0){this.warmup--;return false}
    this.samples.push({cost,now});this.samples=this.samples.filter(s=>now-s.now<=6500)
    if(this.samples.length<8||now-this.samples[0].now<5500)return false
    const mean=this.samples.reduce((n,s)=>n+s.cost,0)/this.samples.length,slow=this.samples.filter(s=>s.cost>350).length/this.samples.length,fps=(this.samples.length-1)/((now-this.samples[0].now)/1000)
    return mean>150||slow>=.15||fps<4
  }
}
module.exports={TrainingSession,deviceCapability,framingValid,assessFraming,assessPerson,StabilityGate,RecognitionPerformance}
