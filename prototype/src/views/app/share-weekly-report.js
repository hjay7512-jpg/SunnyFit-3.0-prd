export async function shareWeeklyReport(report){
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=960;const context=canvas.getContext('2d')
  const gradient=context.createLinearGradient(0,0,720,960);gradient.addColorStop(0,'#ffefe9');gradient.addColorStop(.5,'#f5f8fe');gradient.addColorStop(1,'#eef4fc');context.fillStyle=gradient;context.fillRect(0,0,720,960)
  context.fillStyle='#e81d1d';context.font='bold 32px Arial';context.fillText('SunnyFit',48,70)
  context.fillStyle='#181c24';context.font='bold 42px Arial';context.fillText('My Weekly Report',48,148)
  context.font='24px Arial';context.fillText(report.weekStart+' – '+report.weekEnd,48,196)
  context.fillStyle='rgba(255,255,255,.8)';context.beginPath();context.roundRect(32,242,656,292,24);context.fill()
  const max=Math.max(1,...report.daily.map(day=>day.minutes));context.strokeStyle='#e81d1d';context.lineWidth=4;context.beginPath();report.daily.forEach((day,index)=>{const x=64+index*96,y=434-day.minutes/max*140;if(index)context.lineTo(x,y);else context.moveTo(x,y)});context.stroke()
  context.font='18px Arial';context.fillStyle='#657084';report.daily.forEach((day,index)=>context.fillText(day.day,48+index*96,486))
  const stats=[['Workouts',report.stats.workouts],['Active days',report.stats.activeDays],['Time (min)',report.stats.time],['Calories (kcal)',report.stats.calories]]
  stats.forEach(([label,value],index)=>{const x=48+(index%2)*340,y=594+Math.floor(index/2)*130;context.fillStyle='#657084';context.font='22px Arial';context.fillText(label,x,y);context.fillStyle='#181c24';context.font='bold 44px Arial';context.fillText(String(value),x,y+54)})
  context.fillStyle='#657084';context.font='20px Arial';context.fillText('Every workout is a step forward.',48,912)
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Share card unavailable')
  const file=new File([blob],'SunnyFit-week-'+report.weekStart+'.png',{type:'image/png'})
  if(navigator.share&&navigator.canShare&&matchMedia('(pointer:coarse)').matches&&navigator.canShare({files:[file]})){await navigator.share({title:'My SunnyFit week',files:[file]});return 'Your weekly report is ready to share.'}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return 'Your share card has been downloaded.'
}
