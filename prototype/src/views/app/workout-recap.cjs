// Read-only workout fixtures for the interactive prototype. Records have explicit comparisons.
const base={
  title:'Indoor Cycling',dateLabel:'Today · 9:41 AM',duration:'40:23',distance:'8.6',distanceUnit:'mi',calories:'286',avgHeartRate:126,maxHeartRate:151,avgSpeed:'12.8',avgPower:142,
  metrics:[{label:'Distance',value:'8.6',unit:'mi'},{label:'Time',value:'40:23'},{label:'Calories',value:'286',unit:'kcal'}],
  previousSession:{distance:8.1,avgHeartRate:122},
  heartRate:[82,85,84,91,97,104,99,114,119,126,121,132,128,133,129,138,130,136,128,140,133,143,135,149,138,151,142,146,139,135],
  zones:[{label:'Zone 1',value:12,color:'#a9d991'},{label:'Zone 2',value:34,color:'#70b957'},{label:'Zone 3',value:42,color:'#ffc941'},{label:'Zone 4',value:12,color:'#f85d62'}]
}
const records={
  'personal-best':[{id:'longest-ride',title:'Your longest ride',value:'8.6',unit:'mi',previous:'8.1 mi',improvement:'+0.5 mi',kind:'personal-best'}],
  milestone:[{id:'rides-30',title:'30 rides completed',value:'30',unit:'rides',kind:'milestone'}],
  none:[]
}
const scenarios=Object.fromEntries(Object.entries(records).map(([id,achievements])=>[id,Object.freeze({...base,achievements})]))
function workoutRecap(scenario='personal-best'){return scenarios[scenario]||scenarios.none}
// Sharing intentionally excludes RPE, heart rate, AI analysis and account information.
function workoutShareData(workout){return {title:workout.title,metrics:workout.metrics.filter(metric=>['Distance','Time','Calories'].includes(metric.label)).map(({label,value,unit})=>({label,value,...(unit?{unit}:{})})),achievements:workout.achievements.map(({title,value,unit,previous,kind})=>({title,value,unit,kind,...(previous?{previous}:{})}))}}
module.exports={workoutRecap,workoutShareData}
