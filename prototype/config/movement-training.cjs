// Local prototype content. These targets and device thresholds are review parameters.
const exercises = [
  {id:'shoulder_rolls',name:'Shoulder Rolls',hint:'Roll your shoulders slowly. Keep your neck relaxed.',detector:null,video:'shoulder-rolls',real:true},
  {id:'shoulder_car',name:'Shoulder CAR',hint:'Move slowly through a comfortable shoulder range.',detector:null,video:'shoulder-car',real:true},
  {id:'arm_triceps_stretch',name:'Arm Triceps Stretch',hint:'Keep your ribs relaxed and breathe through the stretch.',detector:null,video:'arm-triceps-stretch',real:true},
  {id:'chest_opener',name:'Chest Opener',hint:'Open your chest gently. Keep your shoulders relaxed.',detector:null,video:'chest-opener',real:true},
  {id:'jm_press',name:'JM Press',hint:'Follow the trainer. Lower with control and keep your elbows steady.',detector:null,video:'jm-press',real:true},
  {id:'bicep_curl',name:'Bicep Curl',hint:'Each alternating curl counts as one rep. Keep your upper arms still.',detector:'curl',video:'bicep-curl',real:true},
  {id:'woodchop',name:'Woodchop',hint:'Turn with control and follow the trainer through the diagonal movement.',detector:null,video:'woodchop',real:true},
  {id:'high_pull',name:'High Pull',hint:'Follow the trainer. Pull with control and keep the weight close to your body.',detector:null,video:'high-pull',real:true},
  {id:'arm_circles',name:'Arm circles',hint:'Relax your shoulders. Make slow, smooth circles.',detector:null,video:'arm-circles'},
  {id:'bodyweight_squat',name:'Bodyweight squat',hint:'Sit your hips back, then return to standing.',detector:'squat',video:'squat'},
  {id:'seated_dumbbell_curl',name:'Dumbbell curl',hint:'Keep your elbows still. Lower with control.',detector:'curl',video:'curl'},
  {id:'seated_dumbbell_shoulder_press',name:'Shoulder press',hint:'Press up evenly, then lower to shoulder height.',detector:'press',video:'press'},
  {id:'seated_dumbbell_lateral_raise',name:'Lateral raise',hint:'Raise to shoulder height. Keep your torso steady.',detector:'raise',video:'raise'},
  {id:'shoulder_stretch',name:'Shoulder stretch',hint:'Relax into the stretch and breathe naturally.',detector:null,video:'stretch'}
]
const step=(exerciseId,phase,kind,target,restSeconds=0)=>({exerciseId,phase,kind,target,repSeconds:4,restSeconds})
const templates={
  studio:{vision:{supported:true,framing:'full_body'},steps:[step('shoulder_rolls','warmup','time',20),step('shoulder_car','warmup','time',20),step('bicep_curl','main','reps',10),step('jm_press','main','time',30,30),step('high_pull','main','time',30),step('woodchop','main','time',30),step('arm_triceps_stretch','cooldown','time',20),step('chest_opener','cooldown','time',20)]},
  upper:{vision:{supported:true,framing:'upper_body'},steps:[step('arm_circles','warmup','time',20),step('seated_dumbbell_curl','main','reps',10),step('seated_dumbbell_shoulder_press','main','reps',8,20),step('seated_dumbbell_lateral_raise','main','reps',8),step('shoulder_stretch','cooldown','time',20)]},
  full:{vision:{supported:true,framing:'full_body'},steps:[step('arm_circles','warmup','time',20),step('bodyweight_squat','main','reps',10,20),step('bodyweight_squat','main','reps',10),step('shoulder_stretch','cooldown','time',20)]},
  regular:{vision:{supported:false,framing:'full_body'},steps:[step('arm_circles','warmup','time',20),step('bodyweight_squat','main','reps',12),step('shoulder_stretch','cooldown','time',20)]}
}
function defaultTraining(template='regular'){return JSON.parse(JSON.stringify(templates[template]||templates.regular))}
function validateTraining(training){
  const errors=[]
  if(!training||typeof training!=='object')return ['Movement training configuration is required.']
  if(typeof (training.vision||{}).supported!=='boolean')errors.push('Choose whether this group supports vision recognition.')
  if(!['full_body','upper_body'].includes((training.vision||{}).framing))errors.push('Choose full-body or upper-body framing.')
  if(!Array.isArray(training.steps)||!training.steps.length||training.steps.length>40)return [...errors,'Choose 1–40 training steps.']
  let phaseIndex=-1
  for(const item of training.steps){
    if(!item||typeof item!=='object'||Array.isArray(item)){errors.push('Choose a valid training step.');continue}
    const exercise=exercises.find(e=>e.id===item.exerciseId),index=['warmup','main','cooldown'].indexOf(item.phase)
    if(!exercise)errors.push('Choose a supported exercise for every step.')
    if(index<0||index<phaseIndex)errors.push('Keep steps in Warm-up, Workout, Cooldown order.')
    phaseIndex=index
    if(!['time','reps'].includes(item.kind)||!Number.isInteger(item.target)||item.target<1||item.target>(item.kind==='time'?600:100))errors.push('Targets must be 1–600 seconds or 1–100 reps.')
    if(item.kind==='reps'&&(!Number.isFinite(item.repSeconds)||item.repSeconds<1||item.repSeconds>10))errors.push('Default rep cadence must be 1–10 seconds.')
    if(item.restSeconds!==undefined&&(!Number.isInteger(item.restSeconds)||item.restSeconds<0||item.restSeconds>300))errors.push('Scheduled rest must be 0–300 seconds.')
    if((training.vision||{}).supported&&item.kind==='reps'&&!(exercise||{}).detector)errors.push('Vision rep steps need an available recognition detector.')
    if((training.vision||{}).supported&&training.vision.framing==='upper_body'&&item.exerciseId==='bodyweight_squat')errors.push('Squats require full-body framing.')
    if(item.videoUrl&&!(typeof item.videoUrl==='string'&&(/^(https:\/\/[^\s]+|\/assets\/[\w/.-]+\.(mp4|webm))$/.test(item.videoUrl))))errors.push('Exercise video must use HTTPS or a local /assets/ video path.')
  }
  if(!training.steps.some(s=>s&&s.phase==='main'))errors.push('Include at least one Workout step.')
  return [...new Set(errors)]
}
function describeTraining(training){return (training.vision.supported?'Vision supported · '+(training.vision.framing==='upper_body'?'Upper body':'Full body')+' · Stable for 3s':'Follow along only')+' | '+training.steps.map(s=>((exercises.find(e=>e.id===s.exerciseId)||{}).name||s.exerciseId)+': '+s.target+' '+(s.kind==='time'?'sec':'reps')).join('; ')}
module.exports={exercises,templates,defaultTraining,validateTraining,describeTraining}
