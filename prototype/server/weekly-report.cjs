// Local workout fixtures are explicitly seeded review data, not completed
// workouts fabricated by a content access check. Base statistics stay free.
const RECOMMEND={build_muscle:[40,100,40],weight_loss:[100,100,100],health_vitality:[100,60,40],rehab_stretch:[40,50,100]}
function buildReport(input){
  const daily=Array.from({length:7},(_,index)=>({day:['MON','TUE','WED','THU','FRI','SAT','SUN'][index],date:new Date(Date.parse(input.weekStart+'T12:00:00Z')+index*86400000).toISOString().slice(0,10),minutes:0}))
  const dates=new Set(daily.map(day=>day.date))
  const workouts=(input.workouts||[]).filter(row=>dates.has(row.date)&&Number.isFinite(row.minutes)&&row.minutes>0&&Number.isFinite(row.calories)&&row.calories>=0)
  if(workouts.length<2)return {available:false,reason:'NOT_ENOUGH_WORKOUTS'}
  const totals={cardio:0,strength:0,mind_body:0}
  for(const workout of workouts){const day=daily.find(entry=>entry.date===workout.date);if(day)day.minutes+=workout.minutes;totals[workout.type in totals?workout.type:'cardio']+=workout.minutes}
  const time=Math.floor(daily.reduce((sum,day)=>sum+day.minutes,0)),activeDays=daily.filter(day=>day.minutes>0).length,max=Math.max(...Object.values(totals))
  return {available:true,id:input.weekStart,weekStart:input.weekStart,weekEnd:daily[6].date,timeZone:input.timeZone,goal:input.goal||null,daily,stats:{workouts:workouts.length,activeDays,time,calories:Math.floor(workouts.reduce((sum,row)=>sum+row.calories,0)*10)/10},mix:Object.entries(totals).map(([type,minutes])=>({type,minutes:Math.floor(minutes),index:max?Math.round(minutes/max*100):0})),recommend:input.goal&&RECOMMEND[input.goal]||null,template:`You stayed active across ${activeDays} days this week. Your ${time} minutes included ${Math.floor(totals.cardio)} minutes of cardio, ${Math.floor(totals.strength)} minutes of strength and ${Math.floor(totals.mind_body)} minutes of mind-body activity.`,recommendation:'Keep a comfortable rhythm, include different types of movement, and make time for recovery.',workouts,sample:!!input.sample}
}
module.exports={buildReport,RECOMMEND}
