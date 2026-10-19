// Authored motion illustrations, packaged as videos for the prototype player.
// Replace through the group's videoUrl fields when production clips are available.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{chromium}=require('playwright-core')
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/assets/movement/media'),frames=path.join(root,'runtime/movement-media-frames')
function render(kind,t){
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),W=600,H=800
  const wave=(1-Math.cos(t*Math.PI*2))/2
  ctx.clearRect(0,0,W,H)
  const wall=ctx.createLinearGradient(0,0,W,H);wall.addColorStop(0,'#eeece9');wall.addColorStop(.5,'#e2e5e6');wall.addColorStop(1,'#d9dede');ctx.fillStyle=wall;ctx.fillRect(0,0,W,H)
  ctx.fillStyle='#f6f6f2';ctx.fillRect(20,0,100,545);ctx.fillStyle='#ffffff80';ctx.fillRect(28,0,5,545);ctx.fillStyle='#d2d8d8';ctx.fillRect(119,0,5,545)
  ctx.fillStyle='#c3ccca';ctx.fillRect(0,613,W,6);const floor=ctx.createLinearGradient(0,618,0,H);floor.addColorStop(0,'#d9d8d4');floor.addColorStop(1,'#eeeae4');ctx.fillStyle=floor;ctx.fillRect(0,619,W,181)
  ctx.save();ctx.translate(535,540);ctx.fillStyle='#b3b7ae';ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(25,0);ctx.lineTo(18,63);ctx.lineTo(-18,63);ctx.closePath();ctx.fill();for(let i=0;i<7;i++){ctx.strokeStyle=i%2?'#74887a':'#8b9d8b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo((i-3)*8,-40,(i-3)*10,-80-Math.abs(i-3)*8);ctx.stroke();ctx.fillStyle=i%2?'#95a590':'#758c7e';ctx.beginPath();ctx.ellipse((i-3)*10,-80-Math.abs(i-3)*8,10,29,(i-3)*.2,0,Math.PI*2);ctx.fill()}ctx.restore()
  ctx.fillStyle='#b6b4b088';ctx.beginPath();ctx.ellipse(302,730,112,15,0,0,Math.PI*2);ctx.fill()
  const seated=!['squat','arm-circles','stretch'].includes(kind),drop=kind==='squat'?wave*100:0
  if(seated){ctx.fillStyle='#5c656d';ctx.fillRect(206,527,188,18);for(const x of [222,373]){ctx.fillStyle='#879097';ctx.fillRect(x,543,8,159)}ctx.fillStyle='#b0b8bc';ctx.fillRect(206,542,188,4)}
  const line=(a,b,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}
  const hips=[[274,488+drop],[326,488+drop]],knees=seated?[[249,586],[351,586]]:kind==='squat'?[[250-wave*25,609+drop*.25],[350+wave*25,609+drop*.25]]:[[266,599],[334,599]]
  for(let i=0;i<2;i++){const foot=[i?353:247,708];line(hips[i],knees[i],46,i?'#434e60':'#4c586b');line(knees[i],foot,34,i?'#4f5b6f':'#596578');line([foot[0],703],[foot[0]+(i?17:-17),718],19,'#e54d40');line([foot[0]+(i?-7:7),724],[foot[0]+(i?23:-23),724],7,'#eaeef0')}
  const sy=275+drop,shoulders=[[258,sy],[342,sy]],elbows=[],hands=[]
  for(let i=0;i<2;i++){const side=i?1:-1,sx=shoulders[i][0]
    if(kind==='curl'){elbows.push([sx+side*17,sy+91]);hands.push([sx+side*(24+wave*12),sy+165-wave*157])}
    else if(kind==='press'){elbows.push([sx+side*(36-wave*27),sy+18-wave*56]);hands.push([sx+side*(39-wave*15),sy-54-wave*65])}
    else if(kind==='raise'){elbows.push([sx+side*(18+wave*76),sy+88-wave*92]);hands.push([sx+side*(30+wave*130),sy+162-wave*158])}
    else if(kind==='arm-circles'){const a=t*Math.PI*2;elbows.push([sx+side*89,sy+Math.sin(a)*14]);hands.push([sx+side*153,sy+Math.sin(a)*37])}
    else if(kind==='stretch'){elbows.push([sx+side*25,sy+50]);hands.push([i?232:348,sy+18+wave*5])}
    else{elbows.push([sx+side*(20+wave*25),sy+82-wave*35]);hands.push([sx+side*(24+wave*70),sy+149-wave*95])}
  }
  for(let i=0;i<2;i++){line(shoulders[i],elbows[i],25,'#c9967c');line(elbows[i],hands[i],21,'#d9a78c');line([shoulders[i][0]-3,shoulders[i][1]], [elbows[i][0]-3,elbows[i][1]],7,'#e4b89d88')}
  const fabric=ctx.createLinearGradient(246,sy,358,sy+230);fabric.addColorStop(0,'#2d343a');fabric.addColorStop(.5,'#40484d');fabric.addColorStop(1,'#222c32');ctx.fillStyle=fabric;ctx.beginPath();ctx.moveTo(269,sy-15);ctx.quadraticCurveTo(298,sy+12,331,sy-15);ctx.lineTo(346,sy+32);ctx.quadraticCurveTo(328,sy+113,342,489+drop);ctx.quadraticCurveTo(300,509+drop,258,489+drop);ctx.quadraticCurveTo(272,sy+113,254,sy+32);ctx.closePath();ctx.fill();ctx.strokeStyle='#525b60';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(267,sy+59);ctx.quadraticCurveTo(300,sy+81,333,sy+59);ctx.stroke();ctx.fillStyle='#cf453b';ctx.fillRect(307,sy+53,13,3)
  ctx.fillStyle='#ce9b82';ctx.beginPath();ctx.roundRect(285,sy-57,30,48,12);ctx.fill();ctx.fillStyle='#373333';ctx.beginPath();ctx.ellipse(300,sy-98,40,52,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dca88c';ctx.beginPath();ctx.ellipse(300,sy-91,30,41,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#373333';ctx.beginPath();ctx.moveTo(269,sy-100);ctx.quadraticCurveTo(263,sy-153,306,sy-148);ctx.quadraticCurveTo(338,sy-145,336,sy-93);ctx.quadraticCurveTo(311,sy-115,309,sy-129);ctx.quadraticCurveTo(295,sy-104,269,sy-100);ctx.fill();ctx.fillStyle='#463b36';ctx.beginPath();ctx.ellipse(290,sy-91,2,1.5,0,0,7);ctx.ellipse(310,sy-91,2,1.5,0,0,7);ctx.fill();ctx.strokeStyle='#b27d6b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(301,sy-88);ctx.lineTo(299,sy-77);ctx.lineTo(302,sy-77);ctx.moveTo(294,sy-69);ctx.quadraticCurveTo(300,sy-66,306,sy-69);ctx.stroke()
  if(['curl','press','raise'].includes(kind))for(const [x,y]of hands){ctx.fillStyle='#707a80';ctx.beginPath();ctx.roundRect(x-19,y-4,38,8,3);ctx.fill();ctx.fillStyle='#313a40';for(const dx of [-24,14]){ctx.beginPath();ctx.roundRect(x+dx,y-16,10,32,3);ctx.fill();ctx.fillStyle='#54636d';ctx.fillRect(x+dx+2,y-14,2,28);ctx.fillStyle='#313a40'}}
  return canvas.toDataURL('image/png').split(',')[1]
}
async function main(){
  fs.mkdirSync(out,{recursive:true});fs.mkdirSync(frames,{recursive:true})
  const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage()
  try{await page.setContent('<canvas width="600" height="800"></canvas>');for(const kind of ['squat','curl','press','raise','arm-circles','stretch']){
    for(let i=0;i<72;i++){const png=await page.evaluate(({source,kind,t})=>{const renderer=(0,eval)('('+source+')');return renderer(kind,t)},{source:render.toString(),kind,t:i/72});fs.writeFileSync(path.join(frames,kind+'-'+String(i).padStart(3,'0')+'.png'),Buffer.from(png,'base64'));if(i===24)fs.writeFileSync(path.join(out,kind+'.png'),Buffer.from(png,'base64'))}
    const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','24','-i',path.join(frames,kind+'-%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-movflags','+faststart',path.join(out,kind+'.mp4')],{windowsHide:true,encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);console.log('Built '+kind)
  }fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({source:'Original authored motion illustrations for this local prototype. Not production trainer footage.',generator:'scripts/movement-demo-media.cjs',clips:['squat','curl','press','raise','arm-circles','stretch']},null,2))}finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
