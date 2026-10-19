import {PoseEngine} from '../../../vision-guide/src/engine/pose/PoseEngine'
import {SmoothingFilter} from '../../../vision-guide/src/engine/pose/SmoothingFilter'
import {SeatedCurlDetector} from '../../../vision-guide/src/engine/exercises/SeatedCurlDetector'
import {ShoulderPressDetector} from '../../../vision-guide/src/engine/exercises/ShoulderPressDetector'
import {LateralRaiseDetector} from '../../../vision-guide/src/engine/exercises/LateralRaiseDetector'
import {AlternatingCurlDetector} from './curl-counter.cjs'
export {PoseEngine,SmoothingFilter}
export function createDetector(id:string){
  if(id==='seated_dumbbell_curl')return new SeatedCurlDetector()
  if(id==='bicep_curl')return new AlternatingCurlDetector()
  if(id==='seated_dumbbell_shoulder_press')return new ShoulderPressDetector()
  if(id==='seated_dumbbell_lateral_raise')return new LateralRaiseDetector()
  if(id==='bodyweight_squat')return new SquatDetector()
  return null
}
class SquatDetector{
  count=0;phase='standing';armed=false
  updatePose(pose:any){
    const p=pose.landmarks
    const angles=[[23,25,27],[24,26,28]].map(indices=>{
      const [a,b,c]=indices.map(i=>p[i]);if(!a||!b||!c||Math.min(a.visibility,b.visibility,c.visibility)<.5)return null
      const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y}
      return Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))))*180/Math.PI
    }).filter(x=>x!==null) as number[]
    if(!angles.length)return
    const angle=angles.reduce((a,b)=>a+b,0)/angles.length
    if(angle>160){if(this.phase==='down')this.count++;this.phase='standing';this.armed=true}
    else if(angle<110&&this.armed)this.phase='down'
  }
  getRepCount(){return this.count}
  reset(){this.count=0;this.phase='standing';this.armed=false}
}
