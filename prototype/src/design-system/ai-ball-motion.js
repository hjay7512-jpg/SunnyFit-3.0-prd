const rad = degrees => degrees * Math.PI / 180
const clamp = value => Math.max(0, Math.min(1, value))
const settle = value => {const t=clamp(value);return t*t*t*(10+t*(-15+6*t))}
const eyes = [{x:24,y:30.5},{x:32,y:30.5}]

// Original 01 and 07 eye anchors, calibrated against their screenshots.
// The right frame uses a reflected local Y axis; its metadata Y is not the visual top.
function referenceEyes(side) {
  const angle=side<0?12:-14,theta=rad(angle)
  return [2,10].map(x=>{
    const y=side<0?4.5:-4.5
    return {x:(side<0?17.87109375:29.177297592163086)+x*Math.cos(theta)-y*Math.sin(theta),
      y:(side<0?19:30.467041015625)+x*Math.sin(theta)+y*Math.cos(theta)}
  })
}
function projectEye(eye,yaw,pitch) {
  const x=eye.x-28,y=eye.y-28,z=Math.sqrt(20*20-x*x-y*y)
  const a=rad(yaw*18),b=rad(pitch*18)
  const rotatedX=x*Math.cos(a)+z*Math.sin(a),rotatedZ=z*Math.cos(a)-x*Math.sin(a)
  return {x:28+rotatedX,y:28+y*Math.cos(b)-rotatedZ*Math.sin(b)}
}
export function projectHead(yaw,pitch) {
  const side=yaw<0?-1:1,reference=referenceEyes(side),amount=Math.abs(yaw)*Math.max(0,pitch)
  const projected=eyes.map((eye,index)=>{
    const point=projectEye(eye,yaw,pitch),endpoint=projectEye(eye,side,1)
    return {x:point.x+amount*(reference[index].x-endpoint.x),y:point.y+amount*(reference[index].y-endpoint.y)}
  })
  const angle=Math.atan2(projected[1].y-projected[0].y,projected[1].x-projected[0].x)*180/Math.PI
  return {eyes:projected.map(point=>({...point,angle})),colours:{x:yaw*(yaw<0?2:3),y:-6*pitch}}
}
const directions={center:{yaw:0,pitch:0},left:{yaw:-1,pitch:1},right:{yaw:1,pitch:1},up:{yaw:0,pitch:1},down:{yaw:0,pitch:-.45}}
function glance(time,start,side) {
  const t=time-start
  if(t<0||t>=3600)return {yaw:0,pitch:0}
  const q=t<1400?settle(t/1400):t<2300?1:1-settle((t-2300)/1300)
  return {yaw:side*q,pitch:q}
}
export function activityHead(state,gaze,elapsed) {
  if(gaze!=='auto')return directions[gaze]||directions.center
  if(state==='idle') {
    const time=elapsed%30000
    return time<15000?glance(time,6000,-1):glance(time,21000,1)
  }
  if(state==='listening')return {yaw:.16,pitch:-.2}
  if(state==='thinking')return {yaw:.16*Math.sin(elapsed/1600),pitch:.3+.045*Math.sin(elapsed/2200)}
  if(state==='responding')return {yaw:.12,pitch:-.12}
  return directions.center
}
export function blendHead(from,to,elapsed,duration=1000) {
  const q=settle(elapsed/duration)
  return {yaw:from.yaw+(to.yaw-from.yaw)*q,pitch:from.pitch+(to.pitch-from.pitch)*q}
}
