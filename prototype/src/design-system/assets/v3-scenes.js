import workout from '../../../public/assets/figma/v3/workout/manifest.json'
import course from '../../../public/assets/figma/v3/course/manifest.json'
import training from '../../../public/assets/figma/v3/plan-training/manifest.json'
import recovery from '../../../public/assets/figma/v3/plan-recovery/manifest.json'
import completed from '../../../public/assets/figma/v3/plan-completed/manifest.json'
import paused from '../../../public/assets/figma/v3/plan-paused/manifest.json'
const manifests={workout,course,'plan-training':training,'plan-recovery':recovery,'plan-completed':completed,'plan-paused':paused}
export function sceneAsset(scene,name){const entry=manifests[scene]&&manifests[scene][name];if(!entry)throw Error('Unknown source asset: '+scene+'/'+name);return '/assets/figma/v3/'+scene+'/'+entry.file}
export const workoutNavigation=[{value:'home',label:'Home',action:'home',icon:sceneAsset('workout','imgFrame')},{value:'workout',label:'Workout',action:'workout',icon:sceneAsset('workout','imgFrame1')},{value:'challenge',label:'Challenge',action:'existing-challenge',icon:sceneAsset('workout','imgGroup')},{value:'social',label:'Social',action:'existing-social',icon:sceneAsset('workout','imgFrame2')}]
