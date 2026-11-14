// Marketing proposal only. Local civil dates; never derive dates from the host clock.
const workoutRecords = Object.freeze([
  Object.freeze({id:'w-mon',date:'2026-11-02',title:'Treadmill Run',type:'Cardio',minutes:30,calories:210,distanceMi:2.5,speedMph:5,rpe:7,completedAt:24}),
  Object.freeze({id:'w-wed',date:'2026-11-04',title:'Recovery Mobility',type:'Mobility',minutes:20,calories:65,completedAt:39}),
  Object.freeze({id:'w-fri',date:'2026-11-06',title:'Full Body Strength',type:'Strength',minutes:25,calories:120,completedAt:43})
])
function aggregate(records){return {workouts:records.length,activeDays:new Set(records.map(r=>r.date)).size,time:records.reduce((s,r)=>s+r.minutes,0),calories:records.reduce((s,r)=>s+r.calories,0)}}
const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const daily=days.map((day,i)=>{const date='2026-11-'+String(i+2).padStart(2,'0'),records=workoutRecords.filter(r=>r.date===date);return {day,date,minutes:aggregate(records).time,calories:aggregate(records).calories}})
const stats=Object.freeze(aggregate(workoutRecords))
const report=Object.freeze({period:['2026-11-02','2026-11-08'],availableDate:'2026-11-09',stats,daily,mix:['Cardio','Mobility','Strength'].map(type=>({type,minutes:workoutRecords.filter(r=>r.type===type).reduce((s,r)=>s+r.minutes,0)}))})
const scenario=Object.freeze({persona:{name:'Alex',goal:'Build a consistent at-home workout routine',timezone:'America/Los_Angeles'},label:'Simulated marketing scenario',workoutRecords,report,shareCard:{stats,period:report.period},socialPost:{author:'Alex',date:'2026-11-09',card:{stats,period:report.period},likes:128,comments:18},resultInsight:'Nice work, Alex. You finished your 30-minute run. Since it felt challenging, consider a lighter recovery session next.',weeklyInsight:`You completed ${stats.workouts} workouts and ${stats.time} minutes this week, including cardio, mobility, and strength. Keep building on that consistency.`})
module.exports={scenario,aggregate,workoutRecords}
