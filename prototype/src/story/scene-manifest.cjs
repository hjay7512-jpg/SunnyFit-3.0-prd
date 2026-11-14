const alpha='t7g261XYs61EdvYzIZn5YL',base='2AT0tm9mkFhes8T81YzA2L'
const scenes=[
 ['home-gym',0,8,'Fitness starts at home.','A little space. A moment for yourself.',['576:1661'],[0,3.5,7.8]],
 ['home',8,16,'A clear next step.','A 30-minute run, ready when Alex is.',['578:2220'],[8.3,12,15.5]],
 ['workout',16,24,'Make this moment count.','One run. Connected equipment. Everything in view.',['578:2747'],[16.5,20,23.8]],
 ['result',24,33,'Your effort matters.','A quick check-in helps shape the next suggestion.',['581:2863','582:4141'],[24.8,28,32]],
 ['adaptation',33,48,'Guidance that listens.','A lighter next session. A routine with room for life.',['583:6157','584:6618','583:5287'],[34,40,47]],
 ['weekly',48,60,'See the week you built.','Three workouts. Small steps, adding up.',['7697:14248','6976:13221'],[49,54,59]],
 ['community',60,67,'Keep moving. Together.','Share a little progress. Find a little encouragement.',['585:8127'],[60.5,64,66.5]],
 ['brand',67,72,'SunnyFit 3.0','',['585:8777','585:8741','585:8788','585:8789'],[67.5,70,72]]
].map((s,i)=>({id:s[0],index:i+1,start:s[1],end:s[2],title:s[3],description:s[4],fileKey:i===5?base:alpha,nodeIds:s[5],keyStates:s[6].map((time,j)=>({id:`K${String(i+1).padStart(2,'0')}${'ABC'[j]}`,time}))}))
const transitions=[{time:8,anchors:['phone-screen']},{time:16,anchors:['recommendation-cover','workout-hero']},{time:24,anchors:['workout-hero','phone-screen']},{time:33,anchors:['phone-screen','orb']},{time:48,anchors:['report-card']},{time:60,anchors:['share-card']},{time:67,anchors:['orb']}]
module.exports={duration:72,fps:30,scenes,transitions,alpha,fileKey:alpha,storyboardNode:'575:1660'}
