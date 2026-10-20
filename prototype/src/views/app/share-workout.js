import {workoutShareData} from './workout-recap.cjs'

export async function createWorkoutShareCard(workout){
  const data=workoutShareData(workout),canvas=document.createElement('canvas');canvas.width=720;canvas.height=900
  const ctx=canvas.getContext('2d'),background=ctx.createLinearGradient(0,0,720,900)
  background.addColorStop(0,'#fff1e5');background.addColorStop(.5,'#f9f8fe');background.addColorStop(1,'#edf3fc');ctx.fillStyle=background;ctx.fillRect(0,0,720,900)
  ctx.fillStyle='#e81d1d';ctx.font='bold 30px Arial';ctx.fillText('SunnyFit',48,72)
  const record=data.achievements[0]
  ctx.fillStyle='#765f38';ctx.font='20px Arial';ctx.fillText(record?record.kind==='milestone'?'A MILESTONE TO REMEMBER':'A NEW PERSONAL BEST':'ANOTHER RIDE, IN THE BOOKS',48,172)
  ctx.fillStyle='#19191f';ctx.font='bold 43px Arial';ctx.fillText(record?record.title:'Workout complete',48,235)
  ctx.font='bold 132px Arial';ctx.fillText(record?record.value:workout.distance,44,405)
  const valueWidth=ctx.measureText(record?record.value:workout.distance).width;ctx.font='30px Arial';ctx.fillStyle='#6d6770';ctx.fillText(record?record.unit:workout.distanceUnit,58+valueWidth,404)
  if(record?.previous){ctx.font='22px Arial';ctx.fillText('Previous best  '+record.previous,48,460)}
  ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.roundRect(32,515,656,204,28);ctx.fill()
  ctx.fillStyle='#555b66';ctx.font='22px Arial';ctx.fillText(data.title,54,558)
  const metrics=record?.kind==='milestone'?data.metrics:data.metrics.filter(metric=>metric.label!=='Distance')
  metrics.forEach((metric,index)=>{const x=54+index*(metrics.length===2?330:220);ctx.fillStyle='#73737d';ctx.font='18px Arial';ctx.fillText(metric.label,x,609);ctx.fillStyle='#19191f';ctx.font='bold 31px Arial';ctx.fillText(metric.value+(metric.unit?' '+metric.unit:''),x,657)})
  ctx.fillStyle='#777783';ctx.font='20px Arial';ctx.fillText('One workout. One step forward.',48,826)
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Unable to create image')
  return {blob,file:new File([blob],'SunnyFit-workout.png',{type:'image/png'}),url:URL.createObjectURL(blob)}
}
export function downloadWorkoutCard(card){const link=document.createElement('a');link.href=card.url;link.download=card.file.name;link.click()}
export function canShareWorkoutCard(card){return !!(card&&navigator.share&&navigator.canShare&&matchMedia('(pointer:coarse)').matches&&navigator.canShare({files:[card.file]}))}
