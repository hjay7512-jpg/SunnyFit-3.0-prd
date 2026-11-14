const {scenario,aggregate}=require('./scenario.cjs')
const manifest=require('./scene-manifest.cjs')
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a))
const ramp=(t,a,b)=>clamp((t-a)/(b-a))
const ease=n=>n*n*(3-2*n)
const tween=(t,a,b)=>ease(ramp(t,a,b))
const lerp=(a,b,p)=>a+(b-a)*p
const windowAt=(t,a,b,c,d)=>tween(t,a,b)*(1-tween(t,c,d))
const mixRect=(a,b,p)=>Object.fromEntries(['x','y','w','h','radius','roll'].map(k=>[k,lerp(a[k]||0,b[k]||0,p)]))
function getStoryState(seconds){
 const t=clamp(Number(seconds),0,72),scene=manifest.scenes.find(s=>t<s.end)||manifest.scenes[7]
 const records=scenario.workoutRecords.filter(r=>t>=r.completedAt),totals=aggregate(records)
 const dayIndex=t<36?0:t<38?1:t<40?2:t<42?3:t<44?4:t<45?5:t<46?6:7
 const date='2026-11-'+String(dayIndex+2).padStart(2,'0'),dateLabel=['Mon, Nov 2','Tue, Nov 3','Wed, Nov 4','Thu, Nov 5','Fri, Nov 6','Sat, Nov 7','Sun, Nov 8','Mon, Nov 9'][dayIndex]
 const workoutProgress=ramp(t,17,23.5),mon=scenario.workoutRecords[0]
 const recommendation=dayIndex<1?mon:dayIndex<4?scenario.workoutRecords[1]:scenario.workoutRecords[2]
 const session={seconds:Math.round(workoutProgress*mon.minutes*60),distanceMi:Math.round(workoutProgress*mon.distanceMi*100)/100,calories:Math.round(workoutProgress*mon.calories),speedMph:mon.speedMph}
 const homeOpacity=1-windowAt(t,14,17,31.8,34),resultOpacity=windowAt(t,23,25,32,34)
 return {time:t,scene:scene.index,sceneId:scene.id,date,dateLabel,dayIndex,records,totals,recommendation,reportReady:date>=scenario.report.availableDate,
 session,workoutProgress,resultStage:t<27?'complete':t<30?'effort':'summary',rpe:t>=28?mon.rpe:null,
 layers:{gym:1-tween(t,5,8),home:homeOpacity*(1-tween(t,46.8,49)),result:resultOpacity,player:windowAt(t,15.5,17,23,25),weekly:windowAt(t,47,49,58,60),community:windowAt(t,59,61,66,69),brand:tween(t,68.5,70.5),share:windowAt(t,56.5,58.5,66,69)},
 chart:tween(t,49,52),insight:tween(t,52,54),reactions:{likes:Math.round(scenario.socialPost.likes*tween(t,61,65)),comments:Math.round(scenario.socialPost.comments*tween(t,61.5,65))},
 orb:{head:{yaw:Math.sin(t*.7)*.12,pitch:Math.sin(t*3)*windowAt(t,28,29,32,33)*.16+.3*windowAt(t,33,34,38,39)},state:t<14?'responding':t<27?'idle':t<30?'listening':t<33?'responding':t<39?'thinking':t<60?'responding':'success',breath:1+Math.sin(t*2)*.018,blink:1-.92*Math.pow(Math.max(0,Math.cos(t*2.1)),24)},scenario}
}
const {project,homography,corners,plane,matrix3d}=require('./projection.cjs')
// This is a mounted screen in the ORIGINAL 1832 x 859 photograph, not a floating phone.
const mountedScreen=[[207,235],[240,236],[269,304],[234,303]]
const mixQuad=(a,b,p)=>a.map((point,i)=>point.map((v,j)=>lerp(v,b[i][j],p)))
function getGeometry(t,w,h){
 const mobile=w<760,baseScale=Math.min((w-(mobile?50:100))/375,(h-(mobile?135:100))/812)
 const zoom=1+(mobile?0:.20)*windowAt(t,8,11,14,17)+(mobile?.04:.12)*windowAt(t,26,28,31,34)
 const s=baseScale*zoom,focusY=mobile?406:lerp(406,365,windowAt(t,8,11,14,17))
 const target=corners(w/2-187.5*s,h/2-focusY*s,375*s,812*s)
 const photoScale=Math.max(w/1832,h/859)
 const photoInitial=[photoScale,0,mobile?w*.36-240*photoScale:(w-1832*photoScale)/2,0,photoScale,(h-859*photoScale)/2,0,0,1]
 const initial=mountedScreen.map(p=>project(photoInitial,p))
 // One set of screen corners defines BOTH the camera on the photo and the App projection.
 const travel=tween(t,1.2,8),center=quad=>[quad.reduce((sum,p)=>sum+p[0],0)/4,quad.reduce((sum,p)=>sum+p[1],0)/4]
 const origin=center(initial),destination=center(target)
 const initialHeight=Math.max(...initial.map(p=>p[1]))-Math.min(...initial.map(p=>p[1]))
 const cameraScale=Math.exp(Math.log(812*s/initialHeight)*travel)
 const carried=initial.map(p=>[lerp(origin[0],destination[0],travel)+(p[0]-origin[0])*cameraScale,lerp(origin[1],destination[1],travel)+(p[1]-origin[1])*cameraScale])
 const q=mixQuad(carried,target,tween(t,5.5,8))
 const camera=homography(mountedScreen,q),phone=plane(q,375,812,26)
 const projectUi=(x,y,width,height)=>corners(x,y,width,height).map(p=>project(phone.matrix,p))
 const uiPlane=(x,y,width,height,r=12)=>plane(projectUi(x,y,width,height),width,height,r)
 const homeQuad=projectUi(24,278,327,228),resultQuad=projectUi(16,92,343,144)
 const landscapeScale=Math.min((w-(mobile?24:72))/812,(h-(mobile?190:140))/375)
 const landQuad=corners((w-812*landscapeScale)/2,(h-375*landscapeScale)/2,812*landscapeScale,375*landscapeScale)
 let coverQuad=t<18?mixQuad(homeQuad,landQuad,tween(t,14,17.5)):mixQuad(landQuad,resultQuad,tween(t,23,25.5))
 if(t>=31.5)coverQuad=mixQuad(resultQuad,homeQuad,tween(t,31.5,34))
 // Let the media box reflow as its shape changes. Pixels keep their aspect ratio via object-fit.
 const boxWidth=Math.hypot(coverQuad[1][0]-coverQuad[0][0],coverQuad[1][1]-coverQuad[0][1])
 const boxHeight=Math.hypot(coverQuad[3][0]-coverQuad[0][0],coverQuad[3][1]-coverQuad[0][1])
 const cover=plane(coverQuad,boxWidth,boxHeight,lerp(12*s,mobile?12:20,windowAt(t,14,17.5,23,25.5)))
 const reportY=lerp(212,142,tween(t,46.8,49)),reportHeight=lerp(214,338,tween(t,46.8,49))
 const report=uiPlane(16,reportY,343,reportHeight,16)
 const shareScale=Math.min((w-70)/720,(h-150)/960)
 const shareHero=corners((w-720*shareScale)/2,(h-960*shareScale)/2,720*shareScale,960*shareScale)
 const share=plane(mixQuad(shareHero,projectUi(16,170,343,457.333),tween(t,58.5,61)),720,960,28)
 let orbQuad=mixQuad(projectUi(300,716,56,56),projectUi(16,216,48,48),windowAt(t,9,11,14,16))
 orbQuad=mixQuad(orbQuad,projectUi(290,470,44,44),windowAt(t,26,28,32,34))
 orbQuad=mixQuad(orbQuad,projectUi(16,216,48,48),windowAt(t,35,36,44,46))
 orbQuad=mixQuad(orbQuad,projectUi(290,600,44,44),windowAt(t,51,53,59,61))
 orbQuad=mixQuad(orbQuad,corners(w/2-65,h/2-65,130,130),tween(t,65,67))
 const big=Math.max(w,h)*2.5
 const orb=plane(mixQuad(orbQuad,corners(w/2-big/2,h/2-big/2,big,big),tween(t,67,69.5)),56,56)
 const mediaMask=windowAt(t,14,17.5,23,25.5)
 return {mobile,scale:s,phone,cover,report,share,orb,camera,mountedScreen,
   gymTransform:matrix3d(camera),gymBlur:12*tween(t,4,8),glassOpacity:.88*tween(t,7.5,11),
   phoneClip:mediaMask===0?'none':`inset(${278*mediaMask}px 0 ${306*mediaMask}px 0 round 26px)`,
   coverTextScale:lerp(Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1])/375,1,windowAt(t,14,17.5,23,25.5)),
   phoneOpacity:1-tween(t,66,69),coverOpacity:(1-tween(t,45.8,47))*(1-windowAt(t,25.5,27,33,34)),
   orbOpacity:tween(t,7,9)*(1-windowAt(t,15,17,24,26))*(1-tween(t,69,70.5))}
}
module.exports={getStoryState,getGeometry,clamp,ramp,tween,lerp,windowAt}
