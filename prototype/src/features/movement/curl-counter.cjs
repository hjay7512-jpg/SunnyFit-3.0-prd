// Count complete elbow-flexion cycles independently, including alternating curls.
// Two arms returning together form one repetition; alternating returns count separately.
class AlternatingCurlDetector{
  constructor(){this.reset()}
  reset(){this.count=0;this.arms=[{phase:'IDLE',pending:'',frames:0},{phase:'IDLE',pending:'',frames:0}];this.lastReturn=null}
  getRepCount(){return this.count}
  getCurrentPhase(){return this.arms.map(a=>a.phase).join('/')}
  updatePose(pose){
    if(!pose||pose.confidence<.3)return
    const now=Number.isFinite(pose.timestamp)?pose.timestamp:performance.now()
    for(const [side,indices] of [[0,[11,13,15]],[1,[12,14,16]]]){
      const [a,b,c]=indices.map(i=>pose.landmarks[i]),state=this.arms[side]
      if(!a||!b||!c||Math.min(a.visibility,b.visibility,c.visibility)<.5){state.phase='IDLE';state.pending='';state.frames=0;continue}
      const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y,mag=Math.hypot(ux,uy)*Math.hypot(vx,vy)
      if(!mag)continue
      const angle=Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/mag)))*180/Math.PI
      let next=state.phase
      if(state.phase==='IDLE'&&angle>=145)next='REST'
      else if(state.phase==='REST'&&angle<120)next='LIFT'
      else if(state.phase==='LIFT'&&angle<75)next='TOP'
      else if(state.phase==='TOP'&&angle>100)next='LOWER'
      else if(state.phase==='LOWER'&&angle>=145)next='REST'
      if(next===state.phase){state.pending='';state.frames=0;continue}
      state.frames=next===state.pending?state.frames+1:1;state.pending=next
      if(state.frames<2)continue
      if(state.phase==='LOWER'&&next==='REST'){
        if(!this.lastReturn||this.lastReturn.side===side||now-this.lastReturn.at>300)this.count++
        this.lastReturn={side,at:now}
      }
      state.phase=next;state.pending='';state.frames=0
    }
  }
}
module.exports={AlternatingCurlDetector}
